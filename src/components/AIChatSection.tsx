import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle,
  Trash2, Download, Sparkles, Menu, Paperclip, FileText,
  X, Plus, ChevronLeft, Clock, MessageSquare, Zap,
  BookOpen, ExternalLink, Search, CheckCircle, AlertTriangle,
} from 'lucide-react';

// ─── PDF.js worker ──────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Source {
  name: string;
  url: string;
  courseCode: string;
  type: string;
  isValid: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  time: string;
  timestamp?: number;
  sources?: Source[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastModified: number;
}

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface BlobFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  url: string;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const isAPIKeyConfigured = GROQ_API_KEY && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY !== '';

/* ─── Course keyword map ─────────────────────────────────────────────────── */
const COURSE_KEYWORDS: Record<string, string[]> = {
  CS321: ['programming language', 'paradigm', 'functional', 'prolog', 'haskell', 'lambda', 'type system', 'syntax', 'semantics', 'compiler', 'interpreter', 'object oriented', 'declarative', 'imperative', 'cs321'],
  CS322: ['software engineering', 'sdlc', 'agile', 'scrum', 'design pattern', 'uml', 'requirements', 'testing', 'sprint', 'kanban', 'waterfall', 'project management', 'cs322'],
  CS323: ['ethics', 'social issue', 'professional practice', 'intellectual property', 'privacy', 'copyright', 'cybercrime', 'legal', 'acm code', 'professional responsibility', 'cs323'],
  CS324: ['graphics', 'visual computing', 'rendering', 'opengl', '3d', 'animation', 'rasterization', 'shading', 'texture', 'polygon', 'ray tracing', 'computer graphics', 'cs324'],
  CS325: ['mobile', 'android', 'ios', 'flutter', 'react native', 'mobile development', 'mobile app', 'responsive', 'smartphone', 'tablet', 'cs325'],
  CS326: ['modeling', 'simulation', 'discrete event', 'monte carlo', 'queuing', 'stochastic', 'continuous simulation', 'system dynamics', 'cs326'],
  CS327: ['data mining', 'clustering', 'classification', 'association rule', 'apriori', 'decision tree', 'naive bayes', 'k-means', 'pattern discovery', 'cs327'],
  CS328: ['machine learning', 'neural network', 'deep learning', 'gradient descent', 'backpropagation', 'supervised', 'unsupervised', 'reinforcement learning', 'cnn', 'rnn', 'transformer', 'cs328'],
};

/* ─── RAG: detect relevant courses ───────────────────────────────────────── */
function detectRelevantCourses(message: string): string[] {
  const lower = message.toLowerCase();
  const detected: string[] = [];
  for (const [code, keywords] of Object.entries(COURSE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) detected.push(code);
  }
  return detected.length > 0 ? detected : Object.keys(COURSE_KEYWORDS);
}

