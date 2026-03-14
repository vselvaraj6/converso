'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getLead, getLeadMessages, updateLead, deleteLead, getStoredUser, initiateVoiceCall, type LeadDetail, type Message } from '@/lib/api'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Building2, 
  MessageSquare, 
  Calendar, 
  Tag, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Mic,
  Play,
  FileText,
  Zap,
  MoreVertical,
  Activity as ActivityIcon
} from 'lucide-react'
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
  positive: 'text-emerald-600',
  neutral:  'text-slate-500',
  negative: 'text-amber-600',
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm text-slate-800 font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [calling, setCalling] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  async function load() {
    setUser(getStoredUser())
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

  const canWrite = user?.role === 'admin' || user?.role === 'write' || user?.is_superuser

  async function handleStatusChange(newStatus: string) {
    if (!lead || updating || !canWrite) return
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

  async function handleStartCall() {
    if (!canWrite || calling) return
    setCalling(true)
    try {
      await initiateVoiceCall(id)
      alert('AI Voice Call initiated. You will see the transcript here once finished.')
      load() // Refresh to show initiation message
    } catch (err: any) {
      alert(`Call failed: ${err.message}`)
    } finally {
      setCalling(false)
    }
  }

  async function handleDelete() {
    if (!canWrite) return
    if (!confirm('Are you sure you want to delete this lead? This will also remove all conversation history.')) return
    try {
      await deleteLead(id)
      router.push('/dashboard/leads')
    } catch (err) {
      alert('Failed to delete lead')
    }
  }

  if (loading) return <div className="text-slate-400 text-sm p-8 font-black uppercase tracking-widest text-center py-20">Decrypting lead intel…</div>
  if (!lead) return <div className="text-red-500 text-sm p-8 font-bold">Lead profile not found.</div>

  return (
    <div className="max-w-6xl mx-auto pb-20 font-sans">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{lead.name}</h1>
              <span className={clsx('badge border-none px-3 py-1 rounded-lg text-[10px] font-black', STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600')}>
                {lead.status}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">{lead.company || 'Private Sector'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <button 
                onClick={handleStartCall}
                disabled={calling}
                className="bg-brand-600 text-white h-11 px-6 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-200 transition-all active:scale-95 shadow-lg shadow-brand-100"
              >
                {calling ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mic size={18} />}
                Start AI Call
              </button>
              <button 
                onClick={() => setShowEditModal(true)}
                className="btn-secondary h-11 px-5 border-slate-200 text-slate-600"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={handleDelete}
                className="btn-secondary h-11 px-5 border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-100"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6 order-1">
          <div className="card p-8 bg-white border-none shadow-2xl shadow-slate-200/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-4 flex items-center gap-2">
              <Zap size={14} className="text-brand-500" /> Profiling Data
            </h3>
            
            <div className="space-y-6">
              <InfoRow icon={Mail}      label="Email"    value={lead.email} />
              <InfoRow icon={Phone}     label="Mobile"   value={lead.phone} />
              <InfoRow icon={Building2} label="Company"  value={lead.company} />
              <InfoRow icon={Tag}       label="Sector"   value={lead.industry} />
              <InfoRow icon={MessageSquare} label="Interest" value={lead.interest} />
              <InfoRow icon={Clock}     label="Cycle"    value={lead.nudge_interval_days ? `${lead.nudge_interval_days} days` : 'Not set'} />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Update Pipeline</label>
              <select 
                value={lead.status}
                disabled={updating || !canWrite}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={clsx(
                  'block w-full rounded-[18px] border-none text-xs font-black uppercase tracking-widest py-3 px-4 shadow-inner bg-slate-50 focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer appearance-none',
                  !canWrite && 'opacity-70 cursor-not-allowed'
                )}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt} className="bg-white text-slate-900">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Insights Card */}
          {lead.sentiment_score && (
            <div className="card p-8 bg-slate-900 border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 blur-[80px] opacity-30" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 relative z-10">AI Insights Core</h3>
              
              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">Sentiment</span>
                  <span className={clsx('text-xs font-black uppercase tracking-widest', SENTIMENT_COLORS[lead.sentiment_score.latest] ?? 'text-white')}>
                    {lead.sentiment_score.latest || 'Neutral'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">Buying Intent</span>
                  <span className="text-xs font-black text-white uppercase tracking-widest">
                    {lead.sentiment_score.intent?.replace(/_/g, ' ') || 'Assessing'}
                  </span>
                </div>
                <div className="pt-4 mt-2 border-t border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">Lead Health</span>
                    <span className="text-xs font-black text-brand-400">{lead.lead_score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${lead.lead_score}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Feed */}
        <div className="lg:col-span-2 card flex flex-col h-[600px] lg:h-full lg:min-h-[750px] order-2 border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-inner">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-lg">Communication Hub</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{messages.length} Live Interactions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <ActivityIcon size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/30 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                  <Zap size={32} className="text-slate-300" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Awaiting Engagement</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-[200px] font-medium leading-relaxed">The AI will initiate outreach automatically based on your pipeline rules.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex transition-all duration-500 animate-in fade-in slide-in-from-bottom-2',
                    msg.direction === 'outbound' ? 'justify-end' : 'justify-start',
                  )}
                >
                  {msg.channel === 'voice' ? (
                    <div className="w-full max-w-xl bg-slate-900 rounded-[28px] p-6 shadow-2xl relative overflow-hidden border border-white/5 group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600 blur-[60px] opacity-20" />
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                          <Mic size={20} className="text-brand-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">AI Voice Dispatch</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">Status: {msg.status || 'Archived'}</p>
                        </div>
                      </div>
                      
                      {msg.transcript && (
                        <div className="bg-white/5 rounded-2xl p-4 mb-4 relative z-10 border border-white/5">
                          <p className="text-slate-300 text-xs italic leading-relaxed line-clamp-3">"{msg.transcript}"</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/5">
                        <div className="flex gap-3">
                          {msg.recording_url && (
                            <a href={msg.recording_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-brand-400 transition-all">
                              <Play size={12} fill="currentColor" /> Play Audio
                            </a>
                          )}
                          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
                            <FileText size={12} /> Transcript
                          </button>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{msg.duration_seconds ? `${msg.duration_seconds}s` : 'Call Ended'}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        'max-w-[85%] lg:max-w-md rounded-[24px] px-6 py-4 shadow-2xl relative transition-all duration-300',
                        msg.direction === 'outbound'
                          ? 'bg-slate-900 text-white rounded-br-none shadow-slate-300/20'
                          : 'bg-white border border-slate-100 text-slate-900 rounded-bl-none shadow-slate-200/40',
                      )}
                    >
                      <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={clsx(
                        'flex items-center justify-between mt-4 pt-3 border-t',
                        msg.direction === 'outbound' ? 'border-white/10' : 'border-slate-50'
                      )}>
                        <span className={clsx(
                          'text-[9px] font-black uppercase tracking-[0.2em]',
                          msg.direction === 'outbound' ? 'text-brand-400' : 'text-slate-400',
                        )}>
                          {msg.channel} Dispatch
                        </span>
                        <span className="text-[9px] font-black text-slate-500 uppercase">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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
  onUpdated: (lead: any) => void 
}) {
  const [form, setForm] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    title: lead.title || '',
    industry: lead.industry || '',
    interest: lead.interest || '',
    nudge_interval_days: lead.nudge_interval_days || 2,
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
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-100 animate-in zoom-in duration-300 my-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Edit Intelligence</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Update lead parameters</p>
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
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</label>
              <input className="input" value={form.company} onChange={set('company')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nudge Interval (Days)</label>
              <input type="number" className="input" min="1" max="30" value={form.nudge_interval_days} onChange={set('nudge_interval_days')} />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" className="btn-secondary flex-1 font-black uppercase text-[11px] tracking-widest" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-[2] font-black uppercase text-[11px] tracking-widest" disabled={loading}>
              {loading ? 'Processing…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
