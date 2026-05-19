import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_ENDPOINT = "/api/chat";

const SYSTEM_PROMPT = `You are a helpful, friendly AI assistant. 
Answer questions clearly and concisely. 
If you don't know something, say so honestly.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).slice(2, 9);

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="message-row ai-row">
      <div className="avatar">AI</div>
      <div className="bubble assistant-bubble typing-bubble">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`message-row ${isUser ? "user-row" : "ai-row"}`}>
      {!isUser && <div className="avatar">AI</div>}
      <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
        <p className="bubble-text">{message.content}</p>
        <span className="timestamp">{formatTime(message.timestamp)}</span>
      </div>
      {isUser && <div className="avatar user-avatar">You</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...updatedMessages.map(({ role, content }) => ({ role, content })),
      ];

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          errBody?.error || `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data: GroqResponse = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) throw new Error("Empty response from AI.");

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content,
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:        #0d0f14;
          --surface:   #13161e;
          --surface2:  #1a1e29;
          --border:    rgba(255,255,255,0.07);
          --accent:    #4f8ef7;
          --accent2:   #7c5cfc;
          --user-bg:   linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%);
          --ai-bg:     #1a1e29;
          --text:      #e8eaf0;
          --text-muted:#6b7280;
          --error:     #ef4444;
          --radius:    18px;
          --font:      'DM Sans', sans-serif;
          --mono:      'DM Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-section {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          max-height: 100dvh;
          background: var(--bg);
          font-family: var(--font);
          color: var(--text);
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e88;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        .header-title { font-size: 15px; font-weight: 600; letter-spacing: 0.01em; }
        .header-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
        .clear-btn {
          background: none; border: 1px solid var(--border);
          color: var(--text-muted); font-family: var(--font);
          font-size: 12px; padding: 6px 14px; border-radius: 8px;
          cursor: pointer; transition: all .2s;
        }
        .clear-btn:hover {
          border-color: var(--accent); color: var(--accent);
          background: rgba(79,142,247,.06);
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        .message-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          animation: fadeUp .25s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .user-row  { flex-direction: row-reverse; }
        .ai-row    { flex-direction: row; }

        .avatar {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 600; letter-spacing: .04em;
          flex-shrink: 0; border: 1px solid var(--border);
        }
        .user-avatar {
          background: linear-gradient(135deg, #4f8ef7, #7c5cfc);
          color: #fff; border: none;
        }
        .ai-row .avatar { background: var(--surface2); color: var(--accent); }

        .bubble {
          max-width: min(72%, 520px);
          padding: 12px 16px 10px;
          border-radius: var(--radius);
          position: relative;
        }
        .user-bubble {
          background: var(--user-bg);
          border-bottom-right-radius: 5px;
          color: #fff;
        }
        .assistant-bubble {
          background: var(--ai-bg);
          border: 1px solid var(--border);
          border-bottom-left-radius: 5px;
          color: var(--text);
        }
        .bubble-text { font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
        .timestamp {
          display: block; font-size: 10px;
          color: rgba(255,255,255,.35);
          margin-top: 5px; text-align: right;
          font-family: var(--mono);
        }
        .assistant-bubble .timestamp { color: var(--text-muted); }

        .typing-bubble {
          display: flex; align-items: center; gap: 5px;
          padding: 14px 18px;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--accent);
          animation: bounce .9s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: .15s; }
        .dot:nth-child(3) { animation-delay: .30s; }
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); opacity: .5; }
          30%          { transform: translateY(-6px); opacity: 1; }
        }

        .error-banner {
          margin: 0 20px;
          padding: 11px 16px;
          border-radius: 10px;
          background: rgba(239,68,68,.1);
          border: 1px solid rgba(239,68,68,.25);
          color: #fca5a5; font-size: 13px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 10px;
          flex-shrink: 0; animation: fadeUp .2s ease;
        }
        .error-close {
          background: none; border: none; cursor: pointer;
          color: #fca5a5; font-size: 16px; line-height: 1; padding: 0 2px;
        }

        .input-area {
          padding: 16px 20px 20px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
        }
        .input-row {
          display: flex; align-items: flex-end; gap: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 10px 10px 16px;
          transition: border-color .2s;
        }
        .input-row:focus-within {
          border-color: rgba(79,142,247,.4);
          box-shadow: 0 0 0 3px rgba(79,142,247,.06);
        }
        .chat-textarea {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-family: var(--font);
          font-size: 14px; line-height: 1.5;
          resize: none; min-height: 24px; max-height: 160px; overflow-y: auto;
        }
        .chat-textarea::placeholder { color: var(--text-muted); }
        .chat-textarea::-webkit-scrollbar { width: 3px; }
        .chat-textarea::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .send-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #4f8ef7, #7c5cfc);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: opacity .2s, transform .15s;
        }
        .send-btn:hover:not(:disabled) { opacity: .9; transform: scale(1.05); }
        .send-btn:active:not(:disabled) { transform: scale(.95); }
        .send-btn:disabled { opacity: .35; cursor: not-allowed; }
        .send-btn svg { width: 16px; height: 16px; fill: #fff; }
        .input-hint { font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 8px; }
      `}</style>

      <div className="chat-section">
        <header className="chat-header">
          <div className="header-left">
            <div className="header-dot" />
            <div>
              <div className="header-title">AI Assistant</div>
              <div className="header-sub">Powered by Llama 3.3 · 70B</div>
            </div>
          </div>
          <button className="clear-btn" onClick={clearChat}>Clear chat</button>
        </header>

        <div className="messages-area">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button className="error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="Ask me anything… (Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}
