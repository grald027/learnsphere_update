import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle, Trash2, Download, Sparkles, Menu, Paperclip, FileText, X, Upload, Zap } from 'lucide-react';

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
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastModified: number;
}

interface UploadedFile {
  file: File;
  content: string;
  name: string;
  size: number;
  type: string;
}

// Groq API Configuration - Using environment variable
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
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

// Helper function to extract text from uploaded files
const extractFileContent = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  // For PDF files
  if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
    // Note: For full PDF support, you'd need pdf.js library
    // This is a simplified version that reads as text
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // For PDFs, we'll indicate that it's a PDF file
        resolve(`[PDF Document: ${file.name}]\n\nContent extracted from PDF. For complete PDF parsing, consider integrating pdf.js library.\n\nSample content preview: ${result.substring(0, 500)}...`);
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsText(file);
    });
  }
  
  // For DOCX files
  else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Note: For full DOCX support, you'd need mammoth.js or similar
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(`[Word Document: ${file.name}]\n\nThis is a DOCX file. For complete document parsing, consider integrating a library like mammoth.js.\n\nFile size: ${(file.size / 1024).toFixed(2)} KB`);
      };
      reader.readAsArrayBuffer(file);
    });
  }
  
  // For PPT/PPTX files
  else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || 
           fileType === 'application/vnd.ms-powerpoint' || 
           fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return new Promise((resolve) => {
      resolve(`[PowerPoint Presentation: ${file.name}]\n\nThis is a presentation file. For complete parsing, consider integrating a library for PPTX processing.\n\nFile size: ${(file.size / 1024).toFixed(2)} KB\n\nSlides would normally be extracted here.`);
    });
  }
  
  // For text-based files (TXT, MD, JSON, etc.)
  else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};

// Get file icon based on type
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄 PDF';
    case 'docx':
    case 'doc':
      return '📝 DOCX';
    case 'ppt':
    case 'pptx':
      return '📊 PPT';
    default:
      return '📎 File';
  }
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show warning if API key is missing
  useEffect(() => {
    if (!isAPIKeyConfigured) {
      setError("⚠️ Groq API key is missing. Please add VITE_GROQ_API_KEY to your .env file");
    } else {
      console.log('API key configured successfully');
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
      text: "Hello! 👋 I'm your LearnSphere AI tutor.\n\nI can help you with:\n• Programming concepts (Python, JavaScript, Java)\n• Data structures and algorithms\n• Web development\n• Computer science fundamentals\n• Study tips and learning strategies\n\n📎 You can also upload PDF, DOCX, or PPT files, and I'll help explain the content or create quizzes for you!\n\nWhat would you like to learn today?",
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

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setShowFileUpload(false);
    setIsTyping(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        setTimeout(() => setError(null), 4000);
        continue;
      }

      try {
        const fileContent = await extractFileContent(file);
        
        const fileMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          text: `📎 **Uploaded file:** ${file.name}\n**Type:** ${getFileIcon(file.name)}\n**Size:** ${(file.size / 1024).toFixed(2)} KB\n\nI'd like help with this document.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        };
        
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, fileMessage];
          saveCurrentMessages(updatedMessages);
          return updatedMessages;
        });
        
        // Store file content for context
        setUploadedFiles(prev => [...prev, {
          file,
          content: fileContent,
          name: file.name,
          size: file.size,
          type: file.type
        }]);
        
        // Generate AI response based on file
        const aiResponse = await generateFileBasedResponse(file, fileContent);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: aiResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };
        
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, aiMessage];
          saveCurrentMessages(updatedMessages);
          return updatedMessages;
        });
        
      } catch (error) {
        console.error('Error processing file:', error);
        setError(`Failed to process "${file.name}". Please try again.`);
        setTimeout(() => setError(null), 4000);
      }
    }
    
    setIsTyping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate AI response based on uploaded file
  const generateFileBasedResponse = async (file: File, content: string): Promise<string> => {
    if (!isOnline || !isAPIKeyConfigured) {
      return getFallbackFileResponse(file.name);
    }
    
    const prompt = `I've uploaded a file named "${file.name}" (${(file.size / 1024).toFixed(2)} KB). 
    
File content preview: ${content.substring(0, 1500)}

Please:
1. Summarize what this document appears to be about
2. Identify 3-5 key topics or concepts from this document
3. Suggest how I can study this material effectively
4. Offer to create a quiz based on this content

Keep your response helpful, educational, and well-formatted with bullet points.`;

    const conversationMessages = [
      {
        role: "system",
        content: "You are LearnSphere AI Tutor. A student has uploaded a document. Help them understand it and offer to create quizzes or explain concepts."
      },
      {
        role: "user",
        content: prompt
      }
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
          max_tokens: 800
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      return formatAIResponse(data.choices[0].message.content);
      
    } catch (error) {
      console.error('API error for file:', error);
      return getFallbackFileResponse(file.name);
    }
  };

  const getFallbackFileResponse = (fileName: string): string => {
    return `📄 **File Analysis: ${fileName}**

I've received your document! Here's what I can help with:

**What you can ask me:**
• "Explain the main concepts from this document"
• "Create a quiz based on this material"
• "Summarize the key points"
• "What are the important topics covered?"

**Study suggestions:**
1. Review the document section by section
2. Take notes on key terms and definitions
3. Ask me specific questions about the content
4. Request a practice quiz to test your understanding

**To get started:** Just ask me questions about the document, or say "Create a quiz" and I'll generate questions based on the material!

${!isOnline ? "\n*Note: You're in offline mode. For full AI-powered document analysis, please connect to the internet.*" : ""}`;
  };

  // Handle quiz generation request
  const handleQuizRequest = async (documentContent: string, topic?: string) => {
    if (!isOnline || !isAPIKeyConfigured) {
      return generateOfflineQuiz(topic);
    }
    
    const prompt = `Based on the following document content, create a 5-question quiz to test understanding.
    
Document content: ${documentContent.substring(0, 2000)}

${topic ? `Focus specifically on: ${topic}` : 'Cover the main topics from the document'}

Format each question as:
**Question 1:** [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
**Answer:** [Correct letter]
**Explanation:** [Brief explanation]`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an educational assistant creating quizzes." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      return formatAIResponse(data.choices[0].message.content);
      
    } catch (error) {
      return generateOfflineQuiz(topic);
    }
  };

  const generateOfflineQuiz = (topic?: string): string => {
    return `📝 **Practice Quiz** ${topic ? `on "${topic}"` : ''}

**Question 1:** What is the best way to study this material?
A) Skim through once
B) Take notes and review actively
C) Just read without understanding
D) Memorize everything

**Answer:** B

**Question 2:** How can you test your understanding?
A) By asking questions
B) By teaching others
C) By taking practice quizzes
D) All of the above

