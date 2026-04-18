'use client';

import { useEffect, useState, useRef, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope, Send, Copy, Check, Trash2,
  User, Bot, Sparkles, GraduationCap,
  MessageSquarePlus, ChevronLeft, ChevronRight,
  LayoutDashboard, Menu, X, MoreHorizontal,
} from 'lucide-react';

// ─── Utility ───────────────────────────────────────────────────────────────

function genSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Typing Indicator ──────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
        <Bot size={15} color="white" />
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
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white overflow-hidden ${isUser ? 'bg-blue-600' : ''}`}
        style={!isUser ? { background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' } : {}}>
        {isUser ? (
          userDp ? <img src={userDp} alt="User" className="w-full h-full object-cover" /> : <User size={14} />
        ) : (
          <Bot size={15} />
        )}
      </div>

      {/* Bubble */}
      <div className="relative group max-w-[95%] md:max-w-[75%]">
        {isUser ? (
          <div className="bubble-user text-sm leading-relaxed px-4 py-3 max-w-full">{msg.content}</div>
        ) : (
          <div className="bubble-ai text-sm leading-relaxed px-4 py-3">
            <ReactMarkdown>{msg.content}</ReactMarkdown>

            {/* Copy button */}
            <button
              id={`copy-btn-${msg.id}`}
              onClick={() => onCopy(msg.id, msg.content)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{ background: '#1e2a3a', borderColor: '#2a3a4a' }}
              title="Copy response">
              {copiedId === msg.id
                ? <Check size={11} color="#10b981" />
                : <Copy size={11} color="#9ca3af" />}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1 text-gray-600 ${isUser ? 'text-right' : ''}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────

function Sidebar({
  sessions, activeSessionId, onSelectSession, onNewChat,
  collapsed, setCollapsed, deletingSessionId, onDeleteSession,
  userRole, user, userDp,
}) {
  const isPatient = userRole === 'patient';
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // Group sessions by date
  const grouped = { Today: [], Yesterday: [], Older: [] };
  const now = new Date();
  sessions.forEach(s => {
    const d = new Date(s.lastUpdated || s.createdAt);
    const diff = now - d;
    if (diff < 86400000) grouped.Today.push(s);
    else if (diff < 172800000) grouped.Yesterday.push(s);
    else grouped.Older.push(s);
  });

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className="h-full flex flex-col flex-shrink-0 transition-all duration-300 relative"
        style={{
          width: collapsed ? 0 : 260,
          minWidth: collapsed ? 0 : 260,
          background: '#0b1021',
          borderRight: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>

        <div style={{ width: 260, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
                <Stethoscope size={15} color="white" />
              </div>
              <span className="font-bold text-sm text-white tracking-tight">MedAssist <span className="text-blue-400">AI</span></span>
            </div>
            <button onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-colors">
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Chat button */}
          <div className="px-3 pb-3 flex-shrink-0">
            <button
              id="new-chat-btn"
              onClick={onNewChat}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)', boxShadow: '0 2px 12px rgba(79,142,247,0.25)' }}>
              <MessageSquarePlus size={16} />
              New Chat
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-gray-600 text-center px-4 py-8 leading-relaxed">
                No chats yet.<br />Start a new conversation.
              </p>
            )}

            {Object.entries(grouped).map(([label, items]) => (
              <Fragment key={label}>
                {items.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 pt-4 pb-1">{label}</p>
                    {items.map((s, idx) => (
                      <SessionItem
                        key={s.session_id || `${label}-${idx}`}
                        session={s}
                        isActive={s.session_id === activeSessionId}
                        onSelect={() => onSelectSession(s.session_id)}
                        onDelete={() => onDeleteSession(s.session_id)}
                        isDeleting={deletingSessionId === s.session_id}
                      />
                    ))}
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          {/* Bottom user info */}
          <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group cursor-pointer">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
                {userDp ? <img src={userDp} alt="" className="w-full h-full object-cover" /> : displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{displayName}</p>
                <p className={`text-[10px] font-medium ${isPatient ? 'text-emerald-500' : 'text-purple-400'}`}>
                  {isPatient ? 'Patient' : 'Med Student'}
                </p>
              </div>
              <LayoutDashboard size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

function SessionItem({ session, isActive, onSelect, onDelete, isDeleting }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function clickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${isActive
        ? 'bg-white/[0.08] text-white'
        : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
        }`}
      onClick={onSelect}
      id={`session-${session.session_id}`}>

      <p className="flex-1 text-xs truncate font-medium leading-snug">{session.session_title}</p>

      {/* Options button */}
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          className={`p-1 rounded-md transition-colors ${showMenu ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100'}`}>
          <MoreHorizontal size={13} className="text-gray-400" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-7 w-32 rounded-xl border border-white/[0.08] shadow-2xl z-50 overflow-hidden"
            style={{ background: '#141e30' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
              disabled={isDeleting}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={12} />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
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

  // Session state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // Message state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // ── Load sessions ──
  useEffect(() => {
    if (user && !sessionsLoaded) loadSessions();
  }, [user]);

  // ── Auto scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/chat?user_Id=${user.uid}`);
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch { /* silent */ }
    finally { setSessionsLoaded(true); }
  };

  const loadSession = async (sessionId) => {
    setMessagesLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/chat?user_Id=${user.uid}&session_id=${sessionId}`);
      const data = await res.json();
      if (data.chats?.length > 0) {
        const restored = data.chats.flatMap((chat) => [
          { id: `${chat._id}-user`, role: 'user', content: chat.user_message, timestamp: chat.createdAt },
          { id: `${chat._id}-ai`, role: 'assistant', content: chat.ai_response, timestamp: chat.createdAt },
        ]);
        setMessages(restored);
      }
    } catch { /* silent */ }
    finally { setMessagesLoading(false); }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    loadSession(sessionId);
    setMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    const newId = genSessionId();
    setActiveSessionId(newId);
    setMessages([]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMobileSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId) => {
    setDeletingSessionId(sessionId);
    try {
      await fetch(`/api/chat?user_Id=${user.uid}&session_id=${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch { /* silent */ }
    finally { setDeletingSessionId(null); }
  };

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !user) return;
    if (!userRole) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: '⚠️ Your role could not be loaded. Please sign out and sign back in.',
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    // Ensure we have an active session
    const currentSessionId = activeSessionId || genSessionId();
    if (!activeSessionId) setActiveSessionId(currentSessionId);

    const userMsg = {
      id: `user-${Date.now()}`, role: 'user',
      content: input.trim(), timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_Id: user.uid,
          message: currentInput,
          role: userRole,
          session_id: currentSessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`, role: 'assistant',
        content: data.message, timestamp: new Date().toISOString(),
      }]);

      // Upsert session in sidebar
      const sessionTitle = currentInput.length > 50 ? currentInput.slice(0, 48) + '…' : currentInput;
      setSessions(prev => {
        const exists = prev.find(s => s.session_id === currentSessionId);
        if (exists) {
          return prev.map(s => s.session_id === currentSessionId
            ? { ...s, lastUpdated: new Date().toISOString() }
            : s
          );
        }
        return [
          { session_id: currentSessionId, session_title: sessionTitle, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() },
          ...prev,
        ];
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: `⚠️ ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, user, userRole, activeSessionId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyToClipboard = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Loading screen ──
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
  const isEmpty = messages.length === 0 && !isLoading && !messagesLoading;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#090e1a' }}>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar (desktop) ── */}
      <div className="hidden md:flex h-full">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          deletingSessionId={deletingSessionId}
          onDeleteSession={handleDeleteSession}
          userRole={userRole}
          user={user}
          userDp={userDp}
        />
      </div>

      {/* ── Sidebar (mobile) ── */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          collapsed={false}
          setCollapsed={() => setMobileSidebarOpen(false)}
          deletingSessionId={deletingSessionId}
          onDeleteSession={handleDeleteSession}
          userRole={userRole}
          user={user}
          userDp={userDp}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/[0.06]"
          style={{ background: 'rgba(9,14,26,0.95)', backdropFilter: 'blur(20px)' }}>

          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
              <Menu size={18} />
            </button>

            {/* Desktop sidebar toggle (when collapsed) */}
            {sidebarCollapsed && (
              <button onClick={() => setSidebarCollapsed(false)}
                className="hidden md:flex p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                <ChevronRight size={18} />
              </button>
            )}

            {/* Title area */}
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                {activeSessionId
                  ? (sessions.find(s => s.session_id === activeSessionId)?.session_title || 'New Chat')
                  : 'MedAssist AI'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-gray-500">Online · {isPatient ? 'Patient Mode' : 'Clinical Mode'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${isPatient
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-purple-500/10 border-purple-500/25 text-purple-400'
              }`}>
              {isPatient ? <User size={11} /> : <GraduationCap size={11} />}
              {isPatient ? 'Patient' : 'Clinical'}
            </div>

            {/* New Chat shortcut in header */}
            <button
              id="header-new-chat-btn"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-500/25 bg-blue-500/[0.07] text-blue-400 hover:bg-blue-500/15 transition-all duration-200">
              <MessageSquarePlus size={13} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* ── Messages Area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">

            {/* Loading session messages */}
            {messagesLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
              </div>
            )}

            {/* Welcome / Empty state */}
            {isEmpty && !messagesLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center"
                style={{ animation: 'fadeIn 0.4s ease forwards' }}>
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}>
                  <Sparkles size={28} color="#4f8ef7" style={{ opacity: 0.75 }} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">How can I help you today?</h2>
                <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
                  {isPatient
                    ? 'Ask anything about your health in simple, clear language.'
                    : 'Ask complex clinical questions and get detailed, evidence-based answers.'}
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                  {suggestions.map((s) => (
                    <button key={s} id={`suggestion-${s.slice(0, 12).replace(/\s/g, '-')}`}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-xs px-4 py-2.5 rounded-full border border-blue-500/20 bg-blue-500/[0.07] text-blue-300 hover:bg-blue-500/15 hover:-translate-y-0.5 transition-all duration-200">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {!messagesLoading && messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} onCopy={copyToClipboard} copiedId={copiedId} userDp={userDp} />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input Bar ── */}
        <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-white/[0.06]"
          style={{ background: 'rgba(9,14,26,0.98)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 px-4 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] focus-within:border-blue-500/40 focus-within:bg-blue-500/[0.02] transition-all duration-200">
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
                className="flex-1 bg-transparent border-none outline-none resize-none text-base sm:text-sm text-gray-200 placeholder-gray-600 leading-relaxed min-h-[44px]"
                style={{ maxHeight: 130, fontFamily: 'inherit', paddingTop: 12, paddingBottom: 12 }}
              />

              <button
                id="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg,#4f8ef7,#6366f1)'
                    : 'rgba(255,255,255,0.05)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() && !isLoading ? '0 2px 12px rgba(79,142,247,0.3)' : 'none',
                }}>
                <Send size={15} color={input.trim() && !isLoading ? 'white' : '#374151'} />
              </button>
            </div>

            <p className="text-[10px] text-center mt-2.5 text-gray-700">
              Enter to send · Shift+Enter for new line · Chats auto-delete after 3 days
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}