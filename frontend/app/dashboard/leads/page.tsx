'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getLeads, createLead, importLeads, exportLeads, getStoredUser, type Lead } from '@/lib/api'
import { Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal, Phone, Mail, Building2, Upload, Download, FileText, AlertCircle, CheckCircle2, X, Clock } from 'lucide-react'
import clsx from 'clsx'

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost']

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-gray-100 text-gray-600',
}

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: '😊',
  neutral:  '😐',
  negative: '😟',
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch (e) {
    return '—'
  }
}

const PAGE_SIZE = 25

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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{total} total leads in pipeline</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && (
            <>
              <button 
                className="btn-secondary w-full sm:w-auto shadow-sm font-bold text-xs" 
                onClick={async () => {
                  try {
                    await exportLeads()
                  } catch (e) {
                    alert('Export failed')
                  }
                }}
              >
                <Download size={14} /> Export
              </button>
              <button 
                className="btn-secondary w-full sm:w-auto shadow-sm font-bold text-xs" 
                onClick={() => setShowImportModal(true)}
              >
                <Upload size={14} /> Import
              </button>
              <button 
                className="btn-primary w-full sm:w-auto shadow-md shadow-brand-100 font-bold text-xs" 
                onClick={() => setShowModal(true)}
              >
                <Plus size={14} /> Add lead
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10 shadow-sm font-medium bg-white"
            placeholder="Search by name, email, company…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap shadow-sm border',
                status === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List / Table */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-bold">Loading your leads…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-400 text-sm font-bold shadow-sm">
            No leads found matching your criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden shadow-sm border-gray-100">
              <div className="table-container">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="text-left text-gray-500 text-[10px] uppercase tracking-wider bg-gray-50/50 border-b border-gray-100 font-bold">
                      <th className="px-6 py-4">Lead Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Interval</th>
                      <th className="px-6 py-4 text-center">Sentiment</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4">Last contacted</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-xs uppercase">
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{lead.name}</div>
                              <div className="text-gray-400 text-[11px] font-medium">{lead.lead_company || lead.company || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx('badge text-[10px] font-bold uppercase', STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600')}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-gray-600">{(lead as any).nudge_interval_days}d</span>
                        </td>
                        <td className="px-6 py-4 text-center text-lg" title={lead.sentiment || 'No sentiment data'}>
                          {lead.sentiment ? SENTIMENT_EMOJI[lead.sentiment] : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-[11px] font-bold">
                          {formatDateTime(lead.created_at)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-[11px] font-bold">
                          {formatDateTime(lead.last_contacted)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/leads/${lead.id}`} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-brand-600 transition-all">
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden pb-12">
              {filtered.map(lead => (
                <Link 
                  key={lead.id} 
                  href={`/dashboard/leads/${lead.id}`}
                  className="card p-4 active:scale-[0.98] transition-transform space-y-3 shadow-sm border-gray-100 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm uppercase">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{lead.name}</div>
                        <div className="text-gray-400 text-[11px] font-medium">{lead.lead_company || lead.company || '—'}</div>
                      </div>
                    </div>
                    <span className={clsx('badge text-[10px] font-bold uppercase', STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600')}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Created</p>
                      <p className="text-[10px] font-bold text-gray-600">{formatDateTime(lead.created_at)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Last contact</p>
                      <p className="text-[10px] font-bold text-gray-600">{formatDateTime(lead.last_contacted)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Interval</p>
                      <p className="text-[10px] font-bold text-gray-600">{(lead as any).nudge_interval_days} days</p>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-lg">{lead.sentiment ? SENTIMENT_EMOJI[lead.sentiment] : ''}</span>
                      <span className="capitalize text-[10px] font-bold">{lead.sentiment || 'No data'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-4 py-2 text-xs font-bold"
              disabled={page === 1}
              onClick={() => { setPage(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className="btn-secondary px-4 py-2 text-xs font-bold"
              disabled={page === totalPages}
              onClick={() => { setPage(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AddLeadModal onClose={() => setShowModal(false)} onCreated={load} />
      )}
      {showImportModal && (
        <ImportLeadsModal onClose={() => setShowImportModal(false)} onImported={load} />
      )}
    </div>
  )
}

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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="card w-full max-w-lg p-6 my-auto shadow-2xl border-none bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add new lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full name *</label>
              <input className="input font-medium bg-white" placeholder="e.g. Sarah Connor" value={form.name} onChange={set('name')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email *</label>
              <input type="email" className="input font-medium bg-white" placeholder="sarah@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone *</label>
              <input className="input font-medium bg-white" placeholder="+1234567890" value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company</label>
              <input className="input font-medium bg-white" placeholder="Acme Corp" value={form.company} onChange={set('company')} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Title</label>
              <input className="input font-medium bg-white" placeholder="VP of Sales" value={form.title} onChange={set('title')} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Industry</label>
              <input className="input font-medium bg-white" placeholder="Mortgage" value={form.industry} onChange={set('industry')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Interest / notes</label>
              <textarea className="input min-h-[80px] resize-none font-medium text-sm bg-white" placeholder="Details about their needs..." value={form.interest} onChange={set('interest')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold text-brand-600 uppercase tracking-wider">Nudge Interval (Days)</label>
              <input type="number" className="input font-bold bg-white" min="1" max="30" value={form.nudge_interval_days} onChange={set('nudge_interval_days')} />
              <p className="text-[10px] text-gray-400 italic font-medium">Wait this many days before automatically following up if they don't respond.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary w-full sm:w-auto order-2 sm:order-1 font-bold text-xs" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary w-full sm:w-auto order-1 sm:order-2 px-8 font-bold text-xs" disabled={loading}>
              {loading ? 'Creating…' : 'Create lead'}
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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="card w-full max-w-md p-6 my-auto shadow-2xl border-none bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Import Leads</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">Expected Format</h3>
              <p className="text-xs text-brand-600 leading-relaxed font-medium">
                Upload an Excel (.xlsx, .xls) or CSV file with the following columns:
                <br /><strong className="text-brand-800">name, email, phone</strong> (required)
                <br /><span className="opacity-70 text-[10px] font-bold">Optional: title, company, industry, interest</span>
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                file ? "border-brand-500 bg-brand-50/30" : "border-gray-200 hover:border-brand-400 hover:bg-gray-50"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx,.xls" 
                onChange={handleFileChange} 
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                <Upload size={20} className={file ? "text-brand-600" : "text-gray-400"} />
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate px-4">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">CSV, XLSX or XLS</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn-secondary flex-1 font-bold text-xs" onClick={onClose} disabled={uploading}>Cancel</button>
              <button 
                className="btn-primary flex-[2] font-bold text-xs shadow-md shadow-brand-100" 
                onClick={handleUpload} 
                disabled={!file || uploading}
              >
                {uploading ? "Importing..." : "Start Import"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Import Complete</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Successfully imported <span className="font-bold text-green-600">{result.success_count}</span> leads.
              </p>
            </div>

            {result.error_count > 0 && (
              <div className="bg-orange-50 border border-yellow-100 rounded-xl p-4 text-left shadow-inner">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">
                  Warnings ({result.error_count})
                </p>
                <ul className="text-[11px] text-orange-600 space-y-1 max-h-32 overflow-y-auto font-medium">
                  {result.errors.map((err, i) => <li key={i}>• {err}</li>)}
                  {result.error_count > 10 && <li className="opacity-60 italic">And {result.error_count - 10} more errors...</li>}
                </ul>
              </div>
            )}

            <button className="btn-primary w-full py-3 shadow-lg shadow-brand-100 font-bold" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
