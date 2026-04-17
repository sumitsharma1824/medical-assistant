'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Stethoscope, GraduationCap, AlertCircle, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [role, setRole] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!role) return setError('Please select your role to continue.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await signup(email, password, role);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!role) return setError('Please select your role before signing in with Google.');
    setLoading(true); setError('');
    try {
      await loginWithGoogle(role);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#090e1a' }}>
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[450px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, rgba(79,142,247,0.12) 0%, rgba(139,92,246,0.1) 60%, rgba(16,185,129,0.06) 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
              <Stethoscope size={20} color="white" />
            </div>
            <span className="font-bold text-white text-lg">MedAssist <span className="text-blue-400">AI</span></span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-5 leading-tight">
            Your intelligent<br />medical companion
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Get personalized medical guidance tailored to your role — whether you're a patient or a medical student.
          </p>
        </div>

        <div className="relative space-y-5">
          {[
            { color: '#10b981', label: 'Simple explanations for patients' },
            { color: '#8b5cf6', label: 'Clinical depth for medical students' },
            { color: '#4f8ef7', label: 'Chat history auto-deleted after 3 days' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
              </div>
              <p className="text-sm text-gray-400">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md" style={{ animation: 'fadeInUp 0.35s ease forwards' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)' }}>
              <Stethoscope size={18} color="white" />
            </div>
            <span className="font-bold text-white">MedAssist AI</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">Start your AI-powered medical journey today.</p>

          {/* Role selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              I am a <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'patient', label: 'Patient', sub: 'Simple explanations', Icon: User, activeColor: '#10b981', activeBg: 'rgba(16,185,129,0.08)', activeBorder: 'rgba(16,185,129,0.4)' },
                { key: 'student', label: 'Med Student', sub: 'Clinical insights', Icon: GraduationCap, activeColor: '#8b5cf6', activeBg: 'rgba(139,92,246,0.08)', activeBorder: 'rgba(139,92,246,0.4)' },
              ].map(({ key, label, sub, Icon, activeColor, activeBg, activeBorder }) => (
                <button key={key} id={`role-${key}`} type="button" onClick={() => setRole(key)}
                  className="flex flex-col items-center gap-3 py-5 px-4 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor: role === key ? activeBorder : 'rgba(255,255,255,0.07)',
                    background: role === key ? activeBg : 'rgba(255,255,255,0.03)',
                  }}>
                  <Icon size={24} color={role === key ? activeColor : '#4b5563'} />
                  <div>
                    <span className="block text-sm font-semibold mb-0.5" style={{ color: role === key ? activeColor : '#6b7280' }}>{label}</span>
                    <span className="block text-[10px] text-center text-gray-600">{sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input id="signup-email" type="email" className="input-field pl-10 text-sm py-3" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input id="signup-password" type={showPwd ? 'text' : 'password'} className="input-field pl-10 pr-10 text-sm py-3"
                  placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input id="signup-confirm-password" type={showPwd ? 'text' : 'password'} className="input-field pl-10 text-sm py-3"
                  placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button id="signup-submit" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{ background: 'linear-gradient(135deg,#4f8ef7,#6366f1)', boxShadow: '0 4px 20px rgba(79,142,247,0.25)' }}>
              {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-gray-700">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <button id="signup-google" onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium text-gray-300 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-gray-600 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}