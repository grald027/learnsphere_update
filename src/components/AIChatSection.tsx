import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle,
  Trash2, Download, Sparkles, Menu, Paperclip, FileText,
  X, Plus, ChevronLeft, Clock, MessageSquare, Zap,
  BookOpen, ExternalLink, Search, CheckCircle,
} from 'lucide-react';

// ─── PDF.js worker (CDN — avoids Vite bundling issues) ───────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Source {
  name: string;
  url: string;
  courseCode: string;
  type: string;
  isReliable?: boolean;
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

/* ─── Authoritative academic sources configuration ───────────────────────── */
const AUTHORITATIVE_DOMAINS = [
  { domain: 'arxiv.org', name: 'arXiv', type: 'preprint' },
  { domain: 'ieeexplore.ieee.org', name: 'IEEE Xplore', type: 'academic' },
  { domain: 'dl.acm.org', name: 'ACM Digital Library', type: 'academic' },
  { domain: 'scholar.google.com', name: 'Google Scholar', type: 'academic' },
  { domain: 'springer.com', name: 'Springer', type: 'academic' },
  { domain: 'sciencedirect.com', name: 'ScienceDirect', type: 'academic' },
  { domain: 'mit.edu', name: 'MIT', type: 'educational' },
  { domain: 'stanford.edu', name: 'Stanford', type: 'educational' },
  { domain: 'berkeley.edu', name: 'UC Berkeley', type: 'educational' },
  { domain: 'cmu.edu', name: 'Carnegie Mellon', type: 'educational' },
  { domain: 'ox.ac.uk', name: 'Oxford', type: 'educational' },
  { domain: 'developer.mozilla.org', name: 'MDN Web Docs', type: 'documentation' },
  { domain: 'docs.python.org', name: 'Python Docs', type: 'documentation' },
  { domain: 'nodejs.org', name: 'Node.js Docs', type: 'documentation' },
  { domain: 'reactjs.org', name: 'React Docs', type: 'documentation' },
];

/* ─── Course keyword map for RAG course detection ────────────────────────── */
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

/* ─── Function to evaluate source reliability ───────────────────────────── */
function isReliableSource(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  // Explicitly block Wikipedia
  if (urlLower.includes('wikipedia.org') || urlLower.includes('wikia.com') || urlLower.includes('fandom.com')) {
    return false;
  }
  
  // Check authoritative domains
  for (const domain of AUTHORITATIVE_DOMAINS) {
    if (urlLower.includes(domain.domain)) {
      return true;
    }
  }
  
  // Educational domains are reliable
  if (urlLower.includes('.edu')) {
    return true;
  }
  
  return false;
}

/* ─── RAG: detect relevant courses from the user message ─────────────────── */
function detectRelevantCourses(message: string): string[] {
  const lower = message.toLowerCase();
  const detected: string[] = [];
  for (const [code, keywords] of Object.entries(COURSE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) detected.push(code);
  }
  return detected.length > 0 ? detected : Object.keys(COURSE_KEYWORDS);
}

/* ─── RAG: fetch file list for a course from Vercel Blob ─────────────────── */
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

/* ─── RAG: extract text from a PDF via its URL ───────────────────────────── */
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

/* ─── RAG: extract text from a plain text / markdown URL ─────────────────── */
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

/* ─── RAG: build context string + source list from relevant courses ──────── */
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
          isReliable: true,
        });
        contextParts.push(
          `--- COURSE MATERIAL: ${file.name} (${file.courseCode}) ---\n${text}\n---`
        );
      }
    })
  );

  return {
    contextBlock: contextParts.join('\n\n'),
    sources,
  };
}

/* ─── Parse markdown links from AI response ──────────────────────────────── */
function parseSourcesFromText(text: string): Source[] {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const found: Source[] = [];
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const name = match[1];
    const url = match[2];
    const courseCode = Object.keys(COURSE_KEYWORDS).find(
      (c) => url.includes(c) || name.toUpperCase().includes(c)
    ) || '';
    const reliable = isReliableSource(url);
    
    // Only include reliable sources, skip Wikipedia and unreliable ones
    if (reliable) {
      found.push({ 
        name, 
        url, 
        courseCode, 
        type: url.split('.').pop()?.split('?')[0] || 'link',
        isReliable: true,
      });
    }
  }
  return found;
}

