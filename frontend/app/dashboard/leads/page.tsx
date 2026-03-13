'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getLeads, createLead, importLeads, exportLeads, getStoredUser, type Lead } from '@/lib/api'
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Building2, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock,
  Filter,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Zap,
  MoreVertical
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-50 text-blue-600 border-blue-100',
  contacted: 'bg-amber-50 text-amber-600 border-amber-100',
  qualified: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  converted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  lost:      'bg-slate-50 text-slate-500 border-slate-200',
}

const SENTIMENT_STYLE: Record<string, { emoji: string, color: string }> = {
  positive: { emoji: '✨', color: 'text-emerald-600' },
  neutral:  { emoji: '💬', color: 'text-slate-400' },
  negative: { emoji: '⚠️', color: 'text-amber-600' },
}

const PAGE_SIZE = 24

export default function LeadsPage() {
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  async function load() {
    setLoading(true)
    const skip = (page - 1) * PAGE_SIZE
    try {
      const data = await getLeads({
        skip,
        limit: PAGE_SIZE,
        status: status === 'all' ? undefined : status,
      })
      setLeads(data.leads)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    setUser(getStoredUser())
    load() 
  }, [page, status]) // eslint-disable-line

  const canWrite = user?.role === 'admin' || user?.role === 'write' || user?.is_superuser

  const filtered = search
    ? leads.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.company ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : leads

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-white/5">
            <TrendingUp size={12} className="text-emerald-400" />
            Lead Pipeline
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            Your Prospects
          </h1>
          <p className="text-slate-500 text-sm font-medium">Nurture and manage your active leads with AI-driven insights.</p>
        </div>

        <div className="flex items-center gap-3">
          {canWrite && (
            <>
              <button 
                onClick={async () => { try { await exportLeads() } catch (e) { alert('Export failed') }}}
                className="btn-secondary h-11 px-5 shadow-sm border-slate-200 text-slate-600 hover:text-brand-600 transition-all active:scale-95"
              >
                <Download size={16} />
              </button>
              <button 
                onClick={() => setShowImportModal(true)}
                className="btn-secondary h-11 px-5 shadow-sm border-slate-200 text-slate-600 hover:text-brand-600 transition-all active:scale-95"
              >
                <Upload size={16} />
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-slate-900 text-white h-11 px-6 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-200 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                <Plus size={18} strokeWidth={3} /> Add Prospect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-2 bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            className="w-full bg-slate-50/50 border-none rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none transition-all focus:bg-white"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto p-1 scrollbar-hide">
          {['all', 'new', 'contacted', 'qualified', 'converted'].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={clsx(
                'px-6 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                status === s
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-slate-50 border-none" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-20 text-center space-y-4 border-dashed border-2 border-slate-200 bg-transparent shadow-none">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Zap size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Zero Prospects Found</h3>
            <p className="text-slate-400 text-sm font-medium">Try adjusting your filters or search query.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-10">
          <button
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-xl flex items-center justify-center text-slate-400 hover:text-brand-600 transition-all disabled:opacity-30 active:scale-90"
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <div className="px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-xl font-black text-xs text-slate-900 uppercase tracking-widest">
            Page {page} <span className="text-slate-300 mx-2">/</span> {totalPages}
          </div>
          <button
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-xl flex items-center justify-center text-slate-400 hover:text-brand-600 transition-all disabled:opacity-30 active:scale-90"
            disabled={page === totalPages}
            onClick={() => { setPage(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Modals (Standardized Style) */}
      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onCreated={load} />}
      {showImportModal && <ImportLeadsModal onClose={() => setShowImportModal(false)} onImported={load} />}
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const sentiment = lead.sentiment ? SENTIMENT_STYLE[lead.sentiment] : null

  return (
    <Link 
      href={`/dashboard/leads/${lead.id}`}
      className="card group p-6 bg-white border-none shadow-2xl shadow-slate-200/40 hover:-translate-y-2 hover:shadow-slate-300/50 duration-500 relative overflow-hidden"
    >
      <div className={clsx("absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 bg-gradient-to-br from-brand-500 to-indigo-600")} />
      
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-black text-xl shadow-inner group-hover:scale-110 duration-500">
            {lead.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-brand-600 transition-colors">{lead.name}</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{(lead as any).company || 'Private Sector'}</p>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={18} /></button>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className={clsx("badge border-none px-3.5 py-1 text-[10px] font-black", STATUS_COLORS[lead.status])}>
            {lead.status}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-600">{(lead as any).nudge_interval_days}d cycle</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sentiment</p>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{sentiment?.emoji || '—'}</span>
              <span className={clsx("text-[10px] font-black uppercase tracking-tight", sentiment?.color || 'text-slate-400')}>
                {lead.sentiment || 'Awaiting'}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Last Intel</p>
            <p className="text-[10px] font-black text-slate-900">
              {lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-500">
        <ArrowUpRight size={20} className="text-brand-500" />
      </div>
    </Link>
  )
}

// Reuse Modals but with new Premium styles...
function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', title: '', industry: '', source: 'manual', interest: '', nudge_interval_days: 2,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createLead(form)
      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-100 animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Add Prospect</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Initiate new lead journey</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-3 text-xs font-black flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input className="input" placeholder="Sarah Connor" value={form.name} onChange={set('name')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <input type="email" className="input" placeholder="sarah@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Phone</label>
              <input className="input" placeholder="+1234567890" value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</label>
              <input className="input" placeholder="Acme Corp" value={form.company} onChange={set('company')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nudge Interval (Days)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={16} />
                <input type="number" className="input pl-12" min="1" max="30" value={form.nudge_interval_days} onChange={set('nudge_interval_days')} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" className="btn-secondary flex-1 font-black uppercase text-[11px] tracking-widest" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-[2] font-black uppercase text-[11px] tracking-widest" disabled={loading}>
              {loading ? 'Submitting…' : 'Register Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportLeadsModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success_count: number; error_count: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const data = await importLeads(file)
      setResult(data)
      if (data.success_count > 0) onImported()
    } catch (err: any) {
      setError(err.message || 'Failed to import file')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0])
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-100 animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Bulk Import</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Onboard Leads at Scale</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {!result ? (
          <div className="space-y-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                "border-2 border-dashed rounded-[24px] p-12 text-center cursor-pointer transition-all duration-500",
                file ? "border-brand-500 bg-brand-50/20" : "border-slate-200 hover:border-brand-400 hover:bg-slate-50"
              )}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 duration-500">
                <Upload size={24} className={file ? "text-brand-600" : "text-slate-400"} />
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-black text-slate-900 truncate px-4">{file.name}</p>
                  <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB Ready</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Select Dataset</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest uppercase">CSV, XLSX or XLS</p>
                </div>
              )}
            </div>

            <button 
              className="btn-primary w-full py-4 uppercase text-[11px] tracking-widest" 
              onClick={handleUpload} 
              disabled={!file || uploading}
            >
              {uploading ? "Ingesting Data…" : "Start Ingestion"}
            </button>
          </div>
        ) : (
          <div className="space-y-8 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Success</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Successfully onboarded <span className="font-black text-emerald-600">{result.success_count}</span> units.
              </p>
            </div>
            <button className="btn-primary w-full py-4 font-black uppercase text-[11px] tracking-widest" onClick={onClose}>
              Acknowledge
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
