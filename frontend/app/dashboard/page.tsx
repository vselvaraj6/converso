'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLeads, getStoredUser, type Lead } from '@/lib/api'
import { Users, TrendingUp, PhoneCall, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-gray-100 text-gray-600',
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = getStoredUser()
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeads({ limit: 10 }).then(data => {
      setLeads(data.leads)
      setTotal(data.total)
    }).finally(() => setLoading(false))
  }, [])

  const byStatus = (s: string) => leads.filter(l => l.status === s).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your leads today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total leads"   value={total}             icon={Users}       color="bg-brand-100 text-brand-700" />
        <StatCard label="New"           value={byStatus('new')}   icon={Clock}       color="bg-blue-100 text-blue-700" />
        <StatCard label="Qualified"     value={byStatus('qualified')} icon={TrendingUp} color="bg-purple-100 text-purple-700" />
        <StatCard label="Converted"     value={byStatus('converted')} icon={CheckCircle} color="bg-green-100 text-green-700" />
      </div>

      {/* Recent leads */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent leads</h2>
          <Link href="/dashboard/leads" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No leads yet.{' '}
            <Link href="/dashboard/leads" className="text-brand-600 hover:underline">Add your first lead →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Last contact</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-gray-400 text-xs">{lead.email}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{lead.company || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={clsx('badge', STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600')}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {lead.last_contacted
                      ? new Date(lead.last_contacted).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/leads/${lead.id}`} className="text-brand-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
