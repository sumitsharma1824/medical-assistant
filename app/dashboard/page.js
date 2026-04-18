'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Stethoscope,
  MessageSquarePlus,
  Clock,
  ChevronRight,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
  Activity,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  MessageCircle,
  X,
  Camera,
  Edit2,
  Mail
} from 'lucide-react';

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavBar({ user, userRole, userDp, setDrawerOpen }) {
  const isPatient = userRole === 'patient';
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#090e1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
            <Stethoscope size={18} color="white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">MedAssist <span className="text-blue-400">AI</span></span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Role pill */}
          <div className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border ${isPatient
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
            }`}>
            {isPatient ? <User size={12} /> : <GraduationCap size={12} />}
            {isPatient ? 'Patient' : 'Med Student'}
          </div>

          {/* Avatar to open drawer */}
          <button onClick={() => setDrawerOpen(true)} className="flex items-center justify-center rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.03] hover:border-blue-500/50 transition-all focus:outline-none" style={{width: 36, height: 36}}>
            {userDp ? (
               <img src={userDp} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-blue-600"
               style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
                 {displayName[0]?.toUpperCase()}
               </div>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

function ProfileDrawer({ open, onClose, user, userRole, userDp, updateData, onLogout }) {
  const [name, setName] = useState(user?.displayName || user?.email?.split('@')[0] || '');
  const [role, setRole] = useState(userRole || 'patient');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    setName(user?.displayName || user?.email?.split('@')[0] || '');
    setRole(userRole);
  }, [user, userRole, open]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Compress image to a max width/height of 150px to keep Base64 size ultra-small
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to base64, with ultra-low jpeg quality to avoid Firebase limit
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);

        try {
          await updateData(undefined, compressedBase64, undefined);
        } catch (err) {
          console.error(err);
        } finally {
          setSaving(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
       await updateData(name, undefined, role);
       onClose();
    } catch(err) {
       console.error(err);
    } finally {
       setSaving(false);
    }
  };

  const isPatient = role === 'patient';
  const initial = name[0]?.toUpperCase() || 'U';

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm border-l border-white/[0.08] shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col`} style={{ background: '#0b1021', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group w-24 h-24 rounded-full overflow-hidden border border-white/[0.1]">
              {userDp ? (
                <img src={userDp} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-blue-600" style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
                  {initial}
                </div>
              )}
              {/* Overlay inside avatar on hover */}
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                 <Camera size={20} />
                 <span className="text-[10px] mt-1 font-semibold">Change</span>
                 <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={saving} />
              </label>
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1"><Mail size={12} /> Email (Read-Only)</span>
              <p className="text-sm font-medium text-gray-300 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] w-full" />

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Your Name" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'patient', label: 'Patient', Icon: User, activeColor: '#10b981', activeBg: 'rgba(16,185,129,0.08)', activeBorder: 'rgba(16,185,129,0.4)' },
                  { key: 'student', label: 'Med Student', Icon: GraduationCap, activeColor: '#8b5cf6', activeBg: 'rgba(139,92,246,0.08)', activeBorder: 'rgba(139,92,246,0.4)' },
                ].map(({ key, label, Icon, activeColor, activeBg, activeBorder }) => (
                  <button key={key} type="button" onClick={() => setRole(key)}
                    className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200"
                    style={{
                      borderColor: role === key ? activeBorder : 'rgba(255,255,255,0.07)',
                      background: role === key ? activeBg : 'rgba(255,255,255,0.03)',
                    }}>
                    <Icon size={16} color={role === key ? activeColor : '#4b5563'} />
                    <span className="text-xs font-semibold" style={{ color: role === key ? activeColor : '#6b7280' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || (!name.trim())} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white mt-4 transition-all hover:opacity-90 disabled:opacity-50"
             style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)' }}>
               {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Footer with logout */}
        <div className="p-6 border-t border-white/[0.06] bg-black/20">
           <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 font-medium">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 cursor-default">
      {/* Glow bg */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent} bg-opacity-10`}
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-2">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function ChatCard({ chat, idx }) {
  const timeStr = new Date(chat.createdAt).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return (
    <Link href="/chat" id={`chat-item-${idx}`}>
      <div className="group flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-200 cursor-pointer">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: 'linear-gradient(135deg,rgba(79,142,247,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(79,142,247,0.2)' }}>
          <MessageCircle size={16} color="#4f8ef7" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate mb-2">{chat.user_message}</p>
          <p className="text-xs text-gray-500 truncate leading-relaxed">{chat.ai_response}</p>
        </div>

        {/* Time + arrow */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-[10px] text-gray-600 whitespace-nowrap">{timeStr}</span>
          <ArrowUpRight size={14} className="text-gray-700 group-hover:text-blue-400 transition-colors duration-200" />
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, userRole, userDp, loading, logout, updateProfileData } = useAuth();
  const router = useRouter();
  const [recentChats, setRecentChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchRecentChats();
  }, [user]);

  const fetchRecentChats = async () => {
    try {
      const res = await fetch(`/api/chat?user_Id=${user.uid}`);
      const data = await res.json();
      setRecentChats(data.chats || []);
    } catch { /* fail silently */ }
    finally { setChatsLoading(false); }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#090e1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const isPatient = userRole === 'patient';
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      icon: <BarChart3 size={18} color="#4f8ef7" />,
      label: 'Total Conversations',
      value: recentChats.length.toString(),
      accent: 'bg-blue-500',
    },
    {
      icon: isPatient
        ? <Activity size={18} color="#10b981" />
        : <GraduationCap size={18} color="#8b5cf6" />,
      label: 'Active Mode',
      value: isPatient ? 'Patient' : 'Clinical',
      accent: isPatient ? 'bg-emerald-500' : 'bg-purple-500',
    },
    {
      icon: <ShieldCheck size={18} color="#f59e0b" />,
      label: 'Data Retention',
      value: '3 Days',
      accent: 'bg-amber-500',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#090e1a' }}>
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      </div>

      <NavBar user={user} userRole={userRole} userDp={userDp} setDrawerOpen={setDrawerOpen} />
      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} userRole={userRole} userDp={userDp} updateData={updateProfileData} onLogout={handleLogout} />

      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-14">

        {/* ── Hero Welcome ── */}
        <div className={`mb-10 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-3xl border border-white/[0.08] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.07) 0%, rgba(139,92,246,0.07) 50%, rgba(16,185,129,0.05) 100%)' }}>
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-3">{greeting} 👋</p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                    Welcome back,{' '}
                    <span style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {displayName}
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed mb-8">
                    {isPatient
                      ? 'Get clear, simple answers to all your health questions. Your AI medical companion is ready.'
                      : 'Access in-depth clinical insights, pathophysiology, and evidence-based guidance at any time.'}
                  </p>

                  {/* CTA */}
                  <div className="flex flex-wrap gap-4">
                    <Link href="/chat" id="open-chat-btn">
                      <button className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)', boxShadow: '0 4px 20px rgba(79,142,247,0.3)' }}>
                        <MessageSquarePlus size={17} />
                        Open MedAssist AI
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Mode Badge — desktop */}
                <div className={`flex flex-col items-center justify-center rounded-2xl px-8 py-6 text-center flex-shrink-0 border ${isPatient
                  ? 'bg-emerald-500/[0.07] border-emerald-500/20'
                  : 'bg-purple-500/[0.07] border-purple-500/20'
                  }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isPatient ? 'bg-emerald-500/15' : 'bg-purple-500/15'
                    }`}>
                    {isPatient
                      ? <User size={24} color="#10b981" />
                      : <GraduationCap size={24} color="#8b5cf6" />}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Current Mode</p>
                  <p className={`text-base font-bold ${isPatient ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {isPatient ? 'Patient' : 'Med Student'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(79,142,247,0.3) 50%, transparent 100%)' }} />
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10 transition-all duration-500 delay-75 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* ── Recent Conversations ── */}
        <div className={`transition-all duration-500 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-gray-500" />
              <h2 className="text-base font-semibold text-gray-300">Recent Conversations</h2>
            </div>
            {recentChats.length > 0 && (
              <Link href="/chat">
                <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors duration-150">
                  View all <ChevronRight size={14} />
                </button>
              </Link>
            )}
          </div>

          {chatsLoading ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
            </div>
          ) : recentChats.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}>
                <Sparkles size={28} color="#4f8ef7" style={{ opacity: 0.6 }} />
              </div>
              <p className="text-sm font-semibold text-gray-300 mb-2">No conversations yet</p>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed mb-6">
                Start your first AI-powered conversation to get personalized medical guidance.
              </p>
              <Link href="/chat" className="inline-block">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white mx-auto"
                  style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)' }}>
                  <MessageSquarePlus size={15} />
                  Start chatting
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentChats.slice(0, 6).map((chat, idx) => (
                <ChatCard key={chat._id} chat={chat} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}