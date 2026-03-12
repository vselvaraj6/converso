'use client'
import { useState } from 'react'
import { getStoredUser } from '@/lib/api'
import { Key, Phone, Bot, User } from 'lucide-react'

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} className="text-brand-600" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function EnvRow({ label, envKey, description }: { label: string; envKey: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{envKey}</code>
    </div>
  )
}

export default function SettingsPage() {
  const user = getStoredUser()
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your Converso configuration</p>
      </div>

      {/* Account */}
      <Section title="Account" icon={User}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-gray-900 capitalize">{user?.role}</span>
          </div>
        </div>
      </Section>

      {/* API Keys — set via .env file */}
      <Section title="API Keys" icon={Key}>
        <p className="text-sm text-gray-500 mb-4">
          API keys are configured via the <code className="bg-gray-100 px-1 rounded text-xs">.env</code> file on your server.
          Restart the backend container after making changes.
        </p>
        <div>
          <EnvRow label="Twilio Account SID" envKey="TWILIO_ACCOUNT_SID" description="Twilio console → Account SID" />
          <EnvRow label="Twilio Auth Token"  envKey="TWILIO_AUTH_TOKEN"  description="Twilio console → Auth Token" />
          <EnvRow label="Twilio Phone Number" envKey="TWILIO_PHONE_NUMBER" description="Your Twilio phone number (+1...)" />
          <EnvRow label="OpenAI API Key"     envKey="OPENAI_API_KEY"     description="platform.openai.com → API keys" />
          <EnvRow label="VAPI API Key"       envKey="VAPI_API_KEY"       description="dashboard.vapi.ai → API keys" />
          <EnvRow label="Google Client ID"   envKey="GOOGLE_CLIENT_ID"   description="Google Cloud Console → OAuth 2.0" />
          <EnvRow label="Google Client Secret" envKey="GOOGLE_CLIENT_SECRET" description="Google Cloud Console → OAuth 2.0" />
        </div>
      </Section>

      {/* Twilio webhook instructions */}
      <Section title="Twilio Webhook" icon={Phone}>
        <p className="text-sm text-gray-500 mb-4">
          Configure this URL in your Twilio console under{' '}
          <strong>Phone Numbers → Messaging → Webhook</strong>:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <code className="text-sm text-gray-700 font-mono">
            https://&lt;your-domain&gt;/api/webhooks/twilio/inbound
          </code>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Make sure your Cloudflare tunnel is pointing to port 80 (nginx) or port 8000 (direct to API).
        </p>
      </Section>

      {/* AI config */}
      <Section title="AI Behaviour" icon={Bot}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response tone</label>
            <select className="input">
              <option>friendly and professional</option>
              <option>formal</option>
              <option>casual</option>
              <option>concise</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Affects how the AI writes SMS replies</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom prompt context</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="e.g. We are a B2B SaaS company focused on HR automation. Our main offer is a 14-day free trial."
            />
            <p className="text-xs text-gray-400 mt-1">
              This context is injected into every AI prompt to personalise responses
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className={`text-sm text-green-600 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
              ✓ Saved
            </span>
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>
      </Section>
    </div>
  )
}
