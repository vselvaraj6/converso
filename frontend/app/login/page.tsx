'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/api'
import { MessageSquare, AlertCircle, CheckCircle2, Command, ShieldCheck, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotMsg, setShowForgotMsg] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-brand-500/30" style={{ backgroundColor: 'var(--background)' }}>
      {/* Left Column: Visionary Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-16 xl:p-24 relative overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
        {/* Background Mesh Gradient */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[100px] rounded-full" />
        </div>
        
        <img 
          src="https://images.unsplash.com/photo-1557426272-fc759fbb7a8d?auto=format&fit=crop&q=80&w=1600" 
          alt="Professional Hub" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay grayscale"
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-24 group">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all group-hover:scale-110 group-hover:rotate-3">
              <Command size={24} className="text-white" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Converso</span>
          </Link>

          <div className="space-y-10 max-w-lg">
            <h1 className="text-5xl xl:text-6xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
              Close more deals<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-400">with AI on your team.</span>
            </h1>

            <div className="space-y-8">
              <FeatureItem icon={Zap} title="Instant Outreach" desc="Reach leads automatically with smart, personalized messages." />
              <FeatureItem icon={ShieldCheck} title="Built for Teams" desc="Manage your pipeline and track every conversation in one place." />
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="card bg-white/5 backdrop-blur-2xl border-white/10 p-8 rounded-[32px] shadow-2xl">
            <p className="text-xl text-slate-200 font-medium italic leading-relaxed">
              "The most intuitive command center I've used. Our conversion rate increased by 40% in the first month."
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-lg" />
              <div>
                <p className="text-sm font-black text-white uppercase tracking-widest">James Sterling</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Director of Revenue, Texa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Secure Authentication */}
      <div className="flex-1 flex flex-col justify-center py-12 px-8 sm:px-16 lg:px-24 xl:px-40 relative" style={{ backgroundColor: 'var(--background)' }}>
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Command size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Converso</span>
        </div>

        <div className="max-w-md w-full mx-auto space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Welcome back</h2>
            <p className="text-slate-500 font-medium text-sm">Sign in to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-5 py-4 text-xs font-black flex items-center gap-3 animate-in shake duration-500">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label-text">Email</label>
                <input
                  type="email"
                  className="input py-4 focus:border-brand-500"
                  placeholder="agent@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="label-text">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotMsg(true)}
                    className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-widest transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  className="input py-4 focus:border-brand-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {showForgotMsg && (
              <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-2xl px-5 py-4 text-[11px] font-bold leading-relaxed animate-in slide-in-from-top-2 duration-300">
                Please contact your account admin to reset your password.
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full py-4 text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20 active:scale-[0.98] transition-all" 
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="flex flex-col items-center gap-6">
            <p className="text-xs text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link href="/register" className="text-brand-400 font-black hover:text-brand-300 transition-colors ml-1 uppercase tracking-widest">
                Sign up
              </Link>
            </p>
            <div className="flex items-center gap-3 opacity-30">
              <div className="h-px w-8 bg-slate-700" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Converso</p>
              <div className="h-px w-8 bg-slate-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="mt-1">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all duration-500">
          <Icon size={20} />
        </div>
      </div>
      <div>
        <h3 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-[13px] text-slate-400 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