/* ─── RAG: fetch actual course files from Vercel Blob ─────────────────────── */
async function fetchCourseFiles(courseCode: string): Promise<BlobFile[]> {
  try {
    const res = await fetch(`/api/list-files?moduleId=${courseCode}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}

/* ─── RAG: extract text from PDF ─────────────────────────────────────────── */
async function extractPDFText(url: string, maxChars = 3000): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ url }).promise;
    const maxPages = Math.min(pdf.numPages, 4);
    const texts: string[] = [];
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texts.push(content.items.map((item: any) => item.str).join(' '));
    }
    return texts.join('\n\n').substring(0, maxChars);
  } catch {
    return '';
  }
}

/* ─── RAG: extract text from plain text file ──────────────────────────────── */
async function extractPlainText(url: string, maxChars = 3000): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const text = await res.text();
    return text.substring(0, maxChars);
  } catch {
    return '';
  }
}

/* ─── RAG: build context from ACTUAL course files only ────────────────────── */
async function buildRAGContext(
  userMessage: string
): Promise<{ contextBlock: string; sources: Source[] }> {
  const relevantCourses = detectRelevantCourses(userMessage);
  const allFiles: (BlobFile & { courseCode: string })[] = [];

  await Promise.all(
    relevantCourses.map(async (code) => {
      const files = await fetchCourseFiles(code);
      files.forEach((f) => allFiles.push({ ...f, courseCode: code }));
    })
  );

  if (allFiles.length === 0) {
    return { 
      contextBlock: '', 
      sources: [] 
    };
  }

  // Extract text from actual files (max 3 to keep context manageable)
  const extractable = allFiles
    .filter((f) => {
      const lower = f.name.toLowerCase();
      return lower.endsWith('.pdf') || lower.endsWith('.txt') || lower.endsWith('.md');
    })
    .slice(0, 3);

  const sources: Source[] = [];
  const contextParts: string[] = [];

  for (const file of extractable) {
    const lower = file.name.toLowerCase();
    let text = '';

    if (lower.endsWith('.pdf')) {
      text = await extractPDFText(file.url);
    } else if (lower.endsWith('.txt') || lower.endsWith('.md')) {
      text = await extractPlainText(file.url);
    }

    if (text.trim().length > 100) {
      const validSource: Source = {
        name: file.name,
        url: file.url,
        courseCode: file.courseCode,
        type: file.type || lower.split('.').pop() || 'file',
        isValid: true,
      };
      sources.push(validSource);
      contextParts.push(
        `[COURSE MATERIAL: ${file.name} | Course: ${file.courseCode}]\n${text}\n`
      );
    }
  }

  return {
    contextBlock: contextParts.join('\n\n'),
    sources,
  };
}

/* ─── Render text with inline links ──────────────────────────────────────── */
function RenderTextWithLinks({ text }: { text: string }) {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:text-accent font-medium"
      >
        {match[1]}
        <ExternalLink className="w-2.5 h-2.5" />
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

/* ─── Source card component ──────────────────────────────────────────────── */
const SourceCard: React.FC<{ source: Source; index: number }> = ({ source, index }) => (
  <a
    href={source.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-green-50 border-green-200 text-green-700 text-xs font-medium hover:shadow-md transition-all group"
  >
    <CheckCircle className="w-3 h-3 text-green-600" />
    <span className="font-mono text-green-600 font-bold">[{index}]</span>
    <span className="truncate max-w-[180px]">{source.name}</span>
    {source.courseCode && (
      <span className="font-mono text-green-500 text-[10px] px-1 py-0.5 bg-green-100 rounded">
        {source.courseCode}
      </span>
    )}
    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
  </a>
);

/* ─── Typing indicator ───────────────────────────────────────────────────── */
const TypingDots = ({ label = '' }: { label?: string }) => (
  <div className="flex items-center gap-2">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
    {label && <span className="text-xs text-gray-400">{label}</span>}
  </div>
);

/* ─── Message bubble with references section ─────────────────────────────── */
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.type === 'user';
  const hasSources = !isUser && msg.sources && msg.sources.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary/15' : 'bg-primary/10'
      }`}>
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm border shadow-sm'
        }`}>
          {isUser ? msg.text : <RenderTextWithLinks text={msg.text} />}
        </div>

        {hasSources && (
          <div className="mt-2 pt-2 border-t border-gray-200 w-full">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-gray-700">REFERENCES</span>
              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {msg.sources!.length} {msg.sources!.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {msg.sources!.map((src, idx) => (
                <SourceCard key={idx} source={src} index={idx + 1} />
              ))}
            </div>
          </div>
        )}

        <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
      </div>
    </motion.div>
  );
};

/* ─── Session list item ──────────────────────────────────────────────────── */
const SessionItem: React.FC<{
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ session, isActive, onClick, onDelete }) => (
  <div
    onClick={onClick}
    className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
      isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-50'
    }`}
  >
    <MessageSquare className={`w-4 h-4 mt-0.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{session.title}</p>
      <div className="flex gap-2 mt-0.5">
        <span className="text-xs text-gray-400">{new Date(session.lastModified).toLocaleDateString()}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-400">{session.messages.length} msgs</span>
      </div>
    </div>
    <button
      onClick={onDelete}
      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

/* ─── Groq API call - NO FAKE REFERENCES, only use actual context ─────────── */
async function callGroqAPI(
  userMessage: string,
  chatHistory: Message[],
  ragContext: string,
  ragSources: Source[],
  attachedFileContent?: string
): Promise<{ text: string; sources: Source[] }> {
  const hasContext = ragContext.trim().length > 0;

  const systemPrompt = `You are Sphere, an academic CS assistant for LearnSphere.

**IMPORTANT RULES ABOUT CITATIONS:**
1. ONLY cite sources that are PROVIDED in the context below
2. If no course materials are available, answer based on your knowledge WITHOUT inventing sources
3. DO NOT make up fake URLs, papers, or references
4. DO NOT cite Wikipedia, random blogs, or commercial sites
5. When citing, use this format: [Actual Document Name](actual-url-from-context)

${hasContext ? 
`**ACTUAL COURSE MATERIALS YOU CAN CITE:**
${ragContext}

These are the ONLY sources you can cite. If you use information from them, cite them using [filename](url).` : 
`**NO COURSE MATERIALS AVAILABLE**
You cannot cite any sources. Provide a helpful answer based on your knowledge, but do NOT invent fake citations or references.`}

**RESPONSE GUIDELINES:**
- Be concise and educational
- If you have course materials, cite them naturally in your answer
- If you don't have materials, just answer without citations
- NEVER include a "References" section - sources will be displayed separately
- NEVER invent URLs or document names

Remember: Only cite what is actually provided above. No fake sources.`;

  const conversationMessages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  let finalUserMessage = userMessage;
  if (attachedFileContent) {
    finalUserMessage = `Student uploaded file:\n${attachedFileContent}\n\nQuestion: ${userMessage || 'Please explain this file content.'}`;
  } else if (!hasContext) {
    finalUserMessage = `${userMessage}\n\nNote: No course materials available. Please answer without inventing citations.`;
  }
  conversationMessages.push({ role: 'user', content: finalUserMessage });

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: conversationMessages,
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!response.ok) throw new Error('API Error');

  const data = await response.json();
  let rawText = data.choices[0].message.content;
  rawText = rawText.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n');

  // Parse ONLY sources that appear in the response and match actual context
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const citedSources: Source[] = [];
  let match;
  
  while ((match = linkRegex.exec(rawText)) !== null) {
    const citedName = match[1];
    const citedUrl = match[2];
    
    // Find matching source in our actual ragSources
    const matchingSource = ragSources.find(s => s.url === citedUrl || s.name === citedName);
    if (matchingSource && matchingSource.isValid) {
      citedSources.push(matchingSource);
    }
  }
  
  // Remove duplicate sources
  const uniqueSources = Array.from(new Map(citedSources.map(s => [s.url, s])).values());
  
  // Limit to max 5 sources
  const finalSources = uniqueSources.slice(0, 5);
  
  // Clean up any "References" section the AI might have added
  const cleanText = rawText.replace(/##\s*References[\s\S]*$/i, '').replace(/References:[\s\S]*$/i, '').trim();

  return { text: cleanText, sources: finalSources };
}

/* ─── Extract text from uploaded file ────────────────────────────────────── */
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).substring(0, 5000));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isSearching]);

  const loadAllData = () => {
    try {
      const savedSessions = localStorage.getItem('sphere_sessions_v2');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      const savedCurrent = localStorage.getItem('sphere_current_v2');
      if (savedCurrent) {
        const current = JSON.parse(savedCurrent);
        setMessages(current.messages);
        setCurrentSessionId(current.id);
      } else {
        createNewSession();
      }
    } catch { createNewSession(); }
  };

  const createNewSession = () => {
    const welcome: Message = {
      id: Date.now().toString(),
      type: 'ai',
      text: "Hello! I'm Sphere, your academic CS assistant.\n\nI provide answers based on **actual course materials** from your modules. I never invent fake citations or references.\n\n**Available courses:**\n• CS321 - Programming Languages\n• CS322 - Software Engineering\n• CS323 - Ethics in Computing\n• CS324 - Computer Graphics\n• CS325 - Mobile Development\n• CS326 - Modeling & Simulation\n• CS327 - Data Mining\n• CS328 - Machine Learning\n\nAsk me anything about these courses. I'll cite real documents from your course materials when available.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [welcome],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setMessages([welcome]);
    setCurrentSessionId(newId);
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('sphere_sessions_v2', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('sphere_current_v2', JSON.stringify({ id: newId, messages: [welcome] }));
  };

  const saveCurrentMessages = (updatedMessages: Message[], sessionId = currentSessionId) => {
    if (!sessionId) return;
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      const updated = [...prev];
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], messages: updatedMessages, lastModified: Date.now() };
      }
      localStorage.setItem('sphere_sessions_v2', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('sphere_current_v2', JSON.stringify({ id: sessionId, messages: updatedMessages }));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && pendingFiles.length === 0) || isTyping) return;

    const userCaption = inputValue.trim();
    const messageText = pendingFiles.length > 0
      ? `[Files: ${pendingFiles.map(f => f.name).join(', ')}]\n${userCaption || 'Please explain these materials.'}`
      : userCaption;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    saveCurrentMessages(updatedMessages);

    const filesToProcess = [...pendingFiles];
    setInputValue('');
    setPendingFiles([]);
    setError(null);

    if (!isOnline || !isAPIKeyConfigured) {
      const offlineMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: !isOnline ? "I'm offline. Please connect to the internet so I can search course materials." : "API key not configured. Please add VITE_GROQ_API_KEY to your .env file.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const final = [...updatedMessages, offlineMsg];
      setMessages(final);
      saveCurrentMessages(final);
      return;
    }

    try {
      setIsSearching(true);
      const { contextBlock, sources: ragSources } = await buildRAGContext(userCaption);
      setIsSearching(false);
      setIsTyping(true);
      
      let attachedContent: string | undefined;
      if (filesToProcess.length > 0) {
        setIsProcessingFile(true);
        const parts = [];
        for (const pf of filesToProcess) {
          try { parts.push(`${pf.name}:\n${await extractTextFromFile(pf.file)}`); }
          catch { parts.push(`${pf.name}: [Error reading file]`); }
        }
        attachedContent = parts.join('\n\n');
      }

      const { text: aiText, sources: finalSources } = await callGroqAPI(
        userCaption, updatedMessages, contextBlock, ragSources, attachedContent
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: finalSources.length > 0 ? finalSources : undefined,
      };
      
      const final = [...updatedMessages, aiMsg];
      setMessages(final);
      saveCurrentMessages(final);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to get response. Please try again.');
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I encountered an error. Please check your connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const final = [...updatedMessages, errMsg];
      setMessages(final);
      saveCurrentMessages(final);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTyping(false);
      setIsProcessingFile(false);
    }
  };

  const clearChat = () => { if (confirm('Start a new chat?')) createNewSession(); };
  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(id);
      setShowHistory(false);
    }
  };
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) createNewSession();
  };
  const exportChat = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphere-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusOnline = isOnline && isAPIKeyConfigured;

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-4 h-[85vh]">
        
        {/* Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden flex-shrink-0"
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold">Chat History</h3>
                  <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => { createNewSession(); setShowHistory(false); }}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent"
                >
                  + New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[calc(85vh-120px)]">
                {sessions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No previous chats</p>
                ) : (
                  sessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={currentSessionId === session.id}
                      onClick={() => switchSession(session.id)}
                      onDelete={(e) => deleteSession(session.id, e)}
                    />
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">Sphere</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                    Real Sources Only
                  </span>
                </div>
                <p className="text-xs text-gray-400">Cites actual course materials · No fake references</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowHistory(v => !v)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={exportChat} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={clearChat} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-gray-500 text-sm max-w-md">
                  Ask about your CS courses. I'll search through actual course materials and provide real, verifiable citations.
                </p>
                <p className="text-xs text-gray-400 mt-2">No fake references. Only real documents.</p>
              </div>
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
            )}
            
            {/* Searching Indicator */}
            {isSearching && !isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                  <TypingDots label="Searching course materials..." />
                </div>
              </div>
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                  <TypingDots label={isProcessingFile ? "Processing file..." : "Generating response..."} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            {/* Pending Files */}
            <AnimatePresence>
              {pendingFiles.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                    {pendingFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg text-xs">
                        <FileText className="w-3 h-3" />
                        <span>{file.name}</span>
                        <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your course materials..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isTyping || isSearching}
              />
              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping || isSearching}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            {/* File Upload Panel */}
            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="p-3 bg-gray-50 rounded-xl border">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
                    >
                      + Click to upload TXT/MD files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          Array.from(files).forEach(file => {
                            if (file.size <= 10 * 1024 * 1024) {
                              setPendingFiles(prev => [...prev, { file, name: file.name, size: file.size, type: file.type }]);
                            } else {
                              setError(`"${file.name}" exceeds 10 MB limit.`);
                              setTimeout(() => setError(null), 3000);
                            }
                          });
                        }
                        setShowFileUpload(false);
                      }}
                      multiple
                      className="hidden"
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-2">Max 10 MB per file</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              {statusOnline ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Citing real course materials only · No fake references
                </span>
              ) : (
                "Configure VITE_GROQ_API_KEY to enable course material search"
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
