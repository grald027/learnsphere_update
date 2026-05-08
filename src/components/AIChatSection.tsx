import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle, Trash2, Download, Sparkles, Menu, Paperclip, FileText, X, Plus } from 'lucide-react';

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

// Simple text extraction without external libraries
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
  
  if (fileName.endsWith('.pdf')) {
    return `[PDF Document: ${file.name}]\n\nNote: For best results, please convert this PDF to TXT format. File size: ${(file.size / 1024).toFixed(2)} KB`;
  }
  
  if (fileName.endsWith('.docx')) {
    return `[Word Document: ${file.name}]\n\nNote: For best results, please convert this DOCX to TXT format. File size: ${(file.size / 1024).toFixed(2)} KB`;
  }
  
  return `[File: ${file.name}]\n\nFile size: ${(file.size / 1024).toFixed(2)} KB\n\nTo analyze this file, please convert it to TXT format.`;
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

  // Load sessions on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Online/offline detection
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
      // Load sessions
      const savedSessions = localStorage.getItem('learnsphere_chat_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
      }
      
      // Load current session
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
      text: "Hello! I'm Sphere, your AI learning assistant.\n\nI can help you with:\n- Programming concepts\n- Data structures and algorithms\n- Web development\n- Computer science fundamentals\n\nYou can also upload TXT files and I'll help summarize or explain them.\n\nWhat would you like to learn today?",
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
    
    const existingSessionIndex = sessions.findIndex(s => s.id === currentSessionId);
    
    if (existingSessionIndex !== -1) {
      const updatedSession = {
        ...sessions[existingSessionIndex],
        messages: updatedMessages,
        lastModified: Date.now(),
        title: updatedMessages.length > 1 && updatedMessages[1]?.text 
          ? updatedMessages[1].text.substring(0, 30) + '...' 
          : sessions[existingSessionIndex].title
      };
      const updatedSessions = [...sessions];
      updatedSessions[existingSessionIndex] = updatedSession;
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
    } else {
      const newSession: ChatSession = {
        id: currentSessionId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        messages: updatedMessages,
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
    }
    
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

  // FIXED: This function now sends the FULL conversation history
  const callGroqAPI = async (userMessage: string, chatHistory: Message[], fileContent?: string): Promise<string> => {
    // Build conversation history for context
    const conversationMessages = [
      {
        role: "system",
        content: `You are Sphere, an AI learning assistant for LearnSphere. Provide clean, helpful responses for computer science students. Keep responses concise and educational. Use bullet points with dashes. Keep paragraphs short. Be friendly and helpful. Remember previous conversations to provide context.`
      }
    ];

    // Add the last 10 messages for context (so the AI remembers previous conversation)
    const recentMessages = chatHistory.slice(-10);
    for (const msg of recentMessages) {
      conversationMessages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    }

    // Add file content if present
    let finalUserMessage = userMessage;
    if (fileContent) {
      finalUserMessage = `The student has uploaded a file with this content:\n\n${fileContent}\n\nTheir question is: ${userMessage || "Please summarize this document and explain the key concepts."}`;
    }

    conversationMessages.push({
      role: "user",
      content: finalUserMessage
    });

    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: conversationMessages,
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
    
    const updatedMessages = [...messages, newUserMessage];
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
        
        if (combinedContent.trim() && combinedContent.length > 100) {
          // Pass the FULL chat history for context
          aiResponse = await callGroqAPI(userCaption || "Please summarize this document and explain the key concepts.", updatedMessages, combinedContent);
        } else {
          aiResponse = `I received your file(s) but couldn't extract readable text. 

For best results, please upload a TEXT (.txt) file. 

What specific topic would you like help with?`;
        }
      } else if (isOnline && isAPIKeyConfigured) {
        // Pass the FULL chat history for context
        aiResponse = await callGroqAPI(userCaption, updatedMessages, undefined);
      } else if (!isOnline) {
        aiResponse = "I'm in offline mode. Please connect to the internet for AI-powered assistance.";
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
      
      const finalMessages = [...updatedMessages, newAiMessage];
      setMessages(finalMessages);
      saveCurrentMessages(finalMessages);
      
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
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveCurrentMessages(finalMessages);
      
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
                <div className="p-4 border-b sticky top-0 bg-white">
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
                          <p className="text-xs text-gray-400">{session.messages.length} messages</p>
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
                <h3 className="text-white font-semibold">Sphere</h3>
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
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-dark mb-2">Start a conversation with Sphere</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Ask Sphere anything about computer science, programming, or upload a TXT file for analysis!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
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
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex flex-row">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-gray-500">Sphere is thinking...</span>
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
                placeholder={pendingFiles.length > 0 ? "Add a message (optional)..." : "Ask Sphere anything..."}
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
                    accept=".txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <div className="bg-white border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50">
                    <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to select TXT files</p>
                    <p className="text-xs text-gray-400 mt-1">Supported: TXT files only (Max 10MB each)</p>
                    <p className="text-xs text-blue-500 mt-2">Tip: For PDF/DOCX, please convert to TXT first</p>
                  </div>
                </label>
              </div>
            )}
            
            <p className="text-xs text-gray-400 text-center mt-2">
              {isOnline && isAPIKeyConfigured 
                ? "Sphere is powered by Groq AI | Upload TXT files for analysis" 
                : !isAPIKeyConfigured ? "Add VITE_GROQ_API_KEY to .env file" : "Connect to internet for AI features"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
