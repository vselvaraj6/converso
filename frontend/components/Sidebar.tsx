'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, MessageSquare, Calendar, Settings, LogOut } from 'lucide-react'
import { logout } from '@/lib/api'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/leads',         label: 'Leads',         icon: Users },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/dashboard/meetings',      label: 'Meetings',      icon: Calendar },
  { href: '/dashboard/settings',      label: 'Settings',      icon: Settings },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="flex flex-col bg-white border-r border-gray-200 h-full">
      {/* Logo - Hidden on mobile because it's in the mobile header */}
      <div className="h-16 hidden md:flex items-center px-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Converso Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-black text-gray-900 text-xl tracking-tight">Converso</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? path === href : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
