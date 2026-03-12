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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column: Branding & Value Prop */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] bg-[#f8faff] p-12 xl:p-20 border-r border-gray-100">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-16">
            <img src="/logo.svg" alt="Converso Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-brand-100" />
            <span className="text-2xl font-black text-gray-900 tracking-tight">Converso</span>
          </Link>

          <div className="space-y-10">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-gray-900 leading-[1.1]">
              Manage your leads <span className="text-brand-600">with ease.</span>
            </h1>
            
            <div className="space-y-6">
              <FeatureItem title="Smart Dashboards" desc="Track every interaction and sentiment shift in real-time." />
              <FeatureItem title="Instant Notifications" desc="Never miss a lead response with automated alerts." />
              <FeatureItem title="Team Collaboration" desc="Assign leads and manage schedules across your entire team." />
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400 font-medium">
          © 2026 Converso Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-32">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-end mb-12">
            <p className="text-sm text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link href="/register" className="text-brand-600 font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mb-10 lg:hidden">
             <div className="flex items-center gap-2 mb-6">
              <img src="/logo.svg" alt="Converso Logo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold">Converso</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Sign in to Converso</h2>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
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
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {showForgotMsg && (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-xs font-medium leading-relaxed">
                Contact your administrator to reset your password.
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

          <div className="mt-10 pt-10 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center font-medium italic">
              "Finally, a CRM that doesn't feel like a chore to use every day."
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
        <CheckCircle2 size={20} className="text-brand-500" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
