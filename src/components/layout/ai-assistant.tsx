"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Minus, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowDot } from "@/components/ui/motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const suggestedPrompts = [
  "How do I get sync placements?",
  "Explain mechanical royalties",
  "What should I focus on today?",
  "How do I set up my publishing?",
];

export function AIAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          context_page: pathname,
          conversation_id: conversationId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
      } else {
        const aiMessage: Message = {
          role: "assistant",
          content:
            "Sorry, I had trouble processing that. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch {
      const aiMessage: Message = {
        role: "assistant",
        content: "Connection error. Please check your internet and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Floating button
  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 flex items-center justify-center"
        style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
        aria-label="Open AI Assistant"
      >
        <Brain className="size-6" />
      </motion.button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <motion.button
        onClick={() => setIsMinimized(false)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 glass-card rounded-full px-4 py-3 text-white shadow-lg hover:border-red-500/30 transition-all"
      >
        <Brain className="size-4 text-red-500" />
        <span className="text-sm font-medium chrome-text">FRVR AI</span>
        <GlowDot color="green" size="sm" />
      </motion.button>
    );
  }

  // Full chat panel
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-6 right-6 z-50 w-[400px] h-[500px] max-h-[80vh] flex flex-col glass-card rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Scan line effect at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A] bg-black/60 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-red-500" />
            <span className="text-sm font-semibold chrome-text">FRVR AI</span>
            <GlowDot color="green" size="sm" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="size-7 rounded-md flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors"
            >
              <Minus className="size-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="size-7 rounded-md flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Brain className="size-8 text-red-500/30 mb-3" />
              </motion.div>
              <p className="text-sm text-white font-medium mb-1">
                How can I help?
              </p>
              <p className="text-xs text-[#666] mb-4">
                Ask me anything about music, business, or the platform
              </p>
              <div className="space-y-2 w-full">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-3 py-2 rounded-lg glass-card text-xs text-[#666] hover:text-white transition-all"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "ml-auto bg-[#1A1A1A] text-white border border-[#222]"
                      : "mr-auto bg-black/40 text-[#D4D4D4] border-l-2 border-red-500/30"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mr-auto bg-black/40 px-3 py-2 rounded-xl flex items-center gap-2 border-l-2 border-red-500/30"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                        className="size-1.5 rounded-full bg-red-500"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#666]">Thinking...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-3 py-3 border-t border-[#1A1A1A] bg-black/60 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-white/[0.03] border border-[#1A1A1A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-red-500/30 focus:shadow-[0_0_10px_rgba(220,38,38,0.1)] transition-all"
              disabled={loading}
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "size-9 rounded-lg flex items-center justify-center transition-all",
                input.trim()
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-[#1A1A1A] text-[#555]"
              )}
            >
              <Send className="size-4" />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
