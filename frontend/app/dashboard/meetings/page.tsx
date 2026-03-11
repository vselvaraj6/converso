'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMeetings, type Meeting } from '@/lib/api'
import { Calendar, Clock, MapPin, Video, Phone, User, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  confirmed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDuration(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

function isThisWeek(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return d.getTime() - now.getTime() < weekMs
}

function LocationIcon({ location }: { location: string | null }) {
  if (!location) return <MapPin size={14} className="text-gray-400" />
  const l = location.toLowerCase()
  if (l.includes('meet') || l.includes('zoom') || l.includes('teams') || l.includes('call'))
    return <Video size={14} className="text-brand-500" />
  if (l.includes('phone')) return <Phone size={14} className="text-blue-500" />
  return <MapPin size={14} className="text-gray-400" />
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const today = isToday(meeting.start_time)
  return (
    <div className={clsx(
      'card p-5 flex gap-5 transition-shadow hover:shadow-md',
      today && 'border-brand-300 ring-1 ring-brand-200',
    )}>
      {/* Date column */}
      <div className={clsx(
        'w-14 shrink-0 rounded-xl flex flex-col items-center justify-center py-2 text-center',
        today ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700',
      )}>
        <span className="text-xs font-medium uppercase">
          {new Date(meeting.start_time).toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span className="text-2xl font-bold leading-none">
          {new Date(meeting.start_time).getDate()}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{meeting.title}</h3>
              {today && (
                <span className="badge bg-brand-100 text-brand-700 text-xs">Today</span>
              )}
              <span className={clsx('badge', STATUS_COLORS[meeting.status] ?? 'bg-gray-100 text-gray-600')}>
                {meeting.status}
              </span>
            </div>
            {meeting.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{meeting.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
            <span className="text-gray-400">({formatDuration(meeting.start_time, meeting.end_time)})</span>
          </span>

          {meeting.location && (
            <span className="flex items-center gap-1">
              <LocationIcon location={meeting.location} />
              {meeting.location}
            </span>
          )}

          <span className="flex items-center gap-1">
            <User size={14} />
            <Link
              href={`/dashboard/leads/${meeting.lead.id}`}
              className="text-brand-600 hover:underline"
            >
              {meeting.lead.name}
            </Link>
            {meeting.lead.company && (
              <span className="text-gray-400">· {meeting.lead.company}</span>
            )}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end justify-between shrink-0 gap-2">
        {meeting.meeting_link && (
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs px-3 py-1.5"
          >
            <Video size={13} /> Join
          </a>
        )}
        <Link
          href={`/dashboard/leads/${meeting.lead.id}`}
          className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-0.5"
        >
          Lead <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings(!showAll).then(d => setMeetings(d.meetings)).finally(() => setLoading(false))
  }, [showAll])

  const todayMeetings = meetings.filter(m => isToday(m.start_time))
  const thisWeek = meetings.filter(m => !isToday(m.start_time) && isThisWeek(m.start_time))
  const later = meetings.filter(m => !isThisWeek(m.start_time))

  function Group({ title, items }: { title: string; items: Meeting[] }) {
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        {items.map(m => <MeetingCard key={m.id} meeting={m} />)}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meetings.length} {showAll ? 'total' : 'upcoming'}
          </p>
        </div>
        <button
          className="btn-secondary text-sm"
          onClick={() => { setShowAll(v => !v); setLoading(true) }}
        >
          {showAll ? 'Show upcoming only' : 'Show all'}
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : meetings.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No meetings scheduled</p>
          <p className="text-gray-400 text-sm mt-1">
            Meetings are booked automatically when a lead replies with booking intent.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <Group title="Today" items={todayMeetings} />
          <Group title="This week" items={thisWeek} />
          <Group title="Later" items={later} />
        </div>
      )}
    </div>
  )
}
