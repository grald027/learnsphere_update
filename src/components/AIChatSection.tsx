import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle,
  Trash2, Download, Sparkles, Menu, Paperclip, FileText,
  X, Plus, ChevronLeft, Clock, MessageSquare, Zap,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  time: string;
  timestamp?: number;
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

/* ─── Config ─────────────────────────────────────────────────────────────── */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const isAPIKeyConfigured = GROQ_API_KEY && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY !== '';

/* ─── File extraction ────────────────────────────────────────────────────── */
const extractTextFromFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || file.type === 'text/plain') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).substring(0, 5000));
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }
  if (fileName.endsWith('.pdf'))
    return `[PDF Document: ${file.name}]\n\nNote: For best results, please convert this PDF to TXT format. File size: ${(file.size / 1024).toFixed(2)} KB`;
  if (fileName.endsWith('.docx'))
    return `[Word Document: ${file.name}]\n\nNote: For best results, please convert this DOCX to TXT format. File size: ${(file.size / 1024).toFixed(2)} KB`;
  return `[File: ${file.name}]\n\nFile size: ${(file.size / 1024).toFixed(2)} KB\n\nTo analyze this file, please convert it to TXT format.`;
};

/* ─── Typing indicator ───────────────────────────────────────────────────── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-primary/60 block"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/* ─── Message bubble ─────────────────────────────────────────────────────── */
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.type === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${
        isUser ? 'bg-primary/15' : 'bg-primary/10 border border-primary/20'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-primary" />
          : <Bot className="w-3.5 h-3.5 text-primary" />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-primary text-white rounded-br-sm shadow-sm'
            : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100 shadow-sm'
        }`}>
          {msg.text}
        </div>
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
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
      isActive ? 'bg-primary/20' : 'bg-gray-100'
    }`}>
      <MessageSquare className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-dark truncate">{session.title}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Clock className="w-2.5 h-2.5 text-gray-400" />
        <p className="text-xs text-gray-400">{new Date(session.lastModified).toLocaleDateString()}</p>
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

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function AIChatSection() {
  const [messages, setMessages]               = useState<Message[]>([]);
  const [inputValue, setInputValue]           = useState('');
  const [isTyping, setIsTyping]               = useState(false);
  const [isOnline, setIsOnline]               = useState(navigator.onLine);
  const [error, setError]                     = useState<string | null>(null);
  const [sessions, setSessions]               = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory]         = useState(false);
  const [pendingFiles, setPendingFiles]       = useState<PendingFile[]>([]);
  const [showFileUpload, setShowFileUpload]   = useState(false);
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
  }, [messages, isTyping]);

  /* ── Data persistence ── */
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
      id: Date.now().toString(), type: 'ai',
      text: "Hello! I'm Sphere, your AI learning assistant.\n\nI can help you with:\n- Programming concepts\n- Data structures and algorithms\n- Web development\n- Computer science fundamentals\n\nYou can also upload TXT files and I'll help summarize or explain them.\n\nWhat would you like to learn today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId, title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [welcome], createdAt: Date.now(), lastModified: Date.now(),
    };
    setMessages([welcome]);
    setCurrentSessionId(newId);
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('learnsphere_current_session', JSON.stringify({ id: newId, messages: [welcome] }));
  };

  const saveCurrentMessages = (updatedMessages: Message[]) => {
    if (!currentSessionId) return;
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId);
      let updated: ChatSession[];
      if (idx !== -1) {
        const s = prev[idx];
        updated = [...prev];
        updated[idx] = {
          ...s, messages: updatedMessages, lastModified: Date.now(),
          title: updatedMessages.length > 1 && updatedMessages[1]?.text
            ? updatedMessages[1].text.substring(0, 30) + '…'
            : s.title,
        };
      } else {
        updated = [{ id: currentSessionId, title: `Chat ${new Date().toLocaleDateString()}`, messages: updatedMessages, createdAt: Date.now(), lastModified: Date.now() }, ...prev];
      }
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('learnsphere_current_session', JSON.stringify({ id: currentSessionId, messages: updatedMessages }));
  };

  /* ── File handling ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 10MB limit.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }
      setPendingFiles(prev => [...prev, { file, name: file.name, size: file.size, type: file.type }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowFileUpload(false);
  };

  /* ── API ── */
  const callGroqAPI = async (userMessage: string, chatHistory: Message[], fileContent?: string): Promise<string> => {
    const conversationMessages: { role: string; content: string }[] = [
      { role: 'system', content: `You are Sphere, an AI learning assistant for LearnSphere. Provide clean, helpful responses for computer science students. Keep responses concise and educational. Use bullet points with dashes. Keep paragraphs short. Be friendly and helpful. Remember previous conversations to provide context.` },
      ...chatHistory.slice(-10).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text })),
    ];
    let finalMsg = userMessage;
    if (fileContent) finalMsg = `The student has uploaded a file with this content:\n\n${fileContent}\n\nTheir question is: ${userMessage || 'Please summarize this document and explain the key concepts.'}`;
    conversationMessages.push({ role: 'user', content: finalMsg });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: conversationMessages, temperature: 0.7, max_tokens: 800 }),
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.choices[0].message.content.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n');
  };

  /* ── Send ── */
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && pendingFiles.length === 0) || isTyping || isProcessingFile) return;

    const userCaption = inputValue.trim();
    const hasFiles    = pendingFiles.length > 0;
    let messageText   = hasFiles
      ? `[Attached ${pendingFiles.length} file(s): ${pendingFiles.map(f => f.name).join(', ')}]\n${userCaption || 'Please help me understand these materials.'}`
      : userCaption;

    const newUserMsg: Message = {
      id: Date.now().toString(), type: 'user', text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    saveCurrentMessages(updatedMessages);

    const filesToProcess = [...pendingFiles];
    setInputValue('');
    setPendingFiles([]);
    setIsTyping(true);
    setError(null);

    try {
      let aiResponse: string;
      if (isOnline && isAPIKeyConfigured && filesToProcess.length > 0) {
        setIsProcessingFile(true);
        let combined = '';
        for (const pf of filesToProcess) {
          try { combined += `\n\n--- ${pf.name} ---\n\n${await extractTextFromFile(pf.file)}`; }
          catch  { combined += `\n\n--- ${pf.name} ---\n[Could not extract text]`; }
        }
        aiResponse = combined.trim().length > 100
          ? await callGroqAPI(userCaption || 'Please summarize this document and explain the key concepts.', updatedMessages, combined)
          : "I received your file(s) but couldn't extract readable text.\n\nFor best results, please upload a TEXT (.txt) file.\n\nWhat specific topic would you like help with?";
      } else if (isOnline && isAPIKeyConfigured) {
        aiResponse = await callGroqAPI(userCaption, updatedMessages);
      } else if (!isOnline) {
        aiResponse = "I'm in offline mode. Please connect to the internet for AI-powered assistance.";
      } else {
        aiResponse = "API key not configured. Please add VITE_GROQ_API_KEY to your .env file.";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(), type: 'ai', text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      saveCurrentMessages(finalMessages);
    } catch {
      setError('Failed to get response. Please try again.');
      const errMsg: Message = {
        id: (Date.now() + 1).toString(), type: 'ai',
        text: "I'm having trouble processing your request. Please check your internet connection and try again.",
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
    const s = sessions.find(s => s.id === id);
    if (s) { setMessages([...s.messages]); setCurrentSessionId(s.id); setShowHistory(false); setPendingFiles([]); }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) { setPendingFiles([]); createNewSession(); }
  };

  const exportChat = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const blob = new Blob([JSON.stringify({ session, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sphere-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusOnline  = isOnline && isAPIKeyConfigured;
  const statusLabel   = statusOnline ? 'Online' : !isAPIKeyConfigured ? 'API Key Missing' : 'Offline';

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <section className="bg-secondary/10 min-h-[calc(100vh-80px)] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-6xl flex gap-4 h-[calc(100vh-120px)]">

        {/* ── Sidebar ── */}
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
                {/* Sidebar header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-dark text-sm">Chat History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* New chat btn */}
                <div className="px-3 pt-3 pb-2">
                  <button
                    onClick={() => { createNewSession(); setShowHistory(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Chat
                  </button>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No previous chats</p>
                  ) : sessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={currentSessionId === session.id}
                      onClick={() => switchSession(session.id)}
                      onDelete={e => deleteSession(session.id, e)}
                    />
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main chat ── */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-dark text-sm">Sphere</h3>
                  <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    statusOnline ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {statusOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-400">AI Learning Assistant</p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(v => !v)}
                title="Chat history"
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 hover:text-dark'}`}
              >
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={exportChat} title="Export chat" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-dark transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={clearChat} title="New chat" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-dark transition-colors">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error banner */}
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50/40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold text-dark">Start a conversation</p>
                  <p className="text-gray-400 text-sm mt-1">Ask Sphere anything about CS or upload a TXT file.</p>
                </div>
              </div>
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
            )}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white flex-shrink-0">
            {/* Pending files */}
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
                        <button onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))} className="text-primary/60 hover:text-primary ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Attach */}
              <button
                type="button"
                onClick={() => setShowFileUpload(v => !v)}
                title="Attach file"
                className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                  showFileUpload ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={pendingFiles.length > 0 ? 'Add a message (optional)…' : 'Ask Sphere anything…'}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all border border-transparent focus:border-primary/20"
                  disabled={isTyping || isProcessingFile}
                />
              </div>

              {/* Send */}
              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping || isProcessingFile}
                className="p-2.5 bg-primary text-white rounded-xl flex-shrink-0 hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTyping || isProcessingFile
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </form>

            {/* File upload panel */}
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
                        <p className="text-xs font-medium text-gray-500">Click to select TXT files</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Max 10MB each · TXT and MD supported</p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer note */}
            <p className="text-[10px] text-gray-400 text-center mt-2.5 leading-relaxed">
              {statusOnline
                ? 'Powered by Groq AI · Llama 3.3 70B'
                : !isAPIKeyConfigured
                ? 'Add VITE_GROQ_API_KEY to .env to enable AI'
                : 'Connect to internet for AI features'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
