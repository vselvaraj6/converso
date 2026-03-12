'use client'
import { useState, useEffect } from 'react'
import { getStoredUser, getCompany, updateCompany, getIndustryTemplates, type Company } from '@/lib/api'
import { Key, Phone, Bot, User, Building2, Brain, MessageCircle, Sparkles } from 'lucide-react'

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
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
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
  const user = getStoredUser()
  const [company, setCompany] = useState<Company | null>(null)
  const [templates, setTemplates] = useState<Record<string, { industry_lingo: string; company_memory: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
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

  if (loading) return <div className="text-gray-400 text-sm p-8">Loading settings…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="mb-6 px-1">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Manage your Converso configuration and AI memory</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account */}
        <Section title="Account" icon={User} description="Your personal profile information">
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
            <p className="text-[11px] text-gray-400 mt-2 italic">Selecting an industry will provide the AI with standard industry terms and knowledge templates below.</p>
          </div>
        </Section>

        {/* Company & AI Memory */}
        <Section title="AI Memory & Knowledge" icon={Brain} description="Information the AI uses to curate personal responses">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <MessageCircle size={12} className="text-brand-500" />
                Industry Lingo
              </label>
              <textarea
                className="input min-h-[100px] resize-none text-sm leading-relaxed"
                value={company?.ai_config.industry_lingo || ''}
                onChange={e => updateAI('industry_lingo', e.target.value)}
                placeholder="e.g. use terms like 'Pre-approval', 'HELOC', 'Amortization'. Avoid being too salesy."
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Specific terms or phrases the AI should use or understand.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Brain size={12} className="text-brand-500" />
                Company Memory
              </label>
              <textarea
                className="input min-h-[120px] resize-none text-sm leading-relaxed"
                value={company?.ai_config.company_memory || ''}
                onChange={e => updateAI('company_memory', e.target.value)}
                placeholder="e.g. We specialize in first-time home buyers in Ontario. We've been in business for 15 years and have 5-star reviews on Google."
              />
              <p className="text-[11px] text-gray-400 mt-1.5">General knowledge about your company that the AI should know when talking to leads.</p>
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

        {/* Integration Settings */}
        <Section title="Scheduling & Twilio" icon={Phone} description="Connect your communication channels">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cal.com Booking URL</label>
              <input 
                className="input font-mono text-xs" 
                value={company?.cal_booking_url || ''} 
                onChange={e => setCompany(c => c ? {...c, cal_booking_url: e.target.value} : null)}
                placeholder="https://cal.com/your-team/meeting"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cal.com Event Type ID</label>
              <input 
                type="number"
                className="input font-mono text-xs" 
                value={company?.cal_event_type_id || ''} 
                onChange={e => setCompany(c => c ? {...c, cal_event_type_id: parseInt(e.target.value) || null} : null)}
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Twilio Phone Number</label>
              <input 
                className="input font-mono text-xs" 
                value={company?.twilio_phone_number || ''} 
                onChange={e => setCompany(c => c ? {...c, twilio_phone_number: e.target.value} : null)}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">VAPI Assistant ID (Optional)</label>
              <input 
                className="input font-mono text-xs" 
                value={company?.vapi_assistant_id || ''} 
                onChange={e => setCompany(c => c ? {...c, vapi_assistant_id: e.target.value} : null)}
                placeholder="uuid-of-your-assistant"
              />
              <p className="text-[11px] text-gray-400 mt-1.5 italic">If empty, a dynamic assistant will be created for each call.</p>
            </div>
          </div>
        </Section>

        {/* API Keys Info */}
        <Section title="Server Configuration" icon={Key} description="System-level environment variables">
          <p className="text-xs text-gray-500 mb-4 font-medium">
            Sensitive API keys are configured via the <code className="bg-gray-100 px-1 rounded text-[10px] font-bold">.env</code> file on your server.
          </p>
          <div className="divide-y divide-gray-50 border-t border-gray-50">
            <EnvRow label="OpenAI API Key"     envKey="OPENAI_API_KEY"     description="platform.openai.com" />
            <EnvRow label="Twilio Credentials" envKey="TWILIO_ACCOUNT_SID" description="Twilio console" />
            <EnvRow label="VAPI API Key"       envKey="VAPI_API_KEY"       description="dashboard.vapi.ai" />
          </div>
        </Section>

        {/* Save Bar */}
        <div className="sticky bottom-6 left-0 right-0 flex items-center justify-center z-20 px-4">
          <div className="card bg-white/90 backdrop-blur-md p-3 flex items-center gap-4 shadow-xl border-brand-100">
            <p className="text-[11px] text-gray-400 hidden sm:block font-medium italic">Your AI will update as soon as you save.</p>
            <button 
              type="submit" 
              className="btn-primary px-10 py-2.5 shadow-lg shadow-brand-200"
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
