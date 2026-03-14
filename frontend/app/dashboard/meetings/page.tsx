'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMeetings, type Meeting } from '@/lib/api'
import { Calendar, Clock, MapPin, Video, Phone, User, ChevronRight, Activity, ArrowRight, VideoOff, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

const isToday = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

const isThisWeek = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings({ upcoming_only: !showAll }).then(d => setMeetings(d.meetings)).finally(() => setLoading(false))
  }, [showAll])

  const todayMeetings = meetings.filter(m => isToday(m.start_time))
  const thisWeek = meetings.filter(m => !isToday(m.start_time) && isThisWeek(m.start_time))
  const later = meetings.filter(m => !isThisWeek(m.start_time))

  if (loading) return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Decrypting Calendar Streams…</div>

  return (
    <div className="max-w-5xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-emerald-500/20">
            <Activity size={12} />
            Live Schedule
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Your Agenda
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage your confirmed appointments and virtual discovery sessions.</p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-slate-900/50 backdrop-blur-xl rounded-[20px] border border-white/5">
          <button 
            onClick={() => setShowAll(false)}
            className={clsx(
              "px-6 py-2.5 rounded-[14px] text-xs font-black transition-all duration-300", 
              !showAll ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setShowAll(true)}
            className={clsx(
              "px-6 py-2.5 rounded-[14px] text-xs font-black transition-all duration-300", 
              showAll ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            All History
          </button>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="card p-20 text-center space-y-4 border-dashed border-2 border-slate-800 bg-transparent shadow-none">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
            <Calendar size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Clear Horizons</h3>
            <p className="text-slate-500 text-sm font-medium">No meetings found. AI is working to fill your calendar.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {todayMeetings.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-px bg-brand-500/20" /> Today
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {todayMeetings.map(m => <MeetingCard key={m.id} meeting={m} highlight />)}
              </div>
            </div>
          )}

          {thisWeek.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-px bg-slate-800" /> This Week
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {thisWeek.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </div>
          )}

          {later.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-px bg-slate-800" /> Later
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {later.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MeetingCard({ meeting, highlight }: { meeting: Meeting; highlight?: boolean }) {
  return (
    <div className={clsx(
      "card group p-6 border-none shadow-2xl relative overflow-hidden transition-all duration-500 hover:-translate-y-1",
      highlight ? "bg-slate-900 shadow-brand-500/5 border-l-4 border-l-brand-500" : "bg-slate-900/40"
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 blur-[100px] opacity-5 group-hover:opacity-10 transition-opacity" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          {/* Time Display */}
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-[20px] bg-slate-950 border border-white/5 shadow-inner">
            <span className="text-[10px] font-black text-slate-500 uppercase">{formatDate(meeting.start_time).split(',')[0]}</span>
            <span className="text-xl font-black text-white leading-tight">{new Date(meeting.start_time).getDate()}</span>
            <span className="text-[10px] font-black text-brand-400 uppercase">{formatDate(meeting.start_time).split(' ')[1]}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-white tracking-tight">{meeting.title}</h3>
              <span className={clsx("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", 
                meeting.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500')}>
                {meeting.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Clock size={14} className="text-brand-500" /> {formatTime(meeting.start_time)}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <User size={14} className="text-brand-500" /> {meeting.lead.name}
              </div>
              {meeting.location && (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <MapPin size={14} className="text-brand-500" /> {meeting.location}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {meeting.meeting_link ? (
            <a 
              href={meeting.meeting_link} 
              target="_blank" 
              rel="noreferrer"
              className="bg-white text-slate-950 h-11 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-400 hover:text-white transition-all shadow-xl active:scale-95"
            >
              <Video size={16} fill="currentColor" /> Join Session
            </a>
          ) : (
            <div className="h-11 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5">
              <VideoOff size={16} /> Link Pending
            </div>
          )}
          <Link 
            href={`/dashboard/leads/${meeting.lead.id}`}
            className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
