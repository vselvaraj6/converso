'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLeads, createLead, type Lead } from '@/lib/api'
import { Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal, Phone, Mail, Building2 } from 'lucide-react'
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

const PAGE_SIZE = 25

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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

  useEffect(() => { load() }, [page, status]) // eslint-disable-line

  const filtered = search
    ? leads.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.company ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : leads

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total leads in pipeline</p>
        </div>
        <button className="btn-primary w-full sm:w-auto shadow-md shadow-brand-100" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add lead
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10 shadow-sm"
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
                'px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap shadow-sm border',
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
            <p className="text-gray-400 text-sm">Loading your leads…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-400 text-sm">
            No leads found matching your criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden shadow-sm">
              <div className="table-container">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold">Lead Details</th>
                      <th className="px-6 py-4 font-semibold">Company</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-center">Sentiment</th>
                      <th className="px-6 py-4 font-semibold">Last contacted</th>
                      <th className="px-6 py-4 font-semibold"></th>
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
                              <div className="text-gray-400 text-[11px]">{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{lead.company || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={clsx('badge', STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600')}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-lg" title={lead.sentiment || 'No sentiment data'}>
                          {lead.sentiment ? SENTIMENT_EMOJI[lead.sentiment] : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString() : 'Never'}
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
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filtered.map(lead => (
                <Link 
                  key={lead.id} 
                  href={`/dashboard/leads/${lead.id}`}
                  className="card p-4 active:scale-[0.98] transition-transform space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm uppercase">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{lead.name}</div>
                        <div className="text-gray-400 text-[11px]">{lead.email}</div>
                      </div>
                    </div>
                    <span className={clsx('badge text-[10px]', STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600')}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 size={12} className="text-gray-400" />
                      <span className="truncate">{lead.company || 'No company'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-end">
                      <span className="text-lg">{lead.sentiment ? SENTIMENT_EMOJI[lead.sentiment] : ''}</span>
                      <span className="capitalize">{lead.sentiment || 'No data'}</span>
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
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
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

      {/* Add Lead Modal */}
      {showModal && (
        <AddLeadModal onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </div>
  )
}

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', title: '', industry: '', source: 'manual', interest: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
      <div className="card w-full max-w-lg p-6 my-auto shadow-2xl border-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add new lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Full name *</label>
              <input className="input" placeholder="e.g. Sarah Connor" value={form.name} onChange={set('name')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email *</label>
              <input type="email" className="input" placeholder="sarah@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone *</label>
              <input className="input" placeholder="+1234567890" value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</label>
              <input className="input" placeholder="Acme Corp" value={form.company} onChange={set('company')} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Title</label>
              <input className="input" placeholder="VP of Sales" value={form.title} onChange={set('title')} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Industry</label>
              <input className="input" placeholder="Mortgage" value={form.industry} onChange={set('industry')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Interest / notes</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="Details about their needs..." value={form.interest} onChange={set('interest')} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary w-full sm:w-auto order-2 sm:order-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary w-full sm:w-auto order-1 sm:order-2 px-8" disabled={loading}>
              {loading ? 'Creating…' : 'Create lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
