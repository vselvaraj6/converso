'use client'
import { useState, useEffect } from 'react'
import { getStoredUser, getCompany, updateCompany, getIndustryTemplates, updateMe, connectCalendar, type Company, type User } from '@/lib/api'
import { Key, Phone, Bot, User as UserIcon, Building2, Brain, MessageCircle, Sparkles, Calendar, CheckCircle2, X, AlertCircle, ShieldCheck, Globe, Link as LinkIcon, Settings2, Users, Mail, Command, Activity, Zap } from 'lucide-react'
import clsx from 'clsx'

function Section({ title, icon: Icon, children, description }: {
  title: string; icon: React.ElementType; children: React.ReactNode; description?: string
}) {
  return (
    <div className="card p-8 border-none shadow-2xl font-sans relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600 blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity" />
      <div className="flex items-start gap-5 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner text-brand-400 group-hover:scale-110 duration-500" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--divider)' }}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-black text-[var(--text-primary)] text-lg uppercase tracking-widest">{title}</h2>
          {description && <p className="text-[10px] text-slate-500 mt-1 font-black uppercase tracking-[0.2em]">{description}</p>}
        </div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [templates, setTemplates] = useState<Record<string, { industry_lingo: string; company_memory: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [manualCalUrl, setManualCalUrl] = useState('')

  useEffect(() => {
    const stored = getStoredUser()
    setUser(stored)
    setManualCalUrl(stored?.manual_calendar_url || '')
    
    Promise.all([getCompany(), getIndustryTemplates()])
      .then(([c, t]) => {
        setCompany(c)
        setTemplates(t)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return
    setSaving(true)
    try {
      if (user?.role === 'admin' || user?.is_superuser) {
        await updateCompany(company)
      }
      const updated = await updateMe({ manual_calendar_url: manualCalUrl || null })
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateAI = (field: string, value: string) => {
    if (!company) return
    setCompany({
      ...company,
      ai_config: { ...company.ai_config, [field]: value }
    })
  }

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const industry = e.target.value
    if (!company) return
    
    let newConfig = { ...company.ai_config }
    if (templates[industry]) {
      newConfig.industry_lingo = templates[industry].industry_lingo
      newConfig.company_memory = templates[industry].company_memory
    }
    
    setCompany({
      ...company,
      industry,
      ai_config: newConfig
    })
  }

  if (loading) return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Loading settings…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 font-sans">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--divider)' }}>
          <Settings2 size={12} className="text-brand-400" />
          General Settings
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none">
          Account & Team
        </h1>
        <p className="text-slate-500 text-sm font-medium">Fine-tune your personal profile and company AI settings.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Account */}
        <Section title="Profile" icon={UserIcon} description="Your contact information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="label-text">Identity</span>
              <p className="text-sm font-black px-4 py-3 rounded-2xl border" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--divider)' }}>{user?.name}</p>
            </div>
            <div className="space-y-1">
              <span className="label-text">Registry</span>
              <p className="text-sm font-black px-4 py-3 rounded-2xl border truncate" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--divider)' }}>{user?.email}</p>
            </div>
            <div className="space-y-1">
              <span className="label-text">Clearance</span>
              <div className={clsx(
                "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                user?.role === 'admin' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                user?.role === 'write' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                "bg-slate-800 text-slate-400 border-white/5"
              )}>
                <ShieldCheck size={14} /> {user?.role} Access
              </div>
            </div>
          </div>
        </Section>

        {/* Master Team Link (Admin Only) */}
        {(user?.role === 'admin' || user?.is_superuser) && (
          <Section title="Team Hub" icon={Users} description="Team Scheduling Settings">
            <div className="space-y-4">
              <div className="p-6 rounded-3xl border border-brand-500/20 bg-brand-500/5">
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Set your Cal.com Team Link here. This link will be used for all agents unless they set their own in their profile.
                </p>

              </div>
              <div className="space-y-2">
                <label className="label-text text-brand-400">Team Booking Link</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input 
                    className="input pl-12 bg-[var(--input-bg)]" 
                    value={company?.cal_booking_url || ''} 
                    onChange={e => setCompany(c => c ? {...c, cal_booking_url: e.target.value} : null)}
                    placeholder="https://cal.com/team/corp/sales"
                  />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Personal Booking Link */}
        {(user?.role === 'admin' || user?.role === 'write' || user?.is_superuser) && (
          <Section title="Override" icon={LinkIcon} description="Direct Agent Booking Link">
            <div className="space-y-2">
              <label className="label-text">Personnel URL</label>
              <div className="relative group">
                <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-400 transition-colors" />
                <input 
                  className="input pl-12 bg-[var(--input-bg)]" 
                  value={manualCalUrl} 
                  onChange={e => setManualCalUrl(e.target.value)}
                  placeholder="https://cal.com/your-alias/demo"
                />
              </div>
              <div className="flex items-center gap-2 mt-3 px-1">
                <div className={clsx("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", manualCalUrl ? "bg-emerald-500 shadow-emerald-500/50" : "bg-slate-700")} />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  {manualCalUrl 
                    ? "Status: Using personal link"
                    : "Status: Using company default"}

                </p>
              </div>
            </div>
          </Section>
        )}

        {/* AI Memory & Behavior (Admin Only) */}
        {(user?.role === 'admin' || user?.is_superuser) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section title="Cognition" icon={Brain} description="Neural Knowledge Base">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="label-text flex items-center gap-2">
                    <MessageCircle size={12} className="text-brand-400" /> Industry Matrix
                  </label>
                  <textarea
                    className="input min-h-[120px] bg-[var(--input-bg)] resize-none text-xs leading-relaxed"
                    value={company?.ai_config.industry_lingo || ''}
                    onChange={e => updateAI('industry_lingo', e.target.value)}
                    placeholder="Load industry keywords here..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-text flex items-center gap-2">
                    <Zap size={12} className="text-brand-400" /> Company Knowledge
                  </label>
                  <textarea
                    className="input min-h-[120px] bg-[var(--input-bg)] resize-none text-xs leading-relaxed"
                    value={company?.ai_config.company_memory || ''}
                    onChange={e => updateAI('company_memory', e.target.value)}
                    placeholder="Tell the AI about your company, products, and any specific knowledge it should have..."
                  />
                </div>
              </div>
            </Section>

            <div className="space-y-8">
              <Section title="AI Behavior" icon={Bot} description="Tone & Personality">
                <div className="space-y-2">
                  <label className="label-text">Conversation Tone</label>
                  <select
                    className="input font-black text-[11px] uppercase tracking-widest bg-[var(--input-bg)] appearance-none"
                    value={company?.ai_config.tone || 'friendly and professional'}
                    onChange={e => updateAI('tone', e.target.value)}
                  >
                    <option value="friendly and professional">Friendly & Professional</option>
                    <option value="formal">Formal & Business</option>
                    <option value="casual">Casual & Friendly</option>
                    <option value="concise">Brief & Direct</option>
                  </select>
                  </div>
                  </Section>

                  <Section title="Phone Settings" icon={Phone} description="Connect your business number">
                  <div className="space-y-2">
                  <label className="label-text">Business Phone Number</label>

                  <input 
                    className="input font-mono text-xs font-black bg-[var(--input-bg)] text-brand-400 tracking-widest" 
                    value={company?.twilio_phone_number || ''} 
                    onChange={e => setCompany(c => c ? {...c, twilio_phone_number: e.target.value} : null)}
                    placeholder="+1.000.000.0000"
                  />
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* Save Console */}
        {(user?.role === 'admin' || user?.role === 'write' || user?.is_superuser) && (
          <div className="sticky bottom-8 left-0 right-0 flex items-center justify-center z-50">
            <div className="backdrop-blur-2xl p-2 rounded-[24px] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 pr-6 pl-2" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--divider)' }}>
              <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Activity size={24} className={clsx(saving && "animate-pulse")} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Ready for Sync</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">All parameters verified</p>
              </div>
              <button 
                type="submit" 
                className="btn-primary h-12 px-10 text-xs font-black uppercase tracking-[0.2em] shadow-none ml-4"
                disabled={saving}
              >
                {saving ? 'Syncing...' : saved ? '✓ Finalized' : 'Execute Update'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