**Answer:** D

**For more personalized quizzes, please connect to the internet and I'll generate questions based on your actual documents!**`;
  };

  // Groq API Call Function
  const callGroqAPI = async (userMessage: string, chatHistory: Message[]): Promise<string> => {
    if (!isAPIKeyConfigured) {
      throw new Error('API key not configured');
    }

    // Check if user is asking for a quiz
    const wantsQuiz = userMessage.toLowerCase().includes('quiz') || 
                      userMessage.toLowerCase().includes('test me') ||
                      userMessage.toLowerCase().includes('practice questions');

    // If there are uploaded files and user wants a quiz
    if (wantsQuiz && uploadedFiles.length > 0) {
      const fileContent = uploadedFiles[0].content;
      const topicMatch = userMessage.match(/(?:on|about)\s+([^.?!]+)/i);
      const topic = topicMatch ? topicMatch[1] : undefined;
      return await handleQuizRequest(fileContent, topic);
    }

    // Check if user is asking about uploaded files
    const hasFileContext = userMessage.toLowerCase().includes('file') || 
                           userMessage.toLowerCase().includes('document') ||
                           userMessage.toLowerCase().includes('upload');

    let contextPrompt = userMessage;
    if (hasFileContext && uploadedFiles.length > 0) {
      contextPrompt = `Context: The user has uploaded a file named "${uploadedFiles[0].name}". 
File content preview: ${uploadedFiles[0].content.substring(0, 1000)}

User question: ${userMessage}`;
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
7. Format responses neatly with proper spacing
8. If a student has uploaded a document, help them understand it and offer quizzes`
      },
      ...chatHistory.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: "user",
        content: contextPrompt
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
    
    if (lowerQuestion.includes('quiz') || lowerQuestion.includes('test me')) {
      return generateOfflineQuiz();
    }
    
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
    
    return "I understand you're asking about computer science. 📚\n\nFor the best learning experience, please connect to the internet so I can provide detailed, AI-powered responses.\n\nIn the meantime, you can:\n• Browse our Learning Library for downloadable modules\n• Check out Python, Web Development, or DSA content\n• Upload PDF, DOCX, or PPT files for document analysis\n• Ask me specific questions about programming concepts\n\nWhat specific topic would you like to explore?";
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
    if (window.confirm('Are you sure you want to clear this chat? All messages and uploaded files will be deleted.')) {
      setUploadedFiles([]);
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
      setUploadedFiles([]); // Clear uploaded files when switching sessions
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat session?')) {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('learnsphere_chat_sessions', JSON.stringify(updatedSessions));
      
      if (currentSessionId === sessionId) {
        setUploadedFiles([]);
        createNewSession();
      }
    }
  };

  const exportChat = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      const exportData = {
        session: session,
        uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
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
              {/* File Upload Indicator */}
              {uploadedFiles.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                  <FileText className="w-3 h-3 text-white" />
                  <span className="text-xs text-white">{uploadedFiles.length} file(s)</span>
                </div>
              )}
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
                  Ask me anything about computer science, programming, or 📎 upload PDF, DOCX, or PPT files for document analysis and quizzes!
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
                        {msg.fileInfo && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                            <FileText className="w-3 h-3" />
                            <span>{msg.fileInfo.name}</span>
                          </div>
                        )}
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
            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
              {/* File Upload Preview */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-gray-600 truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="text-gray-400 hover:text-primary transition-colors mr-2"
                  title="Upload file (PDF, DOCX, PPT)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isOnline && isAPIKeyConfigured ? "Ask me anything... or upload PDF, DOCX, PPT files..." : "Add API key to .env file to enable AI..."}
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
              </div>
              
              {/* File Upload Options */}
              <AnimatePresence>
                {showFileUpload && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        <span className="text-sm text-gray-600">Upload a file:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFileUpload(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.doc,.ppt,.pptx,.txt,.md"
                          onChange={handleFileUpload}
                          className="hidden"
                          multiple
                        />
                        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-center text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                          📄 Choose File(s)
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 flex items-center">
                        PDF, DOCX, PPT (Max 10MB)
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      💡 Tip: Upload lesson files and ask me to explain concepts or create quizzes!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2">
              {isOnline && isAPIKeyConfigured 
                ? "Powered by Groq AI • Llama 3.3 70B • 📎 Upload PDF, DOCX, PPT for analysis" 
                : !isAPIKeyConfigured 
                ? "⚠️ Add VITE_GROQ_API_KEY to .env file" 
                : "Offline mode • Basic responses only"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
