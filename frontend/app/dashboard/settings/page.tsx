'use client'
import { useState, useEffect } from 'react'
import { getStoredUser, getCompany, updateCompany, getIndustryTemplates, updateMe, connectCalendar, type Company, type User } from '@/lib/api'
import { Key, Phone, Bot, User as UserIcon, Building2, Brain, MessageCircle, Sparkles, Calendar, CheckCircle2, X, AlertCircle, ShieldCheck, Globe, Link as LinkIcon, Settings2, Users } from 'lucide-react'
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
      // 1. Save company settings (including master team link)
      await updateCompany(company)
      
      // 2. Save user personal override
      const updated = await updateMe({ manual_calendar_url: manualCalUrl || null })
      
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

        {/* Master Team Link (Admin Only) */}
        {user?.role === 'admin' && (
          <Section title="Team Orchestration" icon={Users} description="Configure the master scheduling link for the entire company">
            <div className="space-y-4">
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
                <p className="text-[11px] text-brand-700 font-bold leading-relaxed">
                  Enter your master Cal.com Team Round Robin link. This will be the default link the AI sends to leads if an agent hasn't set their own override.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Team Booking URL</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    className="input pl-10 font-mono text-xs font-bold bg-white" 
                    value={company?.cal_booking_url || ''} 
                    onChange={e => setCompany(c => c ? {...c, cal_booking_url: e.target.value} : null)}
                    placeholder="https://cal.com/team/your-company/discovery"
                  />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Personal Booking Link */}
        <Section title="Personal Booking" icon={LinkIcon} description="Set your own booking link to override the company default">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Your Personal URL</label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  className="input pl-10 font-mono text-xs font-bold bg-white" 
                  value={manualCalUrl} 
                  onChange={e => setManualCalUrl(e.target.value)}
                  placeholder="https://cal.com/your-name/15min"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 italic font-medium leading-relaxed">
                {manualCalUrl 
                  ? "✓ AI will use this link for your leads." 
                  : `Defaulting to ${company?.cal_booking_url ? 'Company Team Link' : 'no link'} until you provide one.`}
              </p>
            </div>
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
    </div>
  )
}
