'use client'
import { useState, useEffect } from 'react'
import { getStoredUser, getCompany, updateCompany, getIndustryTemplates, updateMe, type Company, type User } from '@/lib/api'
import { Key, Phone, Bot, User as UserIcon, Building2, Brain, MessageCircle, Sparkles, Calendar, CheckCircle2, X, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

function Section({ title, icon: Icon, children, description }: {
  title: string; icon: React.ElementType; children: React.ReactNode; description?: string
}) {
  return (
    <div className="card p-5 md:p-6 shadow-sm border-gray-100">
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

function EnvRow({ label, envKey, description }: { label: string; envKey: string; description: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between py-3 border-b border-gray-100 last:border-0 gap-2">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
      </div>
      <code className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono break-all sm:break-normal">
        {envKey}
      </code>
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
  const [showCalModal, setShowCalModal] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
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
      await updateCompany(company)
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
    if (!confirm('Are you sure you want to disconnect your calendar? AI will no longer be able to book meetings for you.')) return
    try {
      const updated = await updateMe({ 
        calendar_connected: false, 
        calcom_api_key: null, 
        calcom_event_id: null 
      })
      setUser(updated)
    } catch (err) {
      alert('Failed to disconnect calendar')
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-8 font-bold">Loading settings…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
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

        {/* Calendar Connection */}
        <Section title="Calendar Integration" icon={Calendar} description="Connect your Cal.com account to allow AI booking">
          {user?.calendar_connected ? (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm border border-green-50">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="font-bold text-green-900 text-sm">Calendar Connected</p>
                  <p className="text-xs text-green-700 font-medium">Event ID: {user.calcom_event_id}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={() => setShowCalModal(true)}
                  className="btn-secondary py-2 px-4 text-xs font-bold flex-1 sm:flex-none"
                >
                  Update Settings
                </button>
                <button 
                  type="button"
                  onClick={disconnectCalendar}
                  className="btn-secondary py-2 px-4 text-xs font-bold text-red-600 border-red-100 hover:bg-red-50 flex-1 sm:flex-none"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Calendar size={24} className="text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">No Calendar Connected</h3>
              <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto font-medium leading-relaxed">
                Connect your Cal.com account so the AI can check your availability and schedule meetings with leads automatically.
              </p>
              <button 
                type="button"
                onClick={() => setShowCalModal(true)}
                className="btn-primary px-8 py-2.5 font-bold text-sm shadow-lg shadow-brand-100"
              >
                Connect Cal.com
              </button>
            </div>
          )}
        </Section>

        {/* Industry Selector */}
        <Section title="Industry Context" icon={Building2} description="Select your industry to autopopulate AI knowledge">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your Industry</label>
            <div className="relative">
              <select 
                className="input pr-10 appearance-none font-bold" 
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
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <MessageCircle size={12} className="text-brand-500" />
                Industry Lingo
              </label>
              <textarea
                className="input min-h-[100px] resize-none text-sm leading-relaxed font-medium"
                value={company?.ai_config.industry_lingo || ''}
                onChange={e => updateAI('industry_lingo', e.target.value)}
                placeholder="e.g. use terms like 'Pre-approval', 'HELOC', 'Amortization'."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Brain size={12} className="text-brand-500" />
                Company Memory
              </label>
              <textarea
                className="input min-h-[120px] resize-none text-sm leading-relaxed font-medium"
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
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Response tone</label>
              <select 
                className="input font-bold"
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
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Twilio Phone Number</label>
              <input 
                className="input font-mono text-xs font-bold" 
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

      {showCalModal && (
        <CalConnectModal 
          onClose={() => setShowCalModal(false)} 
          onConnected={(updated) => {
            setUser(updated)
            setShowCalModal(false)
          }}
        />
      )}
    </div>
  )
}

function CalConnectModal({ onClose, onConnected }: { onClose: () => void; onConnected: (u: User) => void }) {
  const [form, setForm] = useState({ key: '', eventId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const updated = await updateMe({
        calendar_connected: true,
        calcom_api_key: form.key,
        calcom_event_id: parseInt(form.eventId)
      })
      onConnected(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to connect calendar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 my-auto shadow-2xl border-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Connect Cal.com</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConnect} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <p className="text-[11px] text-brand-700 font-bold leading-relaxed">
                To connect, you need a <span className="underline">Cal.com API key</span>. 
                Go to <strong className="text-brand-900">Settings → Developer → API Keys</strong> in your Cal.com dashboard to create one.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cal.com API Key</label>
              <input 
                type="password"
                className="input font-mono text-xs font-bold" 
                placeholder="cal_live_..."
                value={form.key}
                onChange={e => setForm({...form, key: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Type ID</label>
              <input 
                type="number"
                className="input font-mono text-xs font-bold" 
                placeholder="123456"
                value={form.eventId}
                onChange={e => setForm({...form, eventId: e.target.value})}
                required
              />
              <p className="text-[10px] text-gray-400 mt-1.5 italic font-medium">Found in the URL of your event type settings.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="btn-primary w-full py-3 shadow-lg shadow-brand-100 font-bold" 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Connect Calendar'}
            </button>
            <button type="button" className="btn-secondary w-full py-2.5 font-bold text-xs" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
