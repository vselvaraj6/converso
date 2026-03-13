'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { listCompanies, getPlatformUsage, type CompanyStats } from '@/lib/api'
import { 
  Building2, 
  Users, 
  Zap, 
  Search, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart3, 
  Clock, 
  Activity, 
  Phone, 
  MessageCircle,
  LayoutGrid,
  Command,
  ArrowRight
} from 'lucide-react'
import clsx from 'clsx'

export default function PlatformAdminPage() {
  const [tab, setTab] = useState<'companies' | 'usage'>('companies')
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    if (tab === 'companies') {
      listCompanies()
        .then(setCompanies)
        .finally(() => setLoading(false))
    } else {
      getPlatformUsage()
        .then(setUsage)
        .finally(() => setLoading(false))
    }
  }, [tab])

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  const totalLeads = companies.reduce((sum, c) => sum + c.lead_count, 0)
  const totalUsers = companies.reduce((sum, c) => sum + c.user_count, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-white/5">
            <Command size={12} className="text-brand-400" />
            Platform Control
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            Command Center
          </h1>
          <p className="text-slate-500 text-sm font-medium">Global oversight of multi-tenant SaaS architecture and throughput.</p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-white rounded-[20px] shadow-xl shadow-slate-200/50 border border-slate-100">
          <button 
            onClick={() => setTab('companies')}
            className={clsx(
              "px-6 py-2.5 rounded-[14px] text-xs font-black transition-all duration-300 flex items-center gap-2", 
              tab === 'companies' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <LayoutGrid size={14} /> Clients
          </button>
          <button 
            onClick={() => setTab('usage')}
            className={clsx(
              "px-6 py-2.5 rounded-[14px] text-xs font-black transition-all duration-300 flex items-center gap-2", 
              tab === 'usage' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Activity size={14} /> Analytics
          </button>
        </div>
      </div>

      {tab === 'companies' ? (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StatCard 
              title="Active Tenants" 
              value={companies.length} 
              icon={Building2} 
              trend="+4.2%" 
              color="from-brand-500 to-indigo-600"
            />
            <StatCard 
              title="Global Users" 
              value={totalUsers} 
              icon={Users} 
              trend="+12.5%" 
              color="from-emerald-500 to-teal-600"
            />
            <StatCard 
              title="Total Activity" 
              value={totalLeads.toLocaleString()} 
              icon={Zap} 
              trend="+8.1%" 
              color="from-amber-500 to-orange-600"
            />
          </div>

          {/* Client Registry */}
          <div className="card overflow-hidden border-none shadow-2xl shadow-slate-200/60 bg-white/80 backdrop-blur-xl">
            <div className="px-8 py-6 border-b border-slate-50 bg-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-black text-slate-900 text-lg">Tenant Registry</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{filtered.length} Enterprise Clients</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filter by name or industry..." 
                    className="bg-slate-100/50 border-transparent rounded-[18px] pl-11 pr-6 py-2.5 text-xs font-bold w-full md:w-72 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button className="bg-slate-900 text-white h-10 px-5 rounded-[18px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-200 transition-all active:scale-95">
                  <Plus size={16} strokeWidth={3} /> Register
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Querying Cloud Data…</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                      <th className="px-8 py-5">Corporate Identity</th>
                      <th className="px-8 py-5">Industry Sector</th>
                      <th className="px-8 py-5 text-center">Personnel</th>
                      <th className="px-8 py-5 text-center">Activity</th>
                      <th className="px-8 py-5">Onboarded</th>
                      <th className="px-8 py-5 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(company => (
                      <tr key={company.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-black text-lg shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                              {company.name.charAt(0)}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-black text-slate-900 text-[15px] group-hover:text-brand-600 transition-colors">{company.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">{company.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider border border-slate-200/50">
                            {company.industry || 'General'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100">
                            <Users size={12} /> {company.user_count}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-black border border-amber-100">
                            <Zap size={12} className="fill-amber-500" /> {company.lead_count.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(company.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link 
                            href={`/dashboard/platform/companies/${company.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-brand-600 font-black text-[11px] uppercase tracking-widest hover:bg-brand-50 transition-all active:scale-95"
                          >
                            Manage <ArrowRight size={14} strokeWidth={3} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Channel Metrics */}
            <div className="card p-8 border-none shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest">
                  <Activity size={20} className="text-brand-500" /> Channel Volume
                </h3>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <BarChart3 size={14} />
                </div>
              </div>
              <div className="space-y-6">
                <UsageMetric label="SMS Outreach" value={usage?.channels?.sms || 0} icon={MessageCircle} color="bg-blue-500" sub="Twilio API" />
                <UsageMetric label="AI Voice Calls" value={usage?.channels?.voice || 0} icon={Phone} color="bg-brand-500" sub="VAPI Hub" />
                <UsageMetric label="OpenAI Computes" value={(usage?.channels?.sms || 0) + (usage?.channels?.voice || 0)} icon={Zap} color="bg-amber-500" sub="GPT-4 Inference" />
              </div>
            </div>

            {/* High Capacity Tenants */}
            <div className="card p-8 border-none shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest">
                  <TrendingUp size={20} className="text-emerald-500" /> High Activity
                </h3>
                <Link href="#" className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">View All</Link>
              </div>
              <div className="space-y-5">
                {usage?.top_ten_companies?.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-300">#{i+1}</span>
                      <span className="text-sm font-black text-slate-700 group-hover:text-brand-600 transition-colors">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{c.count.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                    </div>
                  </div>
                ))}
                {!usage?.top_ten_companies?.length && <p className="text-xs text-slate-400 italic text-center py-10">Initializing platform metrics…</p>}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="card p-10 border-none shadow-2xl">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest">
                  <Activity size={20} className="text-brand-500" /> Platform Throughput
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-8">Rolling 7-day volume history</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compute Units</span>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between h-64 gap-4 px-4">
              {usage?.volume_history?.map((day: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                  <div className="w-full flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-[10px] font-black text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0 duration-300">
                      {day.count}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-brand-600/80 to-brand-400 rounded-2xl relative shadow-[0_4px_20px_rgba(124,58,237,0.1)] group-hover:shadow-[0_10px_30px_rgba(124,58,237,0.3)] group-hover:-translate-y-1 transition-all duration-500"
                      style={{ height: `${Math.max((day.count / (usage.volume_history.reduce((m:any, d:any) => Math.max(m, d.count), 1))) * 180, 8)}px` }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                </div>
              ))}
              {!usage?.volume_history?.length && <div className="w-full text-center text-slate-300 font-black uppercase text-[10px] tracking-widest py-20">Awaiting usage data streams…</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string; value: any; icon: any; trend: string; color: string }) {
  return (
    <div className="card p-8 border-none shadow-2xl relative overflow-hidden group hover:-translate-y-2 duration-500 bg-white">
      <div className={clsx("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br", color)} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={clsx("w-14 h-14 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 bg-gradient-to-br shadow-slate-200", color)}>
            <Icon size={28} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-100 shadow-sm">
            <TrendingUp size={12} strokeWidth={3} /> {trend}
          </span>
        </div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

function UsageMetric({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: any; color: string; sub: string }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex items-center gap-5">
        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500", color)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-[13px] font-black text-slate-900 tracking-tight">{label}</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-lg font-black text-slate-900">{value.toLocaleString()}</span>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Requests</p>
      </div>
    </div>
  )
}
