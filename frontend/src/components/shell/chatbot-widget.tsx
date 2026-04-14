"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Loader2, Phone, Mail, ArrowRight } from "lucide-react";
import api from "@/lib/api";

interface ChatAction {
  type: 'link' | 'search' | 'phone' | 'email';
  label: string;
  value: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  actions?: ChatAction[];
  suggestions?: string[];
  timestamp: number;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: 'Merhaba! Ben TransitIQ asistanıyım. Bilet arama, iptal, ödeme ve seyahat hakkında yardımcı olabilirim. Sana nasıl yardımcı olayım?',
  suggestions: [
    'İstanbul Ankara bileti',
    'Biletimi nasıl iptal ederim?',
    'Ödeme güvenli mi?',
    'Bagaj hakkım ne kadar?',
  ],
  timestamp: Date.now(),
};

function ActionButton({ action }: { action: ChatAction }) {
  const iconMap = {
    link: <ArrowRight className="w-3 h-3" />,
    search: <ArrowRight className="w-3 h-3" />,
    phone: <Phone className="w-3 h-3" />,
    email: <Mail className="w-3 h-3" />,
  };

  if (action.type === 'phone' || action.type === 'email') {
    return (
      <a
        href={action.value}
        target={action.type === 'phone' ? '_blank' : undefined}
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
      >
        {action.label} {iconMap[action.type]}
      </a>
    );
  }

  return (
    <Link
      href={action.value}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
    >
      {action.label} {iconMap[action.type]}
    </Link>
  );
}

export function ChatbotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setUnread(0);
    }
  }, [open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: clean,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: clean });
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: res.data.text,
        actions: res.data.actions,
        suggestions: res.data.suggestions,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, botMsg]);
      if (!open) setUnread((u) => u + 1);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'bot',
          text: 'Şu an yanıt veremiyorum. Lütfen biraz sonra tekrar dene veya destek@transitiq.com üzerinden yaz.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Hide on admin/driver routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/driver') || pathname?.startsWith('/checkout')) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            aria-label="Asistanı aç"
            className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-center group hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-zinc-950">
                {unread}
              </span>
            )}
            <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-6 z-40 w-[calc(100vw-3rem)] sm:w-96 h-[560px] max-h-[calc(100vh-3rem)] rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">TransitIQ Asistan</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">Şimdi çevrimiçi</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Asistanı kapat"
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50 dark:bg-zinc-950/50"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-bl-md border border-slate-200/60 dark:border-zinc-700/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.actions.map((a, i) => (
                          <ActionButton key={i} action={a} />
                        ))}
                      </div>
                    )}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => send(s)}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Sorunu yaz..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Gönder"
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
