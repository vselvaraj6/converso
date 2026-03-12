'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getLead, getLeadMessages, updateLead, deleteLead, type LeadDetail, type Message } from '@/lib/api'
import { ArrowLeft, Phone, Mail, Building2, MessageSquare, Calendar, Tag, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-gray-100 text-gray-600',
}

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost']

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-green-600',
  neutral:  'text-gray-500',
  negative: 'text-red-500',
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function AIInsights({ lead }: { lead: LeadDetail }) {
  if (!lead.sentiment_score || Object.keys(lead.sentiment_score).length === 0) return null
  return (
    <div className="card p-5 md:p-6 shadow-sm border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[10px]">AI Insights</h3>
      <div className="space-y-2">
        {lead.sentiment_score.latest && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Sentiment</span>
            <span className={clsx('font-bold capitalize', SENTIMENT_COLORS[lead.sentiment_score.latest] ?? 'text-gray-700')}>
              {lead.sentiment_score.latest}
            </span>
          </div>
        )}
        {lead.sentiment_score.intent && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Intent</span>
            <span className="font-bold text-gray-700 capitalize text-right">
              {lead.sentiment_score.intent.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        {lead.sentiment_score.urgency && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Urgency</span>
            <span className="font-bold text-gray-700 capitalize">{lead.sentiment_score.urgency}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Activity({ lead }: { lead: LeadDetail }) {
  return (
    <div className="card p-5 md:p-6 shadow-sm border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[10px]">Activity</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Lead score</span>
          <span className="font-bold">{lead.lead_score}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Call attempts</span>
          <span className="font-bold">{lead.call_attempts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Last contact</span>
          <span className="font-bold">
            {lead.last_contacted
              ? new Date(lead.last_contacted).toLocaleDateString()
              : 'Never'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Via</span>
          <span className="font-bold capitalize">{lead.last_contact_method || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Created</span>
          <span className="font-bold">{new Date(lead.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [l, m] = await Promise.all([getLead(id), getLeadMessages(id)])
      setLead(l)
      setMessages([...m.messages].reverse())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  async function handleStatusChange(newStatus: string) {
    if (!lead || updating) return
    setUpdating(true)
    try {
      await updateLead(id, { status: newStatus })
      setLead({ ...lead, status: newStatus })
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this lead? This will also remove all conversation history.')) return
    try {
      await deleteLead(id)
      router.push('/dashboard/leads')
    } catch (err) {
      alert('Failed to delete lead')
    }
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>
  if (!lead) return <div className="text-red-500 text-sm">Lead not found.</div>

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header / Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft size={14} /> Back to leads
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowEditModal(true)}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button 
            onClick={handleDelete}
            className="btn-secondary py-1.5 px-3 text-xs text-red-600 hover:bg-red-50 border-red-100"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead info */}
        <div className="lg:col-span-1 space-y-4 order-1">
          <div className="card p-5 md:p-6 shadow-sm border-gray-100">
            <div className="mb-5">
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{lead.name}</h1>
                  {lead.title && <p className="text-sm text-gray-500 truncate">{lead.title}</p>}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                <select 
                  value={lead.status}
                  disabled={updating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={clsx(
                    'block w-full rounded-xl border-none text-sm font-bold py-2.5 px-4 shadow-sm focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer',
                    STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt} className="bg-white text-gray-900 capitalize">{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              <InfoRow icon={Mail}      label="Email"    value={lead.email} />
              <InfoRow icon={Phone}     label="Phone"    value={lead.phone} />
              <InfoRow icon={Building2} label="Company"  value={lead.company} />
              <InfoRow icon={Tag}       label="Industry" value={lead.industry} />
              <InfoRow icon={MessageSquare} label="Interest" value={lead.interest} />
              <InfoRow icon={Calendar}  label="Source"   value={lead.source} />
            </div>
          </div>

          <div className="hidden lg:block space-y-4">
            <AIInsights lead={lead} />
            <Activity lead={lead} />
          </div>
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2 card flex flex-col h-[500px] lg:h-full lg:min-h-[600px] order-2 shadow-sm border-gray-100 overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <MessageSquare size={16} />
              </div>
              <h2 className="font-bold text-gray-900">Conversation</h2>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg">
              {messages.length} messages
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">No messages yet.</p>
                <p className="text-gray-300 text-xs mt-1">Outreach will start automatically based on campaign rules.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex',
                    msg.direction === 'outbound' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-[85%] lg:max-w-md rounded-2xl px-4 py-3 text-sm shadow-sm',
                      msg.direction === 'outbound'
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none',
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                      <span className={clsx(
                        'text-[9px] font-bold uppercase tracking-widest',
                        msg.direction === 'outbound' ? 'text-brand-100' : 'text-gray-400',
                      )}>
                        {msg.channel} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Insights & Activity - Mobile Only */}
        <div className="lg:hidden space-y-4 order-3 pb-8">
          <AIInsights lead={lead} />
          <Activity lead={lead} />
        </div>
      </div>

      {showEditModal && (
        <EditLeadModal 
          lead={lead} 
          onClose={() => setShowEditModal(false)} 
          onUpdated={(updated) => {
            setLead({ ...lead, ...updated })
            setShowEditModal(false)
          }} 
        />
      )}
    </div>
  )
}

function EditLeadModal({ lead, onClose, onUpdated }: { 
  lead: LeadDetail; 
  onClose: () => void; 
  onUpdated: (lead: Partial<LeadDetail>) => void 
}) {
  const [form, setForm] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    title: lead.title || '',
    industry: lead.industry || '',
    interest: lead.interest || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: any) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await updateLead(lead.id, form)
      onUpdated(form)
    } catch (err: any) {
      setError(err.message || 'Failed to update lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg p-6 my-auto shadow-2xl border-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full name</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company</label>
              <input className="input" value={form.company} onChange={set('company')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
              <input className="input" value={form.title} onChange={set('title')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Industry</label>
              <input className="input" value={form.industry} onChange={set('industry')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interest / notes</label>
              <textarea className="input min-h-[80px] resize-none" value={form.interest} onChange={set('interest')} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary w-full sm:w-auto px-8" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