/* ─── Render text with inline clickable links ───────────────────────────── */
function RenderTextWithLinks({ text }: { text: string }) {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:text-accent font-medium break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {match[1]}
        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

/* ─── Source card shown below AI messages ────────────────────────────────── */
const SourceCard: React.FC<{ source: Source; index: number }> = ({ source, index }) => {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all hover:shadow-sm bg-green-50 border-green-200 text-green-700"
      title={source.name}
    >
      <CheckCircle className="w-3 h-3 flex-shrink-0" />
      <span className="font-mono text-[10px] text-green-600">[{index}]</span>
      <span className="truncate max-w-[140px]">{source.name}</span>
      {source.courseCode && (
        <span className="font-mono opacity-60 text-[10px]">{source.courseCode}</span>
      )}
      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
    </a>
  );
};

/* ─── Typing indicator ───────────────────────────────────────────────────── */
const TypingDots = ({ label = '' }: { label?: string }) => (
  <div className="flex items-center gap-2 px-1 py-0.5">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60 block"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
    {label && <span className="text-xs text-gray-400">{label}</span>}
  </div>
);

/* ─── Message bubble ─────────────────────────────────────────────────────── */
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.type === 'user';
  const hasSources = !isUser && msg.sources && msg.sources.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${
          isUser ? 'bg-primary/15' : 'bg-primary/10 border border-primary/20'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      {/* Bubble + sources */}
      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-primary text-white rounded-br-sm shadow-sm'
              : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100 shadow-sm'
          }`}
        >
          {isUser ? (
            msg.text
          ) : (
            <RenderTextWithLinks text={msg.text} />
          )}
        </div>

        {/* Source cards - organized at the bottom */}
        {hasSources && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-2 pt-2 border-t border-gray-100"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3 h-3 text-green-600" />
              <span className="text-[10px] font-semibold text-gray-500">REFERENCES</span>
              <span className="text-[10px] text-green-600">({msg.sources!.length} sources)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {msg.sources!.map((src, idx) => (
                <SourceCard key={idx} source={src} index={idx + 1} />
              ))}
            </div>
          </motion.div>
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
      isActive
        ? 'bg-primary/10 border border-primary/20'
        : 'hover:bg-gray-50 border border-transparent'
    }`}
  >
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isActive ? 'bg-primary/20' : 'bg-gray-100'
      }`}
    >
      <MessageSquare className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-dark truncate">{session.title}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Clock className="w-2.5 h-2.5 text-gray-400" />
        <p className="text-xs text-gray-400">
          {new Date(session.lastModified).toLocaleDateString()}
        </p>
        <span className="text-gray-300">·</span>
        <p className="text-xs text-gray-400">{session.messages.length} msg</p>
      </div>
    </div>
    <button
      onClick={onDelete}
      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  </div>
);

/* ─── Groq API call with RAG context and limited citations ───────────────── */
async function callGroqAPI(
  userMessage: string,
  chatHistory: Message[],
  ragContext: string,
  ragSources: Source[],
  attachedFileContent?: string
): Promise<{ text: string; sources: Source[] }> {
  const hasContext = ragContext.trim().length > 0;

  const systemPrompt = `You are Sphere, an AI learning assistant for computer science students.

**CRITICAL CITATION RULES:**
1. **MAXIMUM 5 SOURCES TOTAL** - Limit your citations to at most 5 reliable sources
2. **NEVER cite Wikipedia** or any wiki-based sites
3. **PRIORITIZE** course materials first, then academic sources
4. **USE inline citations** with format: [Source Name](URL)
5. **ADD references section** at the end with numbered list

**CITATION STRUCTURE:**
- In your answer, cite sources like this: [Author/Source Name](URL)
- At the end, add "## References" with numbered list of all sources
- Example: ## References\n1. [Source Name](URL) - Brief note on authority\n2. [Another Source](URL) - Brief note

**RELIABLE SOURCES (in order):**
- Course materials (most preferred)
- Peer-reviewed papers (arXiv, IEEE, ACM, Springer)
- Official documentation (MDN, Python docs, etc.)
- University resources (.edu domains)

**RESPONSE FORMAT:**
1. Answer the question concisely with inline citations [like this](url)
2. Keep answer clear and educational
3. End with "## References" section with max 5 numbered sources
4. No bullet points in references - use numbered list only

${hasContext ? 
`**COURSE MATERIALS AVAILABLE (PRIORITIZE THESE):**
${ragContext}` : 
`**NO COURSE MATERIALS** - Use only reliable academic sources listed above.`}

