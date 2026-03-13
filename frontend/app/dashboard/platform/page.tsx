'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { listCompanies, type CompanyStats } from '@/lib/api'
import { Building2, Users, Zap, Search, Plus, ExternalLink, ShieldCheck, TrendingUp, ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'

export default function PlatformAdminPage() {
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    listCompanies()
      .then(setCompanies)
      .finally(() => setLoading(false))
  }, [])

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  const totalLeads = companies.reduce((sum, c) => sum + c.lead_count, 0)
  const totalUsers = companies.reduce((sum, c) => sum + c.user_count, 0)

  if (loading) return <div className="p-8 text-sm font-bold text-gray-400">Loading platform data…</div>

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search companies..." 
              className="input pl-10 py-2 w-full md:w-64 text-sm font-bold"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary py-2 px-4 text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-100">
            <Plus size={18} /> New Client
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Clients" value={companies.length} icon={Building2} trend="+2 this week" />
        <StatCard title="Total Platform Users" value={totalUsers} icon={Users} trend="+12 this week" />
        <StatCard title="Managed Leads" value={totalLeads} icon={Zap} trend="+1.2k this week" />
      </div>

      {/* Companies List */}
      <div className="card overflow-hidden border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Active Tenants</h2>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filtered.length} total</span>
        </div>
        <div className="overflow-x-auto">
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
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
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
        </div>
      </div>
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
