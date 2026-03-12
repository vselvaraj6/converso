'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/api'
import { MessageSquare, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4 shadow-lg shadow-brand-200">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Converso</h1>
          <p className="text-gray-500 mt-2 font-medium">Welcome back! Sign in to your account.</p>
        </div>

        <div className="card p-6 md:p-10 shadow-xl border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Email Address</label>
              <input
                type="email"
                className="input py-3 font-bold"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Password</label>
                <button 
                  type="button"
                  onClick={() => setShowForgotMsg(true)}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="input py-3 font-bold"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {showForgotMsg && (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-xs font-medium leading-relaxed">
                Contact your administrator to reset your password.
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full py-3.5 text-base shadow-lg shadow-brand-100 font-bold" 
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-brand-600 font-bold hover:underline">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
