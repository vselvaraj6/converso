'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/api'
import { AlertCircle, Command, Zap, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    company_name: '',
    industry: 'Mortgage'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-brand-500/30" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Left Column: Visionary Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-16 xl:p-24 relative overflow-hidden border-r border-[var(--divider)]" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[100px] rounded-full" />
        </div>
        
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600" 
          alt="Modern Architecture" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-24 group">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all group-hover:scale-110">
              <Command size={24} className="text-white" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Converso</span>
          </Link>

          <div className="space-y-10 max-w-lg">
            <h1 className="text-5xl xl:text-6xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
              Your AI sales agent,<br/>
              <span className="text-brand-400">ready in minutes.</span>
            </h1>

            <div className="space-y-8">
              <FeatureItem icon={Zap} title="Up and Running Fast" desc="Add leads and start outreach in under 60 seconds." />
              <FeatureItem icon={ShieldCheck} title="Your Data, Secure" desc="Each account is fully isolated and protected." />
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Converso · Trusted by sales teams</p>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-8 sm:px-16 lg:px-24 xl:px-40" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Create your account</h2>
            <p className="text-slate-500 font-medium text-sm">Get started — it only takes a moment.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-5 py-4 text-xs font-black flex items-center gap-3">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-text">Full Name</label>
                <input className="input" placeholder="Elon" value={form.name} onChange={set('name')} required />
              </div>
              <div className="space-y-2">
                <label className="label-text">Email Address</label>
                <input type="email" className="input" placeholder="elon@x.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="space-y-2">
                <label className="label-text">Company Name</label>
                <input className="input" placeholder="X Corp" value={form.company_name} onChange={set('company_name')} required />
              </div>
              <div className="space-y-2">
                <label className="label-text">Industry</label>
                <select className="input appearance-none font-black text-[11px] uppercase tracking-widest" value={form.industry} onChange={set('industry')}>
                  <option value="Mortgage">Mortgage</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Solar">Solar</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="label-text">Password</label>
                <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={set('password')} required />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-4 text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20 active:scale-[0.98] mt-4" 
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium">
            Already registered?{' '}
            <Link href="/login" className="text-brand-400 font-black hover:text-brand-300 transition-colors ml-1 uppercase tracking-widest">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="mt-1">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-400">
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