Remember: MAXIMUM 5 CITATIONS TOTAL. Be selective and cite only the most relevant sources.`;

  const conversationMessages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map((m) => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  let finalUserMessage = userMessage;
  if (attachedFileContent) {
    finalUserMessage = `The student uploaded a file:\n\n${attachedFileContent}\n\nQuestion: ${userMessage || 'Please explain the key concepts.'}\n\nProvide a concise answer with max 5 citations from reliable sources.`;
  }
  conversationMessages.push({ role: 'user', content: finalUserMessage });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: conversationMessages,
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) throw new Error('API Error');

    const data = await response.json();
    let rawText: string = data.choices[0].message.content;
    rawText = rawText.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n');

    // Parse inline citations from AI response (only reliable ones)
    let inlineSources = parseSourcesFromText(rawText);
    
    // Limit to 5 sources total
    inlineSources = inlineSources.slice(0, 5);
    
    // Merge with RAG sources (course materials) but limit total to 5
    const allSourceUrls = new Set(inlineSources.map((s) => s.url));
    const extraSources = ragSources.filter((s) => !allSourceUrls.has(s.url));
    let finalSources = [...inlineSources, ...extraSources].slice(0, 5);

    // If no sources were cited, add a note
    if (finalSources.length === 0 && !hasContext) {
      rawText += "\n\n## References\n*No specific reliable sources could be cited for this response. Please verify this information with official documentation or academic papers.*";
    }

    return { text: rawText, sources: finalSources };
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

/* ─── File text extraction ───────────────────────────────────────────────── */
async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type === 'text/plain') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).substring(0, 5000));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  if (name.endsWith('.pdf'))
    return `[PDF: ${file.name}] — convert to TXT for best results. Size: ${(file.size / 1024).toFixed(1)} KB`;
  return `[File: ${file.name}] — Size: ${(file.size / 1024).toFixed(1)} KB`;
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function AIChatSection() {
  const [messages, setMessages]                 = useState<Message[]>([]);
  const [inputValue, setInputValue]             = useState('');
  const [isTyping, setIsTyping]                 = useState(false);
  const [isSearching, setIsSearching]           = useState(false);
  const [isOnline, setIsOnline]                 = useState(navigator.onLine);
  const [error, setError]                       = useState<string | null>(null);
  const [sessions, setSessions]                 = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory]           = useState(false);
  const [pendingFiles, setPendingFiles]         = useState<PendingFile[]>([]);
  const [showFileUpload, setShowFileUpload]     = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAllData(); }, []);

  useEffect(() => {
    const on  = () => { setIsOnline(true);  setError(null); };
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, isTyping, isSearching]);

  const loadAllData = () => {
    try {
      const savedSessions = localStorage.getItem('learnsphere_chat_sessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      const savedCurrent = localStorage.getItem('learnsphere_current_session');
      if (savedCurrent) {
        const current = JSON.parse(savedCurrent);
        setMessages(current.messages || []);
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
      text: "Hello! I'm Sphere, your AI learning assistant.\n\nI provide concise answers with **up to 5 reliable citations** from course materials and academic sources. I never cite Wikipedia.\n\n**What I can help with:**\n• CS321-328 course concepts\n• Programming and algorithms\n• Computer science topics\n\n**My response format:**\n1. Clear answer with inline [citations](url)\n2. References section with numbered sources\n\nAsk me anything about your courses!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [welcome],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setMessages([welcome]);
    setCurrentSessionId(newId);
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('learnsphere_current_session', JSON.stringify({ id: newId, messages: [welcome] }));
  };

  const saveCurrentMessages = (updatedMessages: Message[], sessionId = currentSessionId) => {
    if (!sessionId) return;
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      let updated: ChatSession[];
      if (idx !== -1) {
        const s = prev[idx];
        updated = [...prev];
        updated[idx] = {
          ...s,
          messages: updatedMessages,
          lastModified: Date.now(),
          title: updatedMessages.length > 1 && updatedMessages[1]?.text
            ? updatedMessages[1].text.substring(0, 30) + '…'
            : s.title,
        };
      } else {
        updated = [
          { id: sessionId, title: `Chat ${new Date().toLocaleDateString()}`, messages: updatedMessages, createdAt: Date.now(), lastModified: Date.now() },
          ...prev,
        ];
      }
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('learnsphere_current_session', JSON.stringify({ id: sessionId, messages: updatedMessages }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 10 MB limit.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }
      setPendingFiles((prev) => [...prev, { file, name: file.name, size: file.size, type: file.type }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowFileUpload(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && pendingFiles.length === 0) || isTyping || isProcessingFile) return;

    const userCaption = inputValue.trim();
    const hasFiles    = pendingFiles.length > 0;
    const messageText = hasFiles
      ? `[Attached ${pendingFiles.length} file(s): ${pendingFiles.map((f) => f.name).join(', ')}]\n${userCaption || 'Please help me understand these materials.'}`
      : userCaption;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
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
        text: !isOnline
          ? "I'm offline. Please connect to the internet for answers with reliable citations."
          : "API key not configured. Please add VITE_GROQ_API_KEY to your .env file.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
      };
      const final = [...updatedMessages, offlineMsg];
      setMessages(final);
      saveCurrentMessages(final);
      return;
    }

    try {
      setIsSearching(true);
      const { contextBlock, sources: ragSources } = await buildRAGContext(userCaption || messageText);
      setIsSearching(false);

      setIsTyping(true);
      let attachedContent: string | undefined;
      if (filesToProcess.length > 0) {
        setIsProcessingFile(true);
        const parts: string[] = [];
        for (const pf of filesToProcess) {
          try { parts.push(`--- ${pf.name} ---\n${await extractTextFromFile(pf.file)}`); }
          catch  { parts.push(`--- ${pf.name} ---\n[Could not read file]`); }
        }
        attachedContent = parts.join('\n\n');
      }

      const { text: aiText, sources: finalSources } = await callGroqAPI(
        userCaption,
        updatedMessages,
        contextBlock,
        ragSources,
        attachedContent
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        sources: finalSources.length > 0 ? finalSources : undefined,
      };
      const final = [...updatedMessages, aiMsg];
      setMessages(final);
      saveCurrentMessages(final);

    } catch (error) {
      console.error('Error:', error);
      setIsSearching(false);
      setError('Failed to get a response. Please try again.');
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I'm having trouble finding reliable sources right now. Please try rephrasing your question or check your connection.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
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

  const clearChat = () => { if (window.confirm('Start a new chat?')) { setPendingFiles([]); createNewSession(); } };
  const switchSession = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    if (s) { setMessages([...s.messages]); setCurrentSessionId(s.id); setShowHistory(false); setPendingFiles([]); }
  };
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) { setPendingFiles([]); createNewSession(); }
  };
  const exportChat = () => {
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;
    const blob = new Blob([JSON.stringify({ session, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphere-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusOnline = isOnline && isAPIKeyConfigured;
  const statusLabel  = statusOnline ? 'Online' : !isAPIKeyConfigured ? 'API Key Missing' : 'Offline';
  const isBusy       = isTyping || isProcessingFile || isSearching;

  return (
    <section className="bg-secondary/10 min-h-[calc(100vh-80px)] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-6xl flex gap-4 h-[calc(100vh-120px)]">

        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 272, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="hidden md:flex flex-col overflow-hidden flex-shrink-0"
            >
              <div className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm h-full overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-dark text-sm">Chat History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="px-3 pt-3 pb-2">
                  <button
                    onClick={() => { createNewSession(); setShowHistory(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Chat
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No previous chats</p>
                  ) : (
                    sessions.map((session) => (
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
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">

          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-dark text-sm">Sphere</h3>
                  <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusOnline ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    {statusOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                    {statusLabel}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 border border-blue-200">
                    <BookOpen className="w-2.5 h-2.5" />
                    Max 5 Citations
                  </span>
                </div>
                <p className="text-xs text-gray-400">Cites reliable sources · No Wikipedia</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setShowHistory((v) => !v)} className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 hover:text-dark'}`}>
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={exportChat} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-dark transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={clearChat} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-dark transition-colors">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex-shrink-0"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50/40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Organized answers with citations</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-md">
                    Each response includes inline citations and a numbered references section with up to 5 reliable sources.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
            )}

            {isSearching && !isTyping && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                  <Search className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingDots label="Searching course materials…" />
                </div>
              </motion.div>
            )}

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingDots label={isProcessingFile ? 'Processing file…' : 'Citing sources…'} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white flex-shrink-0">
            <AnimatePresence>
              {pendingFiles.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mb-2.5 pb-2.5 border-b border-gray-100">
                    {pendingFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-primary/8 border border-primary/20 text-primary rounded-lg px-2.5 py-1.5 text-xs font-medium">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{file.name}</span>
                        <button onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-primary/60 hover:text-primary ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFileUpload((v) => !v)}
                className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                  showFileUpload ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about CS concepts — I'll cite up to 5 reliable sources..."
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all border border-transparent focus:border-primary/20"
                  disabled={isBusy}
                />
              </div>

              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isBusy}
                className="p-2.5 bg-primary text-white rounded-xl flex-shrink-0 hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 bg-gray-50 rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">Attach file</span>
                      <button onClick={() => setShowFileUpload(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <label className="block cursor-pointer">
                      <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileSelect} className="hidden" multiple />
                      <div className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl p-4 text-center transition-colors bg-white">
                        <Plus className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-gray-500">Upload TXT/MD files</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Max 10 MB each</p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] text-gray-400 text-center mt-2.5">
              {statusOnline 
                ? '✓ Up to 5 citations per answer · References section at bottom · No Wikipedia'
                : 'Configure API key for reliable source citations'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
