import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle,
  Trash2, Download, Sparkles, Menu, Paperclip, FileText,
  X, Plus, ChevronLeft, Clock, MessageSquare, Zap,
  BookOpen, ExternalLink, Search, CheckCircle,
} from 'lucide-react';

// ─── PDF.js worker ──────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Source {
  name: string;
  url: string;
  courseCode: string;
  type: string;
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

/* ─── Academic sources whitelist (reliable only) ────────────────────────── */
const ACADEMIC_SOURCES = [
  { domain: 'arxiv.org', name: 'arXiv' },
  { domain: 'ieeexplore.ieee.org', name: 'IEEE' },
  { domain: 'dl.acm.org', name: 'ACM' },
  { domain: 'scholar.google.com', name: 'Google Scholar' },
  { domain: 'springer.com', name: 'Springer' },
  { domain: 'sciencedirect.com', name: 'ScienceDirect' },
  { domain: 'mit.edu', name: 'MIT' },
  { domain: 'stanford.edu', name: 'Stanford' },
  { domain: 'berkeley.edu', name: 'UC Berkeley' },
  { domain: 'cmu.edu', name: 'CMU' },
  { domain: 'ox.ac.uk', name: 'Oxford' },
  { domain: 'cam.ac.uk', name: 'Cambridge' },
  { domain: 'developer.mozilla.org', name: 'MDN' },
  { domain: 'docs.python.org', name: 'Python Docs' },
  { domain: 'nodejs.org', name: 'Node.js' },
  { domain: 'reactjs.org', name: 'React' },
];

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

/* ─── Check if source is academic/reliable ───────────────────────────────── */
function isAcademicSource(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  // Block Wikipedia and commercial sites
  if (urlLower.includes('wikipedia.org') || 
      urlLower.includes('wikia.com') || 
      urlLower.includes('fandom.com') ||
      urlLower.includes('ibm.com') ||
      urlLower.includes('microsoft.com') ||
      urlLower.includes('kdnuggets.com') ||
      urlLower.includes('oracle.com') ||
      urlLower.includes('salesforce.com')) {
    return false;
  }
  
  // Check academic sources
  for (const source of ACADEMIC_SOURCES) {
    if (urlLower.includes(source.domain)) {
      return true;
    }
  }
  
  // Educational domains
  if (urlLower.includes('.edu')) {
    return true;
  }
  
  return false;
}

/* ─── RAG functions ──────────────────────────────────────────────────────── */
function detectRelevantCourses(message: string): string[] {
  const lower = message.toLowerCase();
  const detected: string[] = [];
  for (const [code, keywords] of Object.entries(COURSE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) detected.push(code);
  }
  return detected.length > 0 ? detected : Object.keys(COURSE_KEYWORDS);
}

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

async function extractPDFText(url: string, maxChars = 4000): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ url }).promise;
    const maxPages = Math.min(pdf.numPages, 6);
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

async function extractPlainText(url: string, maxChars = 4000): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const text = await res.text();
    return text.substring(0, maxChars);
  } catch {
    return '';
  }
}

async function buildRAGContext(userMessage: string): Promise<{ contextBlock: string; sources: Source[] }> {
  const relevantCourses = detectRelevantCourses(userMessage);
  const allFiles: (BlobFile & { courseCode: string })[] = [];

  await Promise.all(
    relevantCourses.map(async (code) => {
      const files = await fetchCourseFiles(code);
      files.forEach((f) => allFiles.push({ ...f, courseCode: code }));
    })
  );

  if (allFiles.length === 0) return { contextBlock: '', sources: [] };

  const extractable = allFiles
    .filter((f) => {
      const lower = f.name.toLowerCase();
      return lower.endsWith('.pdf') || lower.endsWith('.txt') || lower.endsWith('.md');
    })
    .slice(0, 3);

  const sources: Source[] = [];
  const contextParts: string[] = [];

  await Promise.all(
    extractable.map(async (file) => {
      const lower = file.name.toLowerCase();
      let text = '';

      if (lower.endsWith('.pdf')) {
        text = await extractPDFText(file.url);
      } else if (lower.endsWith('.txt') || lower.endsWith('.md')) {
        text = await extractPlainText(file.url);
      }

      if (text.trim().length > 100) {
        sources.push({
          name: file.name,
          url: file.url,
          courseCode: file.courseCode,
          type: file.type || lower.split('.').pop() || 'file',
        });
        contextParts.push(`--- ${file.name} (${file.courseCode}) ---\n${text}\n---`);
      }
    })
  );

  return { contextBlock: contextParts.join('\n\n'), sources };
}

