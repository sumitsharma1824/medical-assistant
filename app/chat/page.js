'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope, Send, Copy, Check, Trash2,
  ArrowLeft, User, Bot, Sparkles, GraduationCap,
} from 'lucide-react';

// ─── Typing Indicator ──────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
        <Bot size={16} color="white" />
      </div>
      <div className="bubble-ai px-4 py-3 inline-flex items-center gap-1.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

// ─── Chat Message ──────────────────────────────────────────────────────────

function ChatMessage({ msg, onCopy, copiedId, userDp }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ animation: 'fadeInUp 0.25s ease forwards' }}>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white overflow-hidden ${isUser ? 'bg-blue-600 border border-white/10' : ''}`}
        style={!isUser ? { background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' } : {}}>
        {isUser ? (
          userDp ? <img src={userDp} alt="User" className="w-full h-full object-cover" /> : <User size={14} />
        ) : (
          <Bot size={15} />
        )}
      </div>

      {/* Bubble */}
      <div className="relative group" style={{ maxWidth: '75%' }}>
        {isUser ? (
          <div className="bubble-user text-sm leading-relaxed px-4 py-3">{msg.content}</div>
        ) : (
          <div className="bubble-ai text-sm leading-relaxed px-4 py-3">
            <ReactMarkdown>{msg.content}</ReactMarkdown>

            {/* Copy button */}
            <button
              id={`copy-btn-${msg.id}`}
              onClick={() => onCopy(msg.id, msg.content)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ background: '#1e2a3a', borderColor: '#2a3a4a' }}
              title="Copy response">
              {copiedId === msg.id
                ? <Check size={12} color="#10b981" />
                : <Copy size={12} color="#9ca3af" />}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1.5 text-gray-600 ${isUser ? 'text-right' : ''}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Suggestion Chips ──────────────────────────────────────────────────────

const SUGGESTIONS = {
  patient: [
    'What are symptoms of diabetes?',
    'How does blood pressure medication work?',
    'When should I see a doctor for a fever?',
  ],
  student: [
    'Explain ARDS pathophysiology',
    'Warfarin drug interactions',
    'Chest pain differential diagnosis',
  ],
};

// ─── Main Chat Page ────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user, userRole, userDp, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !historyLoaded) loadHistory();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/chat?user_Id=${user.uid}`);
      const data = await res.json();
      if (data.chats?.length > 0) {
        const sorted = [...data.chats].reverse();
        const restored = sorted.flatMap((chat) => [
          { id: `${chat._id}-user`, role: 'user', content: chat.user_message, timestamp: chat.createdAt },
          { id: `${chat._id}-ai`, role: 'assistant', content: chat.ai_response, timestamp: chat.createdAt },
        ]);
        setMessages(restored);
      }
    } catch { /* silent */ }
    finally { setHistoryLoaded(true); }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !user) return;
    if (!userRole) {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: '⚠️ Your role could not be loaded. Please sign out and sign back in.',
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    const userMsg = {
      id: `user-${Date.now()}`, role: 'user',
      content: input.trim(), timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_Id: user.uid, message: currentInput, role: userRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`, role: 'assistant',
        content: data.message, timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: `⚠️ ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, user, userRole]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyToClipboard = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearHistory = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await fetch(`/api/chat?user_Id=${user.uid}`, { method: 'DELETE' });
      setMessages([]);
    } catch { /* silent */ }
    finally { setClearing(false); }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#090e1a' }}>
        <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const isPatient = userRole === 'patient';
  const suggestions = SUGGESTIONS[userRole] || SUGGESTIONS.patient;
  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-screen" style={{ background: '#090e1a' }}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ── Header ── */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0"
        style={{ background: 'rgba(9,14,26,0.9)', backdropFilter: 'blur(20px)' }}>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" id="back-to-dashboard">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-200">
              <ArrowLeft size={16} color="#9ca3af" />
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
              <Stethoscope size={18} color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">MedAssist AI</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-gray-500">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${isPatient
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-purple-500/10 border-purple-500/25 text-purple-400'
            }`}>
            {isPatient ? <User size={11} /> : <GraduationCap size={11} />}
            {isPatient ? 'Patient' : 'Clinical'}
          </div>

          {!userRole && (
            <span className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 px-3 py-1.5 rounded-full">
              Role not loaded
            </span>
          )}

          {messages.length > 0 && (
            <button id="clear-history-btn" onClick={clearHistory} disabled={clearing}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] text-red-400 hover:bg-red-500/15 transition-all duration-200">
              <Trash2 size={12} />
              {clearing ? 'Clearing…' : 'Clear'}
            </button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto w-full space-y-6">

          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-20 text-center"
              style={{ animation: 'fadeIn 0.4s ease forwards' }}>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}>
                <Sparkles size={32} color="#4f8ef7" style={{ opacity: 0.7 }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">How can I help you today?</h2>
              <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
                {isPatient
                  ? 'Ask anything about your health in simple, clear language.'
                  : 'Ask complex clinical questions and get detailed, evidence-based answers.'}
              </p>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                {suggestions.map((s) => (
                  <button key={s} id={`suggestion-${s.slice(0, 12).replace(/\s/g, '-')}`}
                    onClick={() => setInput(s)}
                    className="text-xs px-4 py-2.5 rounded-full border border-blue-500/20 bg-blue-500/[0.07] text-blue-300 hover:bg-blue-500/15 hover:-translate-y-0.5 transition-all duration-200">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} onCopy={copyToClipboard} copiedId={copiedId} userDp={userDp} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className="relative flex-shrink-0 px-6 pb-6 pt-4 border-t border-white/[0.06]"
        style={{ background: 'rgba(9,14,26,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 px-4 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] focus-within:border-blue-500/40 focus-within:bg-blue-500/[0.03] transition-all duration-200">
            <textarea
              id="chat-input"
              ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={isPatient
                ? 'Describe symptoms or ask a health question…'
                : 'Ask a clinical question…'}
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-200 placeholder-gray-600 leading-relaxed"
              style={{ maxHeight: 130, fontFamily: 'inherit', paddingTop: 6, paddingBottom: 6 }}
            />

            <button
              id="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg,#4f8ef7,#6366f1)'
                  : 'rgba(255,255,255,0.05)',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() && !isLoading ? '0 2px 12px rgba(79,142,247,0.3)' : 'none',
              }}>
              <Send size={16} color={input.trim() && !isLoading ? 'white' : '#374151'} />
            </button>
          </div>

          <p className="text-[10px] text-center mt-3 text-gray-700">
            Enter to send · Shift+Enter for new line · Chats auto-delete after 3 days
          </p>
        </div>
      </div>

    </div>
  );
}