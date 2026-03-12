'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/api'
import { MessageSquare, AlertCircle, ChevronDown } from 'lucide-react'

const INDUSTRIES = ["Mortgage", "Real Estate", "Insurance", "SaaS / Software", "Solar Energy"]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '', industry: 'Mortgage' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.company_name, form.industry)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-4 shadow-lg shadow-brand-200">
              <MessageSquare size={24} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-gray-500 mt-2 font-medium text-sm">Join Converso and start automating your lead nurturing today.</p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left">Your Full Name</label>
                <input
                  className="input py-2.5 font-bold"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left">Company Name</label>
                  <input
                    className="input py-2.5 font-bold"
                    placeholder="Acme Corp"
                    value={form.company_name}
                    onChange={set('company_name')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left">Industry</label>
                  <div className="relative">
                    <select
                      className="input py-2.5 font-bold pr-10 appearance-none"
                      value={form.industry}
                      onChange={set('industry')}
                      required
                    >
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left">Email Address</label>
                <input
                  type="email"
                  className="input py-2.5 font-bold"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left">Password</label>
                <input
                  type="password"
                  className="input py-2.5 font-bold"
                  placeholder="min 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-100 mt-4 font-bold" 
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 font-medium">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-600 font-bold hover:underline">
                  Sign in instead
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
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1600"
          alt="Office productivity"
        />
        <div className="absolute inset-0 bg-brand-900/20 mix-blend-multiply" />
        <div className="absolute top-12 left-12 right-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">Scale your sales without scaling your team.</h2>
            <p className="mt-6 text-lg text-brand-100 font-medium">
              Converso handles the first 48 hours of lead contact, qualifying prospects while you sleep.
            </p>
            
            <div className="mt-12 flex gap-8">
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-brand-200 font-bold">Automated Follow-up</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">3x</p>
                <p className="text-sm text-brand-200 font-bold">Higher Conversion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
