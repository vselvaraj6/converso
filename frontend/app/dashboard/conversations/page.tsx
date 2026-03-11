'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLeads, type Lead } from '@/lib/api'
import { MessageSquare, Search } from 'lucide-react'
import clsx from 'clsx'

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: '😊',
  neutral:  '😐',
  negative: '😟',
}

export default function ConversationsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch contacted leads — they have conversations
    Promise.all([
      getLeads({ limit: 100, status: 'contacted' }),
      getLeads({ limit: 100, status: 'qualified' }),
      getLeads({ limit: 100, status: 'converted' }),
    ]).then(([c, q, cv]) => {
      const all = [...c.leads, ...q.leads, ...cv.leads]
      all.sort((a, b) => {
        const ta = a.last_contacted ? new Date(a.last_contacted).getTime() : 0
        const tb = b.last_contacted ? new Date(b.last_contacted).getTime() : 0
        return tb - ta
      })
      setLeads(all)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? leads.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()),
      )
    : leads

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-500 text-sm mt-1">Leads with active message threads</p>
      </div>

      <div className="relative max-w-sm mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search conversations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          No conversations yet. Conversations appear here once outreach starts.
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map(lead => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{lead.name}</span>
                  {lead.sentiment && (
                    <span title={lead.sentiment}>{SENTIMENT_EMOJI[lead.sentiment] || ''}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{lead.company || lead.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">
                  {lead.last_contacted
                    ? new Date(lead.last_contacted).toLocaleDateString()
                    : ''}
                </p>
                <span className={clsx(
                  'text-xs font-medium capitalize',
                  lead.status === 'qualified' ? 'text-purple-600' :
                  lead.status === 'converted' ? 'text-green-600' :
                  'text-gray-500',
                )}>
                  {lead.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
