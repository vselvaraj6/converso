'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLeads, createLead, type Lead } from '@/lib/api'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost']

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-gray-100 text-gray-600',
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
    const data = await getLeads({
      skip,
      limit: PAGE_SIZE,
      status: status === 'all' ? undefined : status,
    })
    setLeads(data.leads)
    setTotal(data.total)
    setLoading(false)
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="relative flex-1 lg:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                status === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No leads found.</div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 font-medium">Lead</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Company</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Sentiment</th>
                  <th className="px-6 py-3 font-medium">Last contact</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-gray-400 text-xs">{lead.email}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{lead.phone}</td>
                    <td className="px-6 py-3 text-gray-600">{lead.company || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={clsx('badge', STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600')}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 capitalize text-gray-600">{lead.sentiment || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn-secondary px-3 py-1.5"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={14} />
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="card w-full max-w-lg p-5 sm:p-6 my-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Add new lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full name *</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
              <input className="input" placeholder="+1234567890" value={form.phone} onChange={set('phone')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <input className="input" value={form.company} onChange={set('company')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={form.title} onChange={set('title')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
              <input className="input" value={form.industry} onChange={set('industry')} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Interest / notes</label>
              <input className="input" value={form.interest} onChange={set('interest')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
