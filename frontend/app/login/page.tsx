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
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-4 shadow-lg shadow-brand-200">
              <MessageSquare size={24} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your Converso account to manage your leads.</p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left">Email Address</label>
                <input
                  type="email"
                  className="input py-3"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider text-left">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotMsg(true)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  className="input py-3"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {showForgotMsg && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
                  Please contact your workspace administrator to reset your password.
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-100 mt-2" 
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/register" className="text-brand-600 font-bold hover:underline">
                  Create one for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Image */}
      <div className="hidden lg:block relative flex-1 w-0">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1557426272-fc759fbb7a8d?auto=format&fit=crop&q=80&w=1600"
          alt="Team working on leads"
        />
        <div className="absolute inset-0 bg-brand-900/20 mix-blend-multiply" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <blockquote className="text-2xl font-medium italic">
            "Converso has completely transformed how we follow up with leads. The AI responses are indistinguishable from my best sales reps."
          </blockquote>
          <p className="mt-4 font-bold">— Alex Rivers, CEO at Hawkly</p>
        </div>
      </div>
    </div>
  )
}
