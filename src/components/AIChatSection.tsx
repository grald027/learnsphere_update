import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle, Trash2, Download, Sparkles, Menu, Paperclip, FileText, X, Upload, Zap, Plus } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  time: string;
  timestamp?: number;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    content?: string;
  };
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
  content: string;
  preview: string;
}

// Groq API Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const isAPIKeyConfigured = GROQ_API_KEY && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY !== '';

// Helper function to format AI response text - CLEAN VERSION
const formatAIResponse = (text: string): string => {
  // Clean up the response
  let formatted = text
    // Remove excessive asterisks and markdown
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    // Format numbered lists properly
    .replace(/(\d+)\.\s*\*\*/g, '$1. **')
    // Ensure proper spacing after periods
    .replace(/\.([A-Z])/g, '. $1')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove "Here are X questions" type preambles
    .replace(/^.*?(Here are|Let me|I'll create|Based on).*?\n\n/i, '')
    .trim();
  
  return formatted;
};

// Clean quiz formatter
const formatQuizResponse = (text: string): string => {
  let formatted = text;
  
  // Remove markdown and clean up
  formatted = formatted
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    // Format questions nicely
    .replace(/Question\s*(\d+)[:.\s]*/gi, '\n📝 **Question $1**\n')
    // Format options
    .replace(/([A-D]\))\s*/g, '\n   $1 ')
    // Format answers
    .replace(/Answer:\s*([A-D])/gi, '\n✅ **Answer:** $1')
    // Format explanations
    .replace(/Explanation:\s*/gi, '\n💡 **Explanation:** ')
    .trim();
  
  return formatted;
};

// Extract file content
const extractFileContent = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      resolve(`[File: ${file.name}]\n${content.substring(0, 3000)}`);
    };
    reader.onerror = () => resolve(`[File: ${file.name}] - Preview not available`);
    reader.readAsText(file);
  });
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAPIKeyConfigured) {
      setError("⚠️ Groq API key is missing. Please add VITE_GROQ_API_KEY to your .env file");
    }
  }, []);

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
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
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
      text: "Hello! 👋 I'm your LearnSphere AI tutor.\n\nI can help you with:\n• Programming concepts\n• Data structures & algorithms\n• Web development\n• Computer science fundamentals\n\n📎 You can also attach PDF, DOCX, or PPT files - just click the paperclip icon!\n\nWhat would you like to learn today?",
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
    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      setCurrentSessionId(newSessionId);
      
      const newSession: ChatSession = {
        id: newSessionId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        messages: updatedMessages,
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
      localStorage.setItem('learnsphere_current_session', JSON.stringify({
        id: newSessionId,
        messages: updatedMessages
      }));
      setMessages(updatedMessages);
      return;
    }
    
    const existingSession = sessions.find(s => s.id === currentSessionId);
    let updatedSessions;
    
    if (existingSession) {
      const updatedSession = {
        ...existingSession,
        messages: updatedMessages,
        lastModified: Date.now(),
        title: updatedMessages.length > 1 && updatedMessages[1]?.text 
          ? updatedMessages[1].text.substring(0, 30) + '...' 
          : existingSession.title
      };
      updatedSessions = sessions.map(s => s.id === currentSessionId ? updatedSession : s);
    } else {
      const newSession: ChatSession = {
        id: currentSessionId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        messages: updatedMessages,
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      updatedSessions = [newSession, ...sessions];
    }
    
    setSessions(updatedSessions);
    setMessages([...updatedMessages]);
    
    localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
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

  // Handle file selection (stores pending, doesn't send immediately)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setShowFileUpload(false);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }

      try {
        const fileContent = await extractFileContent(file);
        const preview = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
        
        setPendingFiles(prev => [...prev, {
          file,
          content: fileContent,
          preview
        }]);
      } catch (error) {
        console.error('Error processing file:', error);
        setError(`Failed to process "${file.name}". Please try again.`);
        setTimeout(() => setError(null), 4000);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove pending file
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send message with attached files
  const handleSendWithFiles = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && pendingFiles.length === 0) || isTyping) return;
    
    const userCaption = inputValue.trim();
    const hasFiles = pendingFiles.length > 0;
    
    // Build message text
    let messageText = '';
    if (hasFiles) {
      messageText = `📎 **Attached ${pendingFiles.length} file(s):**\n`;
      pendingFiles.forEach(f => {
        messageText += `• ${f.file.name}\n`;
      });
      if (userCaption) {
        messageText += `\n**Message:** ${userCaption}`;
      } else {
        messageText += `\n\nPlease analyze these files and help me learn from them.`;
      }
    } else {
      messageText = userCaption;
    }
    
    // Create user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      fileInfo: hasFiles ? {
        name: pendingFiles.map(f => f.file.name).join(', '),
        size: pendingFiles.reduce((acc, f) => acc + f.file.size, 0),
        type: 'multiple',
        content: pendingFiles.map(f => f.content).join('\n\n---\n\n')
      } : undefined
    };
    
    // Save user message
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newUserMessage];
      saveCurrentMessages(updatedMessages);
      return updatedMessages;
    });
    
    // Store file content for AI context
    const filesContent = pendingFiles.map(f => f.content).join('\n\n---\n\n');
    const filesList = pendingFiles.map(f => f.file.name).join(', ');
    
    setInputValue('');
    setPendingFiles([]);
    setIsTyping(true);
    setError(null);
    
    // Generate AI response
    try {
      let aiResponse: string;
      
      if (isOnline && isAPIKeyConfigured) {
        aiResponse = await callGroqAPI(userCaption || "Please analyze these files and help me learn.", messages, filesContent, filesList);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        aiResponse = getFallbackFileResponse(filesList, userCaption);
      }
      
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newAiMessage];
        saveCurrentMessages(updatedMessages);
        return updatedMessages;
      });
      
    } catch (error) {
      console.error('Send message error:', error);
      setError("Failed to get response. Please try again.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I'm having trouble connecting right now. ⚠️\n\nPlease check your internet connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, errorMessage];
        saveCurrentMessages(updatedMessages);
        return updatedMessages;
      });
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTyping(false);
    }
  };

  // Clean Groq API Call
  const callGroqAPI = async (userMessage: string, chatHistory: Message[], fileContent?: string, filesList?: string): Promise<string> => {
    if (!isAPIKeyConfigured) throw new Error('API key not configured');
    
    const isQuizRequest = userMessage.toLowerCase().includes('quiz') || 
                          userMessage.toLowerCase().includes('test me') ||
                          userMessage.toLowerCase().includes('practice questions');
    
    let systemPrompt = `You are LearnSphere AI Tutor. Provide clean, well-organized responses for computer science students.

FORMATTING RULES:
- Use simple markdown: **bold** for emphasis
- For lists, use • on new lines
- Keep paragraphs short (2-3 sentences)
- Add line breaks between sections
- NEVER use asterisks for lists (use • instead)
- Keep responses concise and educational

${fileContent ? `The student has uploaded: ${filesList}\nFile content preview:\n${fileContent.substring(0, 2000)}` : ''}

${isQuizRequest ? `When creating a quiz:
- Start with a brief intro (1 sentence max)
- Format each question cleanly
- Show answer after each question
- Keep explanations brief` : ''}`;

    const conversationMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-8).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text.substring(0, 1000)
      })),
      { role: "user", content: userMessage || "Please analyze the attached files and help me learn from them." }
    ];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      let responseText = data.choices[0].message.content;
      
      // Apply clean formatting
      if (isQuizRequest) {
        responseText = formatQuizResponse(responseText);
      } else {
        responseText = formatAIResponse(responseText);
      }
      
      return responseText;
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const getFallbackFileResponse = (filesList: string, userMessage: string): string => {
    const hasQuizRequest = userMessage.toLowerCase().includes('quiz');
    
    if (hasQuizRequest) {
      return `📝 **Quick Practice Questions**

**Question 1:** What is the main topic of your document?
• Review the introduction section
• Look for repeated key terms
• Check the document title

**Question 2:** Can you identify three key concepts?
• Scan each section heading
• Look for bold or highlighted terms
• Check summary sections

💡 **Tip:** For better quiz generation, please connect to the internet. I'll then create personalized questions based on your actual document content!`;
    }
    
    return `📄 **I've received your file:** ${filesList}

**What would you like me to help with?**

• Explain key concepts from this document
• Create a quiz to test your understanding  
• Summarize the main points
• Answer specific questions about the content

Just let me know what you need! For full AI-powered analysis, please connect to the internet.`;
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat?')) {
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
    <section className="bg-secondary/20 min-h-[calc(100vh-80px)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl flex gap-4">
        
        {/* Chat History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden md:block overflow-hidden"
            >
              <div className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-140px)] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 sticky top-0 bg-white">
                  <h3 className="font-semibold text-dark">Chat History</h3>
                  <p className="text-xs text-gray-500 mt-1">{sessions.length} conversations</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={createNewSession}
                    className="w-full mb-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{session.title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(session.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)]"
        >
          {/* Chat Header */}
          <div className="bg-primary px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white mr-4">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold">LearnSphere AI Tutor</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/80">
                    {isOnline && isAPIKeyConfigured ? 'Connected' : !isAPIKeyConfigured ? 'API Key Missing' : 'Offline Mode'}
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
                className="hidden md:flex text-white/80 hover:text-white transition-colors"
                title="Chat History"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={exportChat}
                className="text-white/80 hover:text-white transition-colors"
                title="Export Chat"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={clearChat}
                className="text-white/80 hover:text-white transition-colors"
                title="New Chat"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-yellow-50 border-l-4 border-yellow-500 p-3 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-yellow-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.type === 'user' ? 'bg-primary/20 ml-3' : 'bg-primary/10 mr-3'
                  }`}>
                    {msg.type === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex flex-col max-w-full">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.type === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-dark rounded-tl-none border border-gray-200 shadow-sm'
                    }`}>
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className={`text-[10px] text-gray-400 mt-1 block ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 mr-3">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white text-dark rounded-tl-none border border-gray-200 shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-gray-100">
                {pendingFiles.map((file, idx) => (
                  <div key={idx} className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-gray-600">{file.preview}</span>
                    <button
                      type="button"
                      onClick={() => removePendingFile(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSendWithFiles} className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`text-gray-400 hover:text-primary transition-colors mr-2 p-1 rounded-full ${pendingFiles.length > 0 ? 'text-primary' : ''}`}
                title="Attach file (PDF, DOCX, PPT)"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={pendingFiles.length > 0 ? "Add a message or caption (optional)..." : "Ask me anything..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-dark placeholder-gray-400"
                disabled={isTyping}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendWithFiles(e);
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-accent transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            {/* File Upload Panel */}
            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      Attach files
                    </span>
                    <button onClick={() => setShowFileUpload(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <label className="block w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.ppt,.pptx,.txt,.md"
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                    />
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 cursor-pointer transition-colors">
                      <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to select files</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPT, TXT (Max 10MB each)</p>
                    </div>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
            
            <p className="text-xs text-gray-400 text-center mt-2">
              {isOnline && isAPIKeyConfigured 
                ? "Powered by Groq AI • Attach files for document analysis" 
                : !isAPIKeyConfigured 
                ? "⚠️ Add VITE_GROQ_API_KEY to .env file" 
                : "Offline mode • Connect for AI features"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
