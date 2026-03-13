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
  ShieldCheck
} from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [pathname])

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Leads', icon: Users, path: '/dashboard/leads' },
    { name: 'Conversations', icon: MessageSquare, path: '/dashboard/conversations' },
    { name: 'Meetings', icon: Calendar, path: '/dashboard/meetings' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ]

  // Add Platform Admin link only for superusers
  if (user?.is_superuser) {
    menuItems.push({ name: 'Platform Admin', icon: ShieldCheck, path: '/dashboard/platform' })
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-200 transition-transform group-hover:scale-110">
            <img src="/logo.svg" alt="C" className="w-5 h-5 brightness-0 invert" />
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900">Converso</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
          return (
            <Link
              key={item.name}
              href={item.path}
              className={clsx(
                'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group',
                isActive 
                  ? 'bg-brand-50 text-brand-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={clsx(isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')} />
                {item.name}
              </div>
              {isActive && <ChevronRight size={14} className="text-brand-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="px-4 py-4 mb-2 bg-gray-50/50 rounded-2xl border border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
          <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Loading...'}</p>
          <p className="text-[9px] font-medium text-gray-500 truncate mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
