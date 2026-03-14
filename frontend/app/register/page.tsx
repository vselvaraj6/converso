'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/api'
import { MessageSquare, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

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
      await register(form)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
              The only platform you need to <span className="text-brand-600">nurture leads.</span>
            </h1>
            
            <div className="space-y-6">
              <FeatureItem title="Automated SMS Outreach" desc="AI-powered follow-ups that sound human and book meetings 24/7." />
              <FeatureItem title="Industry-Specific Memory" desc="Curate your AI with your own lingo and company knowledge." />
              <FeatureItem title="Cal.com Integration" desc="Sync your calendar and let the AI handle the scheduling back-and-forth." />
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400 font-medium">
          © 2026 Converso Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column: Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-32">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-end mb-12">
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mb-10 lg:hidden">
             <div className="flex items-center gap-2 mb-6">
              <img src="/logo.svg" alt="Converso Logo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold">Converso</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Start your free trial</h2>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Get started for free</h2>
            <p className="text-gray-500 font-medium">Join 1,000+ sales teams using Converso.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 animate-shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <input
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  placeholder="Company Name"
                  value={form.company_name}
                  onChange={set('company_name')}
                  required
                />
                <div className="relative">
                  <select
                    className="input py-3.5 pl-4 pr-10 bg-gray-50 border-gray-200 focus:bg-white font-bold appearance-none cursor-pointer"
                    value={form.industry}
                    onChange={set('industry')}
                    required
                  >
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <input
                  type="email"
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  className="input py-3.5 px-4 bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  placeholder="Password (min 8 chars)"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="py-2 text-[11px] text-gray-400 leading-relaxed font-medium">
              By clicking "Create Account", you agree to Converso's <span className="text-brand-600 underline cursor-pointer">Terms of Service</span> and <span className="text-brand-600 underline cursor-pointer">Privacy Policy</span>.
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-4 text-base shadow-xl shadow-brand-100 font-bold tracking-tight transition-all active:scale-[0.99]" 
              disabled={loading}
            >
              {loading ? 'Setting up your workspace…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center font-medium italic">
              "The most intuitive lead engagement platform I've ever used."
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
        <CheckCircle2 size={20} className="text-green-500" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
