'use client'
import { useState, useEffect } from 'react'
import { getStoredUser, getCompany, updateCompany, getIndustryTemplates, updateMe, connectCalendar, type Company, type User } from '@/lib/api'
import { Key, Phone, Bot, User as UserIcon, Building2, Brain, MessageCircle, Sparkles, Calendar, CheckCircle2, X, AlertCircle, ShieldCheck, Globe, Link as LinkIcon, Settings2 } from 'lucide-react'
import clsx from 'clsx'

function Section({ title, icon: Icon, children, description }: {
  title: string; icon: React.ElementType; children: React.ReactNode; description?: string
}) {
  return (
    <div className="card p-5 md:p-6 shadow-sm border-gray-100 font-sans">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-brand-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5 font-medium">{description}</p>}
        </div>
      </div>
      {children}
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
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [manualCalUrl, setManualCalUrl] = useState('')
  const [useManual, setUseManual] = useState(true)

  useEffect(() => {
    const stored = getStoredUser()
    setUser(stored)
    setManualCalUrl(stored?.manual_calendar_url || '')
    setUseManual(!!stored?.manual_calendar_url || !stored?.calendar_connected)
    
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
      // 1. Save company settings
      await updateCompany(company)
      
      // 2. Save user manual cal URL
      // We send manual_calendar_url only if useManual is true, else we clear it
      const payload = { manual_calendar_url: useManual ? manualCalUrl : null }
      const updated = await updateMe(payload)
      
      // 3. Update local state and storage
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

  const disconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect your work calendar? AI will no longer be able to book meetings for you.')) return
    try {
      const updated = await updateMe({ 
        calendar_connected: false, 
        calcom_username: null, 
        calcom_event_id: null 
      })
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setUseManual(true)
    } catch (err) {
      alert('Failed to disconnect calendar')
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-8 font-bold font-sans">Loading settings…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      <div className="mb-6 px-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium italic">Configure your profile, AI memory, and communication channels.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account */}
        <Section title="Account" icon={UserIcon} description="Your personal profile information">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Name</span>
              <span className="font-bold text-gray-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Email</span>
              <span className="font-bold text-gray-900 truncate ml-4">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500 font-medium">Role</span>
              <span className="font-bold text-gray-900 capitalize">{user?.role}</span>
            </div>
          </div>
        </Section>

        {/* Unified Calendar Section */}
        <Section title="Calendar & Scheduling" icon={Calendar} description="Choose how leads book meetings with you">
          <div className="space-y-6">
            {/* Toggle Mode */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-fit">
              <button
                type="button"
                onClick={() => setUseManual(true)}
                className={clsx(
                  "flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all",
                  useManual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Direct URL
              </button>
              <button
                type="button"
                onClick={() => setUseManual(false)}
                className={clsx(
                  "flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all",
                  !useManual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Managed Integration
              </button>
            </div>

            {useManual ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                    Paste your personal booking link below. The AI will send this exact URL to leads whenever they ask to schedule.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Your Booking URL</label>
                  <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      className="input pl-10 font-mono text-xs font-bold bg-white" 
                      value={manualCalUrl} 
                      onChange={e => setManualCalUrl(e.target.value)}
                      placeholder="https://cal.com/your-name/15min"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {user?.calendar_connected ? (
                  <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-600 shadow-sm border border-brand-50">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-brand-900 text-sm">Managed Cal Active</p>
                        <p className="text-[10px] text-brand-600 font-bold uppercase tracking-tight">Syncing via Converso Managed Cal</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={disconnectCalendar}
                      className="btn-secondary py-2 px-6 text-xs font-bold text-red-600 border-red-100 hover:bg-red-50 w-full sm:w-auto"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <ShieldCheck size={28} className="text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">One-Click Integration</h3>
                    <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto font-medium leading-relaxed">
                      Connect your work calendar to let our platform manage your availability automatically.
                    </p>
                    <button 
                      type="button"
                      onClick={() => setShowProviderModal(true)}
                      className="btn-primary px-10 py-3 font-bold text-sm shadow-lg shadow-brand-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Connect Work Calendar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Industry Selector */}
        <Section title="Industry Context" icon={Building2} description="Select your industry to autopopulate AI knowledge">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Your Industry</label>
            <div className="relative">
              <select 
                className="input pr-10 appearance-none font-bold bg-white" 
                value={company?.industry || ''} 
                onChange={handleIndustryChange}
              >
                <option value="">Select an industry...</option>
                {Object.keys(templates).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Other">Other (Manual Entry)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Sparkles size={16} className="text-brand-500" />
              </div>
            </div>
          </div>
        </Section>

        {/* AI Memory & Knowledge */}
        <Section title="AI Memory & Knowledge" icon={Brain} description="Information the AI uses to curate personal responses">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2 font-bold">
                <MessageCircle size={12} className="text-brand-500" />
                Industry Lingo
              </label>
              <textarea
                className="input min-h-[100px] resize-none text-sm leading-relaxed font-bold bg-white"
                value={company?.ai_config.industry_lingo || ''}
                onChange={e => updateAI('industry_lingo', e.target.value)}
                placeholder="e.g. use terms like 'Pre-approval', 'HELOC', 'Amortization'."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2 font-bold">
                <Brain size={12} className="text-brand-500" />
                Company Memory
              </label>
              <textarea
                className="input min-h-[120px] resize-none text-sm leading-relaxed font-bold bg-white"
                value={company?.ai_config.company_memory || ''}
                onChange={e => updateAI('company_memory', e.target.value)}
                placeholder="e.g. We specialize in first-time home buyers in Ontario."
              />
            </div>
          </div>
        </Section>

        {/* AI Behaviour */}
        <Section title="AI Behaviour" icon={Bot} description="Control the tone and style of AI interactions">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Response tone</label>
              <select 
                className="input font-bold bg-white"
                value={company?.ai_config.tone || 'friendly and professional'}
                onChange={e => updateAI('tone', e.target.value)}
              >
                <option value="friendly and professional">Friendly and Professional</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="concise">Concise and Direct</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Twilio Settings */}
        <Section title="Twilio Configuration" icon={Phone} description="Your outbound messaging details">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Twilio Phone Number</label>
              <input 
                className="input font-mono text-xs font-bold bg-white" 
                value={company?.twilio_phone_number || ''} 
                onChange={e => setCompany(c => c ? {...c, twilio_phone_number: e.target.value} : null)}
                placeholder="+1234567890"
              />
            </div>
          </div>
        </Section>

        {/* Save Bar */}
        <div className="sticky bottom-6 left-0 right-0 flex items-center justify-center z-20 px-4">
          <div className="card bg-white/90 backdrop-blur-md p-3 flex items-center gap-4 shadow-xl border-brand-100">
            <p className="text-[11px] text-gray-400 hidden sm:block font-bold italic">AI updates instantly on save.</p>
            <button 
              type="submit" 
              className="btn-primary px-10 py-2.5 shadow-lg shadow-brand-200 font-bold"
              disabled={saving}
            >
              {saving ? 'Saving...' : saved ? '✓ Settings Saved' : 'Save all changes'}
            </button>
          </div>
        </div>
      </form>

      {showProviderModal && (
        <ProviderSelectionModal 
          user={user}
          onClose={() => setShowProviderModal(false)} 
          onConnected={(updated) => {
            setUser(updated)
            setShowProviderModal(false)
          }}
        />
      )}
    </div>
  )
}

function ProviderSelectionModal({ user, onClose, onConnected }: { user: User | null; onClose: () => void; onConnected: (u: User) => void }) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const connect = async (provider: string) => {
    setConnecting(provider)
    try {
      // 1. Perform backend-managed connection flow
      await connectCalendar(provider)
      
      // 2. Fetch fresh user data to reflect the new state
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (!response.ok) throw new Error('Failed to refresh user data')
      const updatedUser = await response.json()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      onConnected(updatedUser)
    } catch (err: any) {
      alert(`Failed to connect ${provider} calendar: ${err.message}`)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm p-6 my-auto shadow-2xl border-none bg-white animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Choose your calendar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => connect('google')}
            disabled={!!connecting}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-500 hover:bg-brand-50/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm">
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              </div>
              <span className="font-bold text-gray-700">Google Calendar</span>
            </div>
            {connecting === 'google' ? (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-600" />
            )}
          </button>

          <button 
            onClick={() => connect('microsoft')}
            disabled={!!connecting}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-500 hover:bg-brand-50/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm">
                <img src="https://www.microsoft.com/favicon.ico" className="w-5 h-5" alt="Microsoft" />
              </div>
              <span className="font-bold text-gray-700">Microsoft Outlook</span>
            </div>
            {connecting === 'microsoft' ? (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-600" />
            )}
          </button>
        </div>

        <p className="mt-6 text-[10px] text-gray-400 text-center font-medium leading-relaxed italic">
          Sign in via Okta to grant Converso secure access to your availability.
        </p>
      </div>
    </div>
  )
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
}
