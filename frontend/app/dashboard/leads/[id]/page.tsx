'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getLead, getLeadMessages, type LeadDetail, type Message } from '@/lib/api'
import { ArrowLeft, Phone, Mail, Building2, MessageSquare, Calendar, Tag } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-gray-100 text-gray-600',
}

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

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getLead(id), getLeadMessages(id)]).then(([l, m]) => {
      setLead(l)
      setMessages([...m.messages].reverse()) // chronological
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading…</div>
  }
  if (!lead) {
    return <div className="text-red-500 text-sm">Lead not found.</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={14} /> Back to leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{lead.name}</h1>
                {lead.title && <p className="text-sm text-gray-500 truncate">{lead.title}</p>}
              </div>
              <span className={clsx('badge shrink-0', STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600')}>
                {lead.status}
              </span>
            </div>
            <div className="space-y-3">
              <InfoRow icon={Mail}      label="Email"    value={lead.email} />
              <InfoRow icon={Phone}     label="Phone"    value={lead.phone} />
              <InfoRow icon={Building2} label="Company"  value={lead.company} />
              <InfoRow icon={Tag}       label="Industry" value={lead.industry} />
              <InfoRow icon={MessageSquare} label="Interest" value={lead.interest} />
              <InfoRow icon={Calendar}  label="Source"   value={lead.source} />
            </div>
          </div>

          {/* AI insights */}
          {lead.sentiment_score && Object.keys(lead.sentiment_score).length > 0 && (
            <div className="card p-5 md:p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider text-xs">AI Insights</h3>
              <div className="space-y-2">
                {lead.sentiment_score.latest && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sentiment</span>
                    <span className={clsx('font-medium capitalize', SENTIMENT_COLORS[lead.sentiment_score.latest] ?? 'text-gray-700')}>
                      {lead.sentiment_score.latest}
                    </span>
                  </div>
                )}
                {lead.sentiment_score.intent && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Intent</span>
                    <span className="font-medium text-gray-700 capitalize">
                      {lead.sentiment_score.intent.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {lead.sentiment_score.urgency && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Urgency</span>
                    <span className="font-medium text-gray-700 capitalize">{lead.sentiment_score.urgency}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="card p-5 md:p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider text-xs">Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Lead score</span>
                <span className="font-medium">{lead.lead_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Call attempts</span>
                <span className="font-medium">{lead.call_attempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last contact</span>
                <span className="font-medium">
                  {lead.last_contacted
                    ? new Date(lead.last_contacted).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Via</span>
                <span className="font-medium capitalize">{lead.last_contact_method || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2 card flex flex-col h-[500px] lg:h-auto lg:max-h-[80vh]">
          <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Conversation</h2>
            <span className="text-xs text-gray-400">({messages.length} messages)</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No messages yet. Outreach will start automatically.</p>
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
                      'max-w-[85%] lg:max-w-md rounded-2xl px-4 py-2.5 text-sm',
                      msg.direction === 'outbound'
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={clsx(
                      'text-[10px] mt-1 opacity-70',
                      msg.direction === 'outbound' ? 'text-white' : 'text-gray-500',
                    )}>
                      {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} · {msg.channel}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
