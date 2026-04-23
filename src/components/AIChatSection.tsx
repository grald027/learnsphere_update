import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle, Trash2, Download, Sparkles, Menu } from 'lucide-react';

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

// Groq API Configuration - Using environment variable
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// FIXED: Properly access the environment variable
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Check if API key is configured
const isAPIKeyConfigured = GROQ_API_KEY && GROQ_API_KEY !== 'undefined' && GROQ_API_KEY !== '';

// Helper function to format AI response text
const formatAIResponse = (text: string): string => {
  let formatted = text
    .replace(/\.([A-Z])/g, '. $1')
    .replace(/(\d+\.)/g, '\n$1')
    .replace(/[•\-]\s/g, '\n• ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return formatted;
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show warning if API key is missing
  useEffect(() => {
    if (!isAPIKeyConfigured) {
      setError("⚠️ Groq API key is missing. Please add VITE_GROQ_API_KEY to your .env file");
    } else {
      console.log('API key configured successfully'); // Debug log (won't show the actual key)
    }
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Monitor online/offline status
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
      text: "Hello! 👋 I'm your LearnSphere AI tutor.\n\nI can help you with:\n• Programming concepts (Python, JavaScript, Java)\n• Data structures and algorithms\n• Web development\n• Computer science fundamentals\n• Study tips and learning strategies\n\nWhat would you like to learn today?",
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
      // Create a new session if none exists
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
    
    // Update existing session
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

  // Groq API Call Function
  const callGroqAPI = async (userMessage: string, chatHistory: Message[]): Promise<string> => {
    // Check if API key is configured
    if (!isAPIKeyConfigured) {
      throw new Error('API key not configured');
    }

    const conversationMessages = [
      {
        role: "system",
        content: `You are LearnSphere AI Tutor, a helpful educational assistant for computer science students. 
        
Guidelines for responses:
1. Be concise but informative (2-4 paragraphs max)
2. Use bullet points with • for lists
3. Add line breaks between different topics
4. Keep language friendly and encouraging
5. If explaining code, keep it simple
6. Always be educational and accurate
7. Format responses neatly with proper spacing`
      },
      ...chatHistory.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 800,
      top_p: 1
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return formatAIResponse(data.choices[0].message.content);
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error('Groq API call failed:', error);
      throw error;
    }
  };

  // Organized fallback responses
  const getFallbackResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
      return "Hello! 👋 I'm your LearnSphere AI tutor.\n\nI'm currently in offline mode, but I can still help with basic computer science questions. For more detailed responses, please connect to the internet.";
    }
    
    if (lowerQuestion.includes('python')) {
      return "Python is an excellent programming language for beginners! 🐍\n\nHere's what you can learn:\n• Variables and data types\n• Loops and conditionals\n• Functions and modules\n• Lists, dictionaries, and sets\n• File handling\n\nDownload our 'Python Programming Fundamentals' module from the Learning Library!";
    }
    
    if (lowerQuestion.includes('javascript')) {
      return "JavaScript is the language of the web! 🌐\n\nKey topics include:\n• Variables and data types\n• Functions and arrow functions\n• Arrays and objects\n• DOM manipulation\n• Async/Await and Promises\n\nCheck out our web development modules for hands-on practice!";
    }
    
    if (lowerQuestion.includes('data structure')) {
      return "Data Structures are fundamental to computer science! 📊\n\nEssential data structures:\n• Arrays - Store ordered collections\n• Linked Lists - Dynamic size sequences\n• Stacks & Queues - LIFO/FIFO structures\n• Trees - Hierarchical data\n• Graphs - Network connections\n\nDownload our DSA module for detailed explanations!";
    }
    
    if (lowerQuestion.includes('web development') || lowerQuestion.includes('html') || lowerQuestion.includes('css')) {
      return "Web development has three main parts: 🎨\n\n1. Frontend (What users see)\n   • HTML - Structure\n   • CSS - Styling\n   • JavaScript - Interactivity\n\n2. Backend (Server-side)\n   • Databases\n   • APIs\n   • Authentication\n\nStart with our HTML/CSS module in the Learning Library!";
    }
    
    return "I understand you're asking about computer science. 📚\n\nFor the best learning experience, please connect to the internet so I can provide detailed, AI-powered responses.\n\nIn the meantime, you can:\n• Browse our Learning Library for downloadable modules\n• Check out Python, Web Development, or DSA content\n• Ask me specific questions about programming concepts\n\nWhat specific topic would you like to explore?";
  };

  const sendMessageToAI = async (userMessage: string) => {
    setIsTyping(true);
    
    try {
      let aiResponse: string;
      
      if (isOnline && isAPIKeyConfigured) {
        try {
          aiResponse = await callGroqAPI(userMessage, messages);
        } catch (apiError) {
          console.error('API error, using fallback:', apiError);
          aiResponse = getFallbackResponse(userMessage);
          setError("Using offline responses. Connect to internet for AI-powered answers.");
          setTimeout(() => setError(null), 4000);
        }
      } else if (!isAPIKeyConfigured) {
        await new Promise(resolve => setTimeout(resolve, 800));
        aiResponse = "[API Key Missing]\n\nPlease add your Groq API key to the .env file (VITE_GROQ_API_KEY) to enable AI responses. Using offline mode for now.\n\n" + getFallbackResponse(userMessage);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        aiResponse = `[Offline Mode]\n\n${getFallbackResponse(userMessage)}`;
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    
    const userMessageText = inputValue.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: userMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newUserMessage];
      saveCurrentMessages(updatedMessages);
      return updatedMessages;
    });
    
    setInputValue('');
    setError(null);
    
    await sendMessageToAI(userMessageText);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat? All messages will be deleted.')) {
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
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat session?')) {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
      
      if (currentSessionId === sessionId) {
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
                          <p className="text-xs text-gray-400">
                            {session.messages.length} messages
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
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No conversations yet
                    </div>
                  )}
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
                    {isOnline && isAPIKeyConfigured ? 'Connected to Groq AI' : !isAPIKeyConfigured ? 'API Key Missing' : 'Offline Mode'}
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
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-dark mb-2">Start a conversation</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Ask me anything about computer science, programming, or web development!
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.type === 'user' 
                          ? 'bg-primary/20 ml-3' 
                          : 'bg-primary/10 mr-3'
                      }`}>
                        {msg.type === 'user' ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <Bot className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
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
              </AnimatePresence>
            )}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 mr-3">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white text-dark rounded-tl-none border border-gray-200 shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isOnline && isAPIKeyConfigured ? "Ask me anything about computer science..." : "Add API key to .env file to enable AI..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-dark placeholder-gray-400"
                disabled={isTyping}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-accent transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2">
              {isOnline && isAPIKeyConfigured 
                ? "Powered by Groq AI • Llama 3.3 70B" 
                : !isAPIKeyConfigured 
                ? "⚠️ Add VITE_GROQ_API_KEY to .env file" 
                : "Offline mode • Using local responses"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
