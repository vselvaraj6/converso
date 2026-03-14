'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLeads, type Lead } from '@/lib/api'
import { 
  MessageSquare, 
  Search, 
  ChevronRight, 
  Clock, 
  Activity, 
  Zap, 
  Mic, 
  Phone,
  User as UserIcon,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  neutral:  'bg-slate-800 text-slate-400 border-white/5',
  negative: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default function ConversationsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeads({ limit: 100 })
      .then(d => setLeads(d.leads.filter(l => l.last_contacted)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.company ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Interpreting Comms Streams…</div>

  return (
    <div className="max-w-5xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-blue-500/20">
            <Activity size={12} />
            Transmission Center
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none">
            Messages
          </h1>
          <p className="text-slate-500 text-sm font-medium">Real-time oversight of all AI and manual lead interactions.</p>
        </div>

        <div className="relative group w-full md:w-72">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            className="w-full backdrop-blur-xl border rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
            placeholder="Filter transmissions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-20 text-center space-y-4 border-dashed border-2 bg-transparent shadow-none" style={{ borderColor: 'var(--divider)' }}>
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
            <MessageSquare size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-widest">Quiet Channels</h3>
            <p className="text-slate-500 text-sm font-medium">No active conversations found matching your filter.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(lead => (
            <ConversationRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConversationRow({ lead }: { lead: Lead }) {
  return (
    <Link 
      href={`/dashboard/leads/${lead.id}`}
      className="card group p-6 border-none shadow-2xl hover:-translate-y-1 duration-500 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500 blur-[60px] opacity-5 group-hover:opacity-10 transition-opacity" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl border flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-110 duration-500" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--divider)', color: 'var(--text-secondary)' }}>
            {lead.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[var(--text-primary)] leading-tight group-hover:text-brand-400 transition-colors">{lead.name}</h3>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lead.company || 'Private'}</p>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-slate-600" />
                <p className="text-[10px] font-black text-slate-500 uppercase">
                  {lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 md:justify-center">
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--divider)' }}>
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            <p className="text-xs font-bold text-slate-400 line-clamp-1 max-w-[300px]">
              AI: "Perfect! I've booked that for you for..."
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={clsx("badge border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest", SENTIMENT_COLORS[lead.sentiment || 'neutral'])}>
            {lead.sentiment || 'Analyzing'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-brand-600 transition-all duration-500">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </Link>
  )
}
