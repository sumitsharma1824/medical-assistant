'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, MessageSquarePlus, Shield, Zap, ChevronRight, Activity, BookOpen } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen auth-bg">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-8 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
            <Stethoscope size={20} color="white" />
          </div>
          <span className="font-bold text-lg gradient-text">MedAssist AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button id="nav-login" className="text-sm px-5 py-2.5 rounded-lg font-medium transition-all"
              style={{ color: 'var(--muted-text)' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'var(--muted-text)'}>
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button id="nav-signup" className="text-sm px-6 py-2.5 rounded-lg font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)', color: 'white' }}>
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-28 pb-20 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm mb-10"
          style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', color: '#93c5fd' }}>
          <Zap size={14} fill="#93c5fd" />
          AI-Powered Medical Assistant
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8" style={{ letterSpacing: '-0.02em' }}>
          Medical guidance{' '}
          <span className="gradient-text">tailored for you</span>
        </h1>

        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-12" style={{ color: 'var(--muted-text)', lineHeight: 1.7 }}>
          Whether you're a patient seeking simple health answers or a medical student needing clinical depth —
          MedAssist AI adapts its expertise to your role.
        </p>

        <div className="flex items-center justify-center gap-5 flex-wrap">
          <Link href="/signup" id="hero-cta">
            <button className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)', color: 'white', boxShadow: '0 8px 30px rgba(79,142,247,0.35)' }}>
              <MessageSquarePlus size={19} />
              Start for Free
              <ChevronRight size={17} />
            </button>
          </Link>
          <Link href="/login">
            <button className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-white/10"
              style={{ border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
              Sign In
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-28">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Activity size={26} color="#4f8ef7" />,
              color: 'rgba(79,142,247,0.08)',
              border: 'rgba(79,142,247,0.2)',
              title: 'Patient Mode',
              desc: 'Clear, jargon-free explanations for symptoms, treatments, and medications. Understand your health easily.'
            },
            {
              icon: <BookOpen size={26} color="#8b5cf6" />,
              color: 'rgba(139,92,246,0.08)',
              border: 'rgba(139,92,246,0.2)',
              title: 'Clinical Mode',
              desc: 'Detailed pathophysiology, drug interactions, differential diagnoses, and evidence-based clinical insights.'
            },
            {
              icon: <Shield size={26} color="#10b981" />,
              color: 'rgba(16,185,129,0.08)',
              border: 'rgba(16,185,129,0.2)',
              title: 'Private & Secure',
              desc: 'Conversations auto-delete after 3 days. Firebase Auth keeps your account protected at all times.'
            },
          ].map((f, i) => (
            <div key={i} className="glass p-8 animate-fade-in-up"
              style={{ background: f.color, border: `1px solid ${f.border}`, animationDelay: `${i * 0.1}s` }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: f.color, border: `1px solid ${f.border}` }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-xl mb-3">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-text)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}