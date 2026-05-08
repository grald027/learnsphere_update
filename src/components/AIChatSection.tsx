import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle, Trash2, Download, Sparkles, Menu, Paperclip, FileText, X, Upload, Plus, AlertTriangle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const isAPIKeyConfigured = GROQ_API_KEY && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY !== '';

// Helper function to extract text from different file types
const extractTextFromFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  // Handle PDF files
  if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.substring(0, 5000);
    } catch (error) {
      console.error('PDF parsing error:', error);
      return `[PDF File: ${file.name}] - Could not extract text. The file may be scanned or image-based.`;
    }
  }

  // Handle DOCX files
  if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.substring(0, 5000);
    } catch (error) {
      console.error('DOCX parsing error:', error);
      return `[Word Document: ${file.name}] - Could not extract text.`;
    }
  }

  // Handle PPT/PPTX files - Note: Full PPT parsing requires additional libraries
  if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || 
      fileType === 'application/vnd.ms-powerpoint' || 
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return `[PowerPoint: ${file.name}] - For best results, please save the presentation as PDF and upload that instead. Current PPT parsing has limited support.`;
  }

  // Handle text files
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileType === 'text/plain') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).substring(0, 5000));
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  return `[${file.name}] - This file type may not be fully supported. Try converting to PDF or TXT for better results.`;
};

