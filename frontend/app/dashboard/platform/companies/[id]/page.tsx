'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCompanyDetails, updateCompanyAsAdmin, deleteCompany, type Company } from '@/lib/api'
import { 
  Building2, 
  Users, 
  Settings, 
  ArrowLeft, 
  Save, 
  Trash2, 
  Calendar, 
  Phone, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Mail,
  MoreVertical,
  User as UserIcon
} from 'lucide-react'
import clsx from 'clsx'

export default function CompanyDetailAdminPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<{ company: Company; users: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (id) {
      getCompanyDetails(id as string)
        .then(setData)
        .finally(() => setLoading(false))
    }
  }, [id])

  async function handleSave() {
    if (!data) return
    setSaving(true)
    try {
      await updateCompanyAsAdmin(id as string, data.company)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Failed to update company')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('EXTREME CAUTION: Are you sure you want to delete this company? This will remove ALL users, leads, and messages permanently.')) return
    try {
      await deleteCompany(id as string)
      router.push('/dashboard/platform')
    } catch (err) {
      alert('Failed to delete company')
    }
  }

  if (loading) return <div className="p-8 text-sm font-bold text-gray-400">Loading client details…</div>
  if (!data) return <div className="p-8 text-sm font-bold text-red-500">Company not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-20">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Clients
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-black shadow-xl">
            {data.company.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{data.company.name}</h1>
            <p className="text-gray-500 text-sm font-medium">Tenant ID: <span className="font-mono text-xs">{data.company.id}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            className="btn-secondary text-red-600 border-red-100 hover:bg-red-50 px-4 py-2 text-sm font-bold flex items-center gap-2"
          >
            <Trash2 size={16} /> Offboard
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-6 py-2 text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-100"
          >
            {saving ? 'Saving...' : saved ? <><CheckCircle2 size={16} /> Saved</> : <><Save size={16} /> Update Config</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          <AdminSection title="Core Configuration" icon={Settings}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Company Name</label>
                <input 
                  className="input text-sm font-bold" 
                  value={data.company.name}
                  onChange={e => setData({...data, company: {...data.company, name: e.target.value}})}
                />
              </div>
              <div>
                <label className="label-text">Industry</label>
                <input 
                  className="input text-sm font-bold" 
                  value={data.company.industry || ''}
                  onChange={e => setData({...data, company: {...data.company, industry: e.target.value}})}
                />
              </div>
              <div>
                <label className="label-text">Twilio Number</label>
                <input 
                  className="input text-sm font-bold font-mono" 
                  value={data.company.twilio_phone_number || ''}
                  onChange={e => setData({...data, company: {...data.company, twilio_phone_number: e.target.value}})}
                />
              </div>
              <div>
                <label className="label-text">Cal.com Base URL</label>
                <input 
                  className="input text-sm font-bold font-mono" 
                  value={data.company.calcom_base_url || ''}
                  onChange={e => setData({...data, company: {...data.company, calcom_base_url: e.target.value}})}
                />
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Tenant Users" icon={Users}>
            <div className="divide-y divide-gray-50">
              {data.users.map(user => (
                <div key={user.id} className="py-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      user.role === 'admin' ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                    )}>
                      {user.role}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AdminSection>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="card p-6 bg-gray-900 border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 blur-[80px] opacity-30" />
            <h3 className="text-white font-black text-sm mb-4 relative z-10">Platform Status</h3>
            <div className="space-y-4 relative z-10">
              <StatusRow label="API Status" value="Active" color="text-emerald-400" />
              <StatusRow label="Sync Hub" value="Connected" color="text-emerald-400" />
              <StatusRow label="Created" value={new Date(data.company.created_at).toLocaleDateString()} color="text-gray-400" />
            </div>
          </div>

          <div className="card p-6 border-amber-100 bg-amber-50/30">
            <div className="flex items-start gap-3 mb-4">
              <ShieldAlert className="text-amber-600 shrink-0" size={20} />
              <h3 className="text-amber-900 font-bold text-sm">Admin Overrides</h3>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              As a platform admin, your changes here will instantly override the company's local settings. Use this for troubleshooting or global policy enforcement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="card p-6 shadow-sm border-gray-100 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
          <Icon size={20} />
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function StatusRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-500 font-bold uppercase tracking-widest">{label}</span>
      <span className={clsx("font-black", color)}>{value}</span>
    </div>
  )
}
