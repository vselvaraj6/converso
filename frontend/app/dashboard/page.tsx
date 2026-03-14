'use client'
import { useEffect, useState } from 'react'
import { getStoredUser, listCompanies, getLeads, getMeetings, type Lead, type Meeting } from '@/lib/api'
import { 
  Users, 
  Zap, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  ArrowUpRight, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  Activity,
  Command,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredUser())
    Promise.all([
      getLeads({ limit: 5 }),
      getMeetings({ limit: 5, upcoming_only: true })
    ]).then(([l, m]) => {
      setLeads(l.leads)
      setMeetings(m.meetings)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Syncing Hub Data…</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-brand-500/20">
          <Activity size={12} />
          Systems Online
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight leading-none">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm font-medium">Your AI agents have processed <span className="text-brand-400 font-bold">12 new leads</span> since your last login.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Leads" value={leads.length} icon={Users} color="from-brand-500 to-indigo-600" trend="+12%" />
        <StatCard title="Meetings" value={meetings.length} icon={CalendarIcon} color="from-emerald-500 to-teal-600" trend="+4" />
        <StatCard title="Conversion" value="24%" icon={Zap} color="from-amber-500 to-orange-600" trend="+2.1%" />
        <StatCard title="Response Time" value="1.2m" icon={Clock} color="from-rose-500 to-pink-600" trend="-15%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden border-none shadow-2xl">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h2 className="font-black text-white text-base uppercase tracking-widest flex items-center gap-2">
                <Users size={18} className="text-brand-400" /> Recent Activity
              </h2>
              <Link href="/dashboard/leads" className="text-[10px] font-black text-brand-400 uppercase tracking-widest hover:text-brand-300 transition-colors flex items-center gap-1">
                View Pipeline <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {leads.map(lead => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between p-6 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-300 font-black group-hover:scale-110 duration-300">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{lead.name}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{lead.company || 'Private'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={clsx("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", 
                      lead.status === 'new' ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-800 text-slate-400')}>
                      {lead.status}
                    </span>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="space-y-6">
          <div className="card overflow-hidden border-none shadow-2xl bg-brand-600/5">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-black text-white text-base uppercase tracking-widest">Agenda</h2>
              <CalendarIcon size={18} className="text-brand-400" />
            </div>
            <div className="p-6 space-y-4">
              {meetings.map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-white leading-tight">{m.title}</p>
                    <span className="text-[10px] font-black text-brand-400">
                      {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{m.lead.name}</p>
                </div>
              ))}
              {meetings.length === 0 && (
                <p className="text-center py-10 text-xs text-slate-500 font-bold italic">No meetings scheduled for today.</p>
              )}
            </div>
          </div>

          <div className="card p-8 bg-slate-900 border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 blur-[60px] opacity-20" />
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-2">Platform Health</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All services operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, trend }: { title: string; value: any; icon: any; color: string; trend: string }) {
  return (
    <div className="card p-8 border-none shadow-2xl relative overflow-hidden group hover:-translate-y-1 duration-500 bg-slate-900/40">
      <div className={clsx("absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br", color)} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:rotate-6 bg-gradient-to-br", color)}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
            {trend}
          </span>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
}
