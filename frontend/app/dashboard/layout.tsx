'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getStoredUser } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!getStoredUser()) router.replace('/login')
  }, [router])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex flex-col md:flex-row min-h-screen transition-colors duration-300">
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-6 h-16 border-b border-white/5 sticky top-0 z-30" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-brand-500/20 flex-shrink-0">
            <Image src="/logo.svg" alt="Converso" width={32} height={32} />
          </div>
          <span className="font-black text-lg tracking-tight text-white">Converso</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 md:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto custom-scrollbar">
        <div className="p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
