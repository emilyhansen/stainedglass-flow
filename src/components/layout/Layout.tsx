import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from '../ui/CommandPalette'
import { getAllProjects } from '../../lib/db'

export function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (sessionStorage.getItem('deadlineNotifShown') || !('Notification' in window)) return
      const projects = await getAllProjects()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcoming = projects.filter(p => {
        if (p.status === 'Completed' || !p.deadline) return false
        const dl = new Date(p.deadline)
        dl.setHours(0, 0, 0, 0)
        const warnDays = parseInt(localStorage.getItem('deadlineNotifDays') ?? '7', 10)
        return (dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= warnDays
      })
      if (upcoming.length === 0) return
      let perm = Notification.permission
      if (perm === 'default') perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      for (const p of upcoming) {
        const dl = new Date(p.deadline!)
        dl.setHours(0, 0, 0, 0)
        const days = Math.round((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const body = days < 0
          ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`
          : days === 0 ? 'Due today!' : `Due in ${days} day${days !== 1 ? 's' : ''}`
        new Notification(p.name, { body })
      }
      sessionStorage.setItem('deadlineNotifShown', '1')
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar (always visible on lg+) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar (slide-in drawer) */}
      <div className="lg:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white text-sm">StainedGlass Flow</span>
          <div className="flex-1" />
          <button
            onClick={() => setPaletteOpen(true)}
            className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            ⌘K
          </button>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
