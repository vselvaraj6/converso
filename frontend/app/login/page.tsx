'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/api'
import { MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      {/* Left Column: Branding & Image */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0c4a6e] p-12 xl:p-20 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <img 
          src="https://images.unsplash.com/photo-1557426272-fc759fbb7a8d?auto=format&fit=crop&q=80&w=1600" 
          alt="Professional Sales Team" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 to-indigo-900/80 z-0" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-20 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <img src="/logo.svg" alt="C" className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Converso</span>
          </Link>

          <div className="space-y-8 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Reclaim your time. <br/>
              <span className="text-brand-300">Automate your sales.</span>
            </h1>
            
            <div className="space-y-6">
              <FeatureItem title="High-Conversion SMS" desc="Our AI engages leads instantly, turning interest into appointments." />
              <FeatureItem title="Smart Calendar Sync" desc="Automated booking flows that keep your schedule full without the lifting." />
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="card bg-white/10 backdrop-blur-md border-white/20 p-6 rounded-2xl">
            <p className="text-lg text-white font-medium italic leading-relaxed">
              "Converso acts like my most efficient sales assistant. It's consistently booking 3-4 more meetings a week for me."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-400" />
              <div>
                <p className="text-sm font-bold text-white">James Sterling</p>
                <p className="text-xs text-brand-200">Director of Sales, Texa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-32 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-end mb-16">
            <p className="text-sm text-gray-500 font-medium">
              New here?{' '}
              <Link href="/register" className="text-brand-600 font-bold hover:underline ml-1">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <img src="/logo.svg" alt="C" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-tight">Converso</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 font-medium">Please sign in to your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-bold"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotMsg(true)}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-tight"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-bold"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {showForgotMsg && (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-top-2">
                Please contact your administrator to reset your password.
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full py-4 text-base shadow-xl shadow-brand-100 font-bold tracking-tight transition-all active:scale-[0.99] mt-2" 
              disabled={loading}
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Secured by Converso Enterprise Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1">
        <CheckCircle2 size={20} className="text-brand-300" />
      </div>
      <div>
        <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
        <p className="text-sm text-brand-100/70 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
