import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { getChatResponse } from '../utils/chatResponses';
interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  time: string;
}
export function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>([
  {
    id: '1',
    type: 'ai',
    text: "Hello! I'm your LearnSphere AI tutor. How can I help you with your studies today?",
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }]
  );
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);
    // Simulate AI processing time
    setTimeout(() => {
      const aiResponseText = getChatResponse(newUserMessage.text);
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages((prev) => [...prev, newAiMessage]);
      setIsTyping(false);
    }, 1500);
  };
  return (
    <section className="bg-secondary/20 min-h-[calc(100vh-80px)] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{
          opacity: 0,
          y: 24
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut'
        }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        
        {/* Chat Header */}
        <div className="bg-primary px-6 py-4 flex items-center shadow-sm z-10 shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white mr-4">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-semibold">LearnSphere Tutor</h3>
            <p className="text-primary-100 text-xs text-white/80">
              Always online (Local)
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) =>
            <motion.div
              key={msg.id}
              initial={{
                opacity: 0,
                y: 24
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                delay: index === messages.length - 1 ? 0 : index * 0.15
              }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              
                <div
                className={`flex max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                  <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'user' ? 'bg-gray-200 ml-3' : 'bg-primary/10 mr-3'}`}>
                  
                    {msg.type === 'user' ?
                  <User className="w-4 h-4 text-gray-600" /> :

                  <Bot className="w-4 h-4 text-primary" />
                  }
                  </div>
                  <div>
                    <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.type === 'user' ? 'bg-gray-100 text-dark rounded-tr-none' : 'bg-secondary text-dark rounded-tl-none border border-primary/10'}`}>
                    
                      {msg.text}
                    </div>
                    <span
                    className={`text-[10px] text-gray-400 mt-1 block ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    
                      {msg.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {isTyping &&
            <motion.div
              initial={{
                opacity: 0,
                y: 24
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                scale: 0.9
              }}
              className="flex justify-start">
              
                <div className="flex flex-row max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 mr-3">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-secondary text-dark rounded-tl-none border border-primary/10 flex items-center space-x-1">
                    <motion.div
                    animate={{
                      y: [0, -5, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: 0
                    }}
                    className="w-2 h-2 bg-primary/60 rounded-full" />
                  
                    <motion.div
                    animate={{
                      y: [0, -5, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: 0.2
                    }}
                    className="w-2 h-2 bg-primary/60 rounded-full" />
                  
                    <motion.div
                    animate={{
                      y: [0, -5, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: 0.4
                    }}
                    className="w-2 h-2 bg-primary/60 rounded-full" />
                  
                  </div>
                </div>
              </motion.div>
            }
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-dark placeholder-gray-400" />
            
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-accent transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed">
              
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </section>);

}