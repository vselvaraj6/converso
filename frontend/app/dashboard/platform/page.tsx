'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { listCompanies, getPlatformUsage, type CompanyStats } from '@/lib/api'
import { Building2, Users, Zap, Search, Plus, ExternalLink, ShieldCheck, TrendingUp, ArrowUpRight, BarChart3, Clock, Activity, Phone, MessageCircle } from 'lucide-react'
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
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-brand-600" size={32} />
            Platform Admin
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium italic">Manage tenants, users, and global platform performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-100 rounded-xl mr-2">
            <button 
              onClick={() => setTab('companies')}
              className={clsx("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", tab === 'companies' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Clients
            </button>
            <button 
              onClick={() => setTab('usage')}
              className={clsx("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", tab === 'usage' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Usage & Billing
            </button>
          </div>
          <button className="btn-primary py-2 px-4 text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-100">
            <Plus size={18} /> New Client
          </button>
        </div>
      </div>

      {tab === 'companies' ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="Total Clients" value={companies.length} icon={Building2} trend="+2 this week" />
            <StatCard title="Total Platform Users" value={totalUsers} icon={Users} trend="+12 this week" />
            <StatCard title="Managed Leads" value={totalLeads} icon={Zap} trend="+1.2k this week" />
          </div>

          {/* Companies List */}
          <div className="card overflow-hidden border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter clients..." 
                  className="bg-white border-gray-200 rounded-lg pl-9 py-1.5 text-xs font-bold focus:ring-brand-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filtered.length} total</span>
            </div>
            <div className="overflow-x-auto">
              {loading ? <div className="p-12 text-center text-gray-400 font-bold text-sm">Loading tenants…</div> : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Industry</th>
                      <th className="px-6 py-4 text-center">Users</th>
                      <th className="px-6 py-4 text-center">Leads</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-black text-sm shadow-sm">
                              {company.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{company.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{company.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-tight shadow-sm">
                            {company.industry || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-gray-900">{company.user_count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-bold text-gray-900">
                            <Zap size={12} className="text-amber-500 fill-amber-500" />
                            {company.lead_count.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-gray-500">
                            {new Date(company.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={`/dashboard/platform/companies/${company.id}`}
                            className="inline-flex items-center gap-1 text-brand-600 font-bold text-xs hover:underline"
                          >
                            Manage <ArrowUpRight size={14} />
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
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Channel Usage */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={18} className="text-brand-600" /> Volume by Channel
              </h3>
              <div className="space-y-4">
                <UsageRow label="SMS (Twilio)" value={usage?.channels?.sms || 0} icon={MessageCircle} color="bg-blue-500" />
                <UsageRow label="Voice (VAPI)" value={usage?.channels?.voice || 0} icon={Phone} color="bg-brand-500" />
                <UsageRow label="AI API Calls" value={(usage?.channels?.sms || 0) + (usage?.channels?.voice || 0)} icon={Zap} color="bg-amber-500" />
              </div>
            </div>

            {/* Top Companies */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600" /> Top Active Tenants
              </h3>
              <div className="space-y-4">
                {usage?.top_ten_companies?.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-300">#{i+1}</span>
                      <span className="text-sm font-bold text-gray-700">{c.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{c.count} msgs</span>
                  </div>
                ))}
                {!usage?.top_ten_companies?.length && <p className="text-xs text-gray-400 italic">No usage data yet.</p>}
              </div>
            </div>
          </div>

          {/* Daily Volume (Simple Bar Chart) */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-8 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-600" /> Platform Throughput (Last 7 Days)
            </h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {usage?.volume_history?.map((day: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-brand-100 group-hover:bg-brand-500 transition-colors rounded-t-lg relative"
                    style={{ height: `${Math.max((day.count / (usage.volume_history.reduce((m:any, d:any) => Math.max(m, d.count), 1))) * 100, 5)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.count} msgs
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 rotate-45 sm:rotate-0 mt-2">{day.date.split('-').slice(1).join('/')}</span>
                </div>
              ))}
              {!usage?.volume_history?.length && <div className="w-full text-center text-gray-400 font-bold">No history available</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: any; icon: any; trend: string }) {
  return (
    <div className="card p-6 shadow-sm border-gray-100 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
          <TrendingUp size={10} /> {trend}
        </span>
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{value}</h3>
    </div>
  )
}

function UsageRow({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm", color)}>
          <Icon size={16} />
        </div>
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-900">{value.toLocaleString()}</span>
    </div>
  )
}

import { MessageCircle } from 'lucide-react'