/* ─── Parse sources from AI response (academic only) ─────────────────────── */
function parseSourcesFromText(text: string): Source[] {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const found: Source[] = [];
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    const name = match[1];
    const url = match[2];
    
    // Only include academic/reliable sources
    if (isAcademicSource(url)) {
      const courseCode = Object.keys(COURSE_KEYWORDS).find(
        (c) => url.includes(c) || name.toUpperCase().includes(c)
      ) || '';
      found.push({ name, url, courseCode, type: 'academic' });
    }
  }
  
  return found;
}

/* ─── Render text with links ─────────────────────────────────────────────── */
function RenderTextWithLinks({ text }: { text: string }) {
  // Remove standalone ## References section from the main text (will be displayed separately)
  const textWithoutRefs = text.replace(/##\s*References[\s\S]*$/, '').trim();
  
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(textWithoutRefs)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{textWithoutRefs.slice(lastIndex, match.index)}</span>);
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

  if (lastIndex < textWithoutRefs.length) {
    parts.push(<span key={lastIndex}>{textWithoutRefs.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

/* ─── Source card for references ─────────────────────────────────────────── */
const SourceCard: React.FC<{ source: Source; index: number }> = ({ source, index }) => (
  <a
    href={source.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 text-xs font-medium hover:shadow-md transition-all"
  >
    <span className="font-mono text-blue-600 font-bold">[{index}]</span>
    <span className="truncate max-w-[200px]">{source.name}</span>
    {source.courseCode && <span className="font-mono text-blue-500">({source.courseCode})</span>}
    <ExternalLink className="w-3 h-3" />
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

/* ─── Message bubble with organized references ───────────────────────────── */
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
          <div className="mt-1 pt-2 border-t border-gray-200 w-full">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">REFERENCES</span>
              <span className="text-xs text-blue-600">({msg.sources!.length} sources)</span>
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

/* ─── Session item ───────────────────────────────────────────────────────── */
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

/* ─── Groq API call with strict citation limits (2-5 sources) ────────────── */
async function callGroqAPI(
  userMessage: string,
  chatHistory: Message[],
  ragContext: string,
  ragSources: Source[],
  attachedFileContent?: string
): Promise<{ text: string; sources: Source[] }> {
  const hasContext = ragContext.trim().length > 0;

  const systemPrompt = `You are Sphere, an academic CS learning assistant.

**CITATION RULES (STRICT):**
1. Cite ONLY 2-5 reliable, academic sources per response
2. NEVER cite Wikipedia, IBM, Microsoft, KDNuggets, or commercial blogs
3. Use format: [Author/Institution](URL) for inline citations
4. DO NOT include a references section in your response text - just use inline citations
5. Preferred sources: arXiv, IEEE, ACM, Springer, .edu domains, official documentation

${hasContext ? 
`**COURSE MATERIALS (PRIORITIZE THESE):**
${ragContext}

Use these as your primary sources.` : 
`**NO COURSE MATERIALS AVAILABLE**
Use only academic sources from trusted domains.`}

**RESPONSE FORMAT:**
- Answer concisely with 2-5 inline citations
- Use natural academic language
- Example: "According to [Stanford CS229](https://cs229.stanford.edu), data mining involves..."

**FORBIDDEN SOURCES:**
- Wikipedia, Fandom, Wikia
- IBM, Microsoft, Oracle, Salesforce
- KDNuggets, TowardsDataScience, Medium
- Any commercial or blog platforms

**REMEMBER:** 2-5 citations only. Quality over quantity.`;

  const conversationMessages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: attachedFileContent ? 
      `File content:\n${attachedFileContent}\n\nQuestion: ${userMessage || 'Explain this.'}` : 
      userMessage }
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: conversationMessages,
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) throw new Error('API Error');

  const data = await response.json();
  let rawText = data.choices[0].message.content;
  rawText = rawText.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n');

  // Parse sources from AI response (academic only)
  let sources = parseSourcesFromText(rawText);
  
  // Also include course materials if available
  const allSources = [...sources, ...ragSources];
  const uniqueSources = Array.from(new Map(allSources.map(s => [s.url, s])).values());
  
  // Limit to 2-5 sources (prioritize course materials)
  let finalSources = uniqueSources;
  if (finalSources.length < 2 && hasContext) {
    // If less than 2, use course materials
    finalSources = ragSources.slice(0, 3);
  }
  finalSources = finalSources.slice(0, 5); // Max 5
  
  // Ensure at least 2 sources if possible
  if (finalSources.length === 1 && ragSources.length > 0) {
    finalSources.push(ragSources[0]);
  }

  // Clean up any duplicate references section from AI response
  const cleanText = rawText.replace(/##\s*References[\s\S]*$/i, '').trim();

  return { text: cleanText, sources: finalSources };
}

/* ─── File extraction ────────────────────────────────────────────────────── */
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
  }, [messages, isTyping]);

  const loadAllData = () => {
    try {
      const savedSessions = localStorage.getItem('sphere_sessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      const savedCurrent = localStorage.getItem('sphere_current');
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
      text: "Hello! I'm Sphere, your academic CS assistant.\n\nI provide answers with **2-5 citations** from reliable academic sources. No Wikipedia, no commercial blogs.\n\n**Ask me about:**\n• Data Mining (CS327)\n• Machine Learning (CS328)\n• Programming Languages (CS321)\n• Software Engineering (CS322)\n• And more...\n\nI'll cite course materials and academic papers. What would you like to learn?",
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
      localStorage.setItem('sphere_sessions', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('sphere_current', JSON.stringify({ id: newId, messages: [welcome] }));
  };

  const saveCurrentMessages = (updatedMessages: Message[], sessionId = currentSessionId) => {
    if (!sessionId) return;
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      const updated = [...prev];
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], messages: updatedMessages, lastModified: Date.now() };
      }
      localStorage.setItem('sphere_sessions', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('sphere_current', JSON.stringify({ id: sessionId, messages: updatedMessages }));
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
        text: !isOnline ? "I'm offline. Please connect to the internet for academic citations." : "API key not configured.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedMessages, offlineMsg]);
      saveCurrentMessages([...updatedMessages, offlineMsg]);
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
      setError('Failed to get response. Please try again.');
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I encountered an error. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedMessages, errMsg]);
      saveCurrentMessages([...updatedMessages, errMsg]);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTyping(false);
      setIsProcessingFile(false);
    }
  };

  const clearChat = () => { if (confirm('Start new chat?')) createNewSession(); };
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
    a.download = `chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusOnline = isOnline && isAPIKeyConfigured;

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-4 h-[85vh]">
        
        {showHistory && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white rounded-2xl border shadow-sm overflow-hidden flex-shrink-0"
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">History</h3>
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
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {sessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => switchSession(session.id)}
                  onDelete={(e) => deleteSession(session.id, e)}
                />
              ))}
            </div>
          </motion.aside>
        )}

        <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border">
                    {statusOnline ? '2-5 Citations' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Academic sources only · No Wikipedia</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowHistory(v => !v)} className="p-2 rounded-lg hover:bg-gray-100">
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={exportChat} className="p-2 rounded-lg hover:bg-gray-100">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={clearChat} className="p-2 rounded-lg hover:bg-gray-100">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Zap className="w-12 h-12 text-primary/20 mb-3" />
                <p className="text-gray-500 text-sm">Ask about CS concepts — I'll cite 2-5 academic sources</p>
              </div>
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
            )}
            
            {isSearching && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                  <TypingDots label="Searching course materials..." />
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                  <TypingDots label={isProcessingFile ? "Processing file..." : "Finding citations..."} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about data mining, ML, programming..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-accent disabled:opacity-50"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            
            {showFileUpload && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border">
                <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    Array.from(files).forEach(file => {
                      if (file.size <= 10 * 1024 * 1024) {
                        setPendingFiles(prev => [...prev, { file, name: file.name, size: file.size, type: file.type }]);
                      }
                    });
                  }
                  setShowFileUpload(false);
                }} className="hidden" multiple />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-primary">
                  + Click to upload TXT/MD files
                </button>
              </div>
            )}
            
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg text-xs">
                    <FileText className="w-3 h-3" />
                    {file.name}
                    <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-[10px] text-gray-400 text-center mt-3">
              {statusOnline ? '✓ Citing 2-5 academic sources · No Wikipedia · No commercial blogs' : 'Configure API key for academic citations'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