export function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadAllData = () => {
    try {
      const savedSessions = localStorage.getItem('learnsphere_chat_sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      
      const savedCurrent = localStorage.getItem('learnsphere_current_session');
      if (savedCurrent) {
        const current = JSON.parse(savedCurrent);
        setMessages(current.messages || []);
        setCurrentSessionId(current.id);
      } else {
        createNewSession();
      }
    } catch (e) {
      console.error('Error loading data:', e);
      createNewSession();
    }
  };

  const createNewSession = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      text: "Hello! I'm your LearnSphere AI tutor.\n\nI can help you with:\n- Programming concepts\n- Data structures and algorithms\n- Web development\n- Computer science fundamentals\n\nYou can also upload PDF, DOCX, or TXT files and I'll help summarize or explain them.\n\nWhat would you like to learn today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [welcomeMessage],
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    setMessages([welcomeMessage]);
    setCurrentSessionId(newSessionId);
    
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    
    localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('learnsphere_current_session', JSON.stringify({
      id: newSessionId,
      messages: [welcomeMessage]
    }));
  };

  const saveCurrentMessages = (updatedMessages: Message[]) => {
    if (!currentSessionId) return;
    
    const existingSession = sessions.find(s => s.id === currentSessionId);
    if (existingSession) {
      const updatedSession = {
        ...existingSession,
        messages: updatedMessages,
        lastModified: Date.now(),
        title: updatedMessages.length > 1 && updatedMessages[1]?.text 
          ? updatedMessages[1].text.substring(0, 30) + '...' 
          : existingSession.title
      };
      const updatedSessions = sessions.map(s => s.id === currentSessionId ? updatedSession : s);
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
    }
    
    setMessages([...updatedMessages]);
    localStorage.setItem('learnsphere_current_session', JSON.stringify({
      id: currentSessionId,
      messages: updatedMessages
    }));
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }
      
      setPendingFiles(prev => [...prev, {
        file,
        name: file.name,
        size: file.size,
        type: file.type
      }]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowFileUpload(false);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const callGroqAPI = async (userMessage: string, fileContent?: string): Promise<string> => {
    let systemPrompt = `You are LearnSphere AI Tutor. Provide clean, helpful responses for computer science students. Keep responses concise and educational. Use bullet points with dashes. Keep paragraphs short.`;

    if (fileContent) {
      systemPrompt += `\n\nThe student has uploaded a file. Here is the content:\n\n${fileContent}\n\nPlease help them understand this material.`;
    }

    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage || "Please help me understand this material." }
      ],
      temperature: 0.7,
      max_tokens: 800
    };

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      let text = data.choices[0].message.content;
      
      // Simple cleanup
      text = text.replace(/\*\*/g, '');
      text = text.replace(/\n{3,}/g, '\n\n');
      
      return text;
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && pendingFiles.length === 0) || isTyping || isProcessingFile) return;
    
    const userCaption = inputValue.trim();
    const hasFiles = pendingFiles.length > 0;
    
    let messageText = '';
    if (hasFiles) {
      messageText = `[Attached ${pendingFiles.length} file(s): ${pendingFiles.map(f => f.name).join(', ')}]`;
      if (userCaption) {
        messageText += `\n${userCaption}`;
      } else {
        messageText += `\nPlease help me understand these materials.`;
      }
    } else {
      messageText = userCaption;
    }
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    
    setMessages(prev => {
      const updated = [...prev, newUserMessage];
      saveCurrentMessages(updated);
      return updated;
    });
    
    const filesToProcess = [...pendingFiles];
    setInputValue('');
    setPendingFiles([]);
    setIsTyping(true);
    setError(null);
    
    try {
      let aiResponse: string;
      
      if (isOnline && isAPIKeyConfigured && filesToProcess.length > 0) {
        setIsProcessingFile(true);
        
        // Show processing message
        const processingMsg: Message = {
          id: Date.now().toString(),
          type: 'ai',
          text: `Processing ${filesToProcess.length} file(s)... Please wait.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, processingMsg]);
        
        // Extract text from files
        let combinedContent = '';
        for (const pendingFile of filesToProcess) {
          try {
            const extractedText = await extractTextFromFile(pendingFile.file);
            combinedContent += `\n\n--- ${pendingFile.name} ---\n\n${extractedText}`;
          } catch (err) {
            combinedContent += `\n\n--- ${pendingFile.name} ---\n[Could not extract text from this file]`;
          }
        }
        
        // Remove processing message
        setMessages(prev => prev.filter(m => m.id !== processingMsg.id));
        
        if (combinedContent.trim() && combinedContent.length > 100) {
          aiResponse = await callGroqAPI(userCaption || "Please summarize this document and explain the key concepts.", combinedContent);
        } else {
          aiResponse = `I received your file(s) but couldn't extract readable text. This can happen with:

- Image-based PDFs (scanned documents)
- Corrupted files
- Unsupported file formats

For best results, please:
1. Use text-based PDFs (not scanned)
2. Use DOCX files with actual text
3. Upload plain text (.txt) files

What specific topic would you like help with?`;
        }
      } else if (isOnline && isAPIKeyConfigured) {
        aiResponse = await callGroqAPI(userCaption, undefined);
      } else if (!isOnline) {
        aiResponse = "I'm in offline mode. Please connect to the internet for AI-powered assistance. I can still help with basic computer science concepts though! What would you like to know?";
      } else {
        aiResponse = "API key not configured. Please add VITE_GROQ_API_KEY to your .env file.";
      }
      
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      
      setMessages(prev => {
        const updated = [...prev, newAiMessage];
        saveCurrentMessages(updated);
        return updated;
      });
      
    } catch (error) {
      console.error('Send message error:', error);
      setError("Failed to get response. Please try again.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I'm having trouble processing your request. Please check your internet connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      
      setMessages(prev => {
        const updated = [...prev, errorMessage];
        saveCurrentMessages(updated);
        return updated;
      });
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTyping(false);
      setIsProcessingFile(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear this chat?')) {
      setPendingFiles([]);
      createNewSession();
    }
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setMessages([...session.messages]);
      setCurrentSessionId(session.id);
      localStorage.setItem('learnsphere_current_session', JSON.stringify({
        id: session.id,
        messages: session.messages
      }));
      setShowHistory(false);
      setPendingFiles([]);
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat session?')) {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
      
      if (currentSessionId === sessionId) {
        setPendingFiles([]);
        createNewSession();
      }
    }
  };

  const exportChat = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      const exportData = {
        session: session,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learnsphere-chat-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section className="bg-secondary/20 min-h-[calc(100vh-80px)] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-6xl flex gap-4">
        
        {/* Chat History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden md:block overflow-hidden"
            >
              <div className="w-72 bg-white rounded-2xl shadow-xl border h-[calc(100vh-140px)] overflow-y-auto">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Chat History</h3>
                  <p className="text-xs text-gray-500">{sessions.length} conversations</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={createNewSession}
                    className="w-full mb-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
                  >
                    + New Chat
                  </button>
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => switchSession(session.id)}
                      className={`p-3 rounded-xl mb-1 cursor-pointer transition-colors ${
                        currentSessionId === session.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{session.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(session.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Container */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          {/* Chat Header */}
          <div className="bg-primary px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white mr-4">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold">LearnSphere AI Tutor</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/80">
                    {isOnline && isAPIKeyConfigured ? 'Online' : !isAPIKeyConfigured ? 'API Key Missing' : 'Offline'}
                  </p>
                  {isOnline && isAPIKeyConfigured ? (
                    <Wifi className="w-3 h-3 text-green-300" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-yellow-300" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-white/80 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={exportChat} className="text-white/80 hover:text-white">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={clearChat} className="text-white/80 hover:text-white">
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'user' ? 'bg-primary/20 ml-3' : 'bg-primary/10 mr-3'
                  }`}>
                    {msg.type === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.type === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-gray-700 rounded-tl-none border shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] text-gray-400 mt-1 block ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex flex-row">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t">
            {/* Pending Files */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b">
                {pendingFiles.map((file, idx) => (
                  <div key={idx} className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>{file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}</span>
                    <button onClick={() => removePendingFile(idx)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-center bg-gray-50 rounded-full border px-4 py-2">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="text-gray-400 hover:text-primary mr-2"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={pendingFiles.length > 0 ? "Add a message (optional)..." : "Ask me anything..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                disabled={isTyping || isProcessingFile}
              />
              
              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping || isProcessingFile}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white ml-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            {/* File Upload Panel */}
            {showFileUpload && (
              <div className="mt-2 bg-gray-50 rounded-xl p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Attach files</span>
                  <button onClick={() => setShowFileUpload(false)} className="text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <label className="block w-full">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <div className="bg-white border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50">
                    <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to select files</p>
                    <p className="text-xs text-gray-400 mt-1">Supported: PDF, DOCX, TXT (Max 10MB each)</p>
                    <p className="text-xs text-blue-500 mt-2">Note: For best results, use text-based PDFs (not scanned images)</p>
                  </div>
                </label>
              </div>
            )}
            
            <p className="text-xs text-gray-400 text-center mt-2">
              {isOnline && isAPIKeyConfigured 
                ? "Powered by Groq AI" 
                : !isAPIKeyConfigured ? "Add VITE_GROQ_API_KEY to .env file" : "Connect to internet for AI features"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
