'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getStoredUser, logout } from '@/lib/api'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon,
  BarChart3,
  TrendingUp,
  Users2,
  Megaphone,
  BrainCircuit
} from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setUser(getStoredUser())
  }, [pathname])

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Lead Pipeline', icon: Users, path: '/dashboard/leads' },
    { name: 'Messages', icon: MessageSquare, path: '/dashboard/conversations' },
    { name: 'Calendar', icon: Calendar, path: '/dashboard/meetings' },
    { name: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { name: 'Conversions', icon: TrendingUp, path: '/dashboard/conversions' },
    { name: 'Campaigns', icon: Megaphone, path: '/dashboard/campaigns' },
    { name: 'Team', icon: Users2, path: '/dashboard/team' },
    { name: 'AI Training', icon: BrainCircuit, path: '/dashboard/ai-training' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ]

  if (user?.is_superuser) {
    menuItems.push({ name: 'Command Center', icon: ShieldCheck, path: '/dashboard/platform' })
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-72 bg-[#0f172a] text-white flex flex-col h-screen sticky top-0 z-50 shadow-[20px_0_80px_rgba(0,0,0,0.1)] border-r border-white/5">
      {/* Brand Header */}
      <div className="p-8 pb-10">
        <Link href="/dashboard" className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 flex-shrink-0">
              <Image src="/logo.svg" alt="Converso" width={40} height={40} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight leading-none group-hover:text-brand-400 transition-colors text-white">Converso</span>
              <span className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-500 mt-1">Enterprise AI</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Main Hub</p>
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
          return (
            <Link
              key={item.name}
              href={item.path}
              className={clsx(
                'flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group relative overflow-hidden',
                isActive 
                  ? 'bg-white/10 text-white border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
              )}
              <div className="flex items-center gap-3.5">
                <item.icon size={18} className={clsx(
                  'transition-colors duration-300',
                  isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                )} />
                <span className="tracking-tight">{item.name}</span>
              </div>
              <ChevronRight size={14} className={clsx(
                'transition-all duration-300 transform',
                isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
              )} />
            </Link>
          )
        })}
      </nav>

      {/* Footer Profile & Theme Toggle */}
      <div className="p-6 mt-auto space-y-4">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="text-[11px] font-black uppercase tracking-widest">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={clsx(
            "w-8 h-4 rounded-full relative transition-colors duration-500",
            theme === 'dark' ? "bg-brand-600" : "bg-slate-700"
          )}>
            <div className={clsx(
              "absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300",
              theme === 'dark' ? "left-5" : "left-1"
            )} />
          </div>
        </button>

        <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-4 group hover:bg-slate-900 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold border border-white/10 group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Loading...'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{user?.role || 'User'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all duration-300"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
