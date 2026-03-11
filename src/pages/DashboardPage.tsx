import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layers, BookOpen, FolderKanban, Package, ShoppingCart, AlertTriangle, ChevronRight, Plus, ShoppingBag, CalendarClock } from 'lucide-react'
import { getAllGlass, getAllPatterns, getAllProjects, getAllSupplies, getAllShopping, saveShopping } from '../lib/db'
import type { Project, GlassItem, Supply, ShoppingItem } from '../lib/types'
import { Badge } from '../components/ui/Badge'
import { differenceInCalendarDays, format } from 'date-fns'
import { nanoid } from 'nanoid'

interface Stats {
  glass: { total: number; low: number; outOfStock: number }
  patterns: { total: number; inStash: number; wishList: number; made: number }
  projects: { total: number; inProgress: number; planning: number; completed: number; items: Project[]; upcoming: Project[] }
  supplies: { total: number; low: number }
  shopping: { total: number; pending: number }
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lowGlass, setLowGlass] = useState<GlassItem[]>([])
  const [lowSupplies, setLowSupplies] = useState<Supply[]>([])
  const [addedToShopping, setAddedToShopping] = useState(false)

  useEffect(() => {
    Promise.all([getAllGlass(), getAllPatterns(), getAllProjects(), getAllSupplies(), getAllShopping()]).then(
      ([glass, patterns, projects, supplies, shopping]) => {
        setLowGlass(glass.filter(g => g.status === 'Low' || g.status === 'Out of Stock'))
        setLowSupplies(supplies.filter(s => s.status === 'Low' || s.status === 'Out of Stock'))
        setStats({
          glass: {
            total: glass.length,
            low: glass.filter(g => g.status === 'Low').length,
            outOfStock: glass.filter(g => g.status === 'Out of Stock').length,
          },
          patterns: {
            total: patterns.length,
            inStash: patterns.filter(p => p.status === 'In Stash').length,
            wishList: patterns.filter(p => p.status === 'Wish List').length,
            made: patterns.filter(p => p.status === 'Made').length,
          },
          projects: {
            total: projects.length,
            inProgress: projects.filter(p => p.status === 'In Progress').length,
            planning: projects.filter(p => p.status === 'Planning').length,
            completed: projects.filter(p => p.status === 'Completed').length,
            items: projects
              .filter(p => p.status === 'In Progress' || p.status === 'Planning')
              .sort((a, b) => {
                if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                if (a.deadline) return -1
                if (b.deadline) return 1
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              })
              .slice(0, 4),
            upcoming: projects
              .filter(p => p.deadline && p.status !== 'Completed')
              .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
              .slice(0, 3),
          },
          supplies: {
            total: supplies.length,
            low: supplies.filter(s => s.status === 'Low' || s.status === 'Out of Stock').length,
          },
          shopping: {
            total: shopping.length,
            pending: shopping.filter(s => !s.purchased).length,
          },
        })
      }
    )
  }, [])

  const handleAddLowStockToShopping = async () => {
    const now = new Date().toISOString()
    for (const g of lowGlass) {
      const item: ShoppingItem = { id: nanoid(), name: g.name || g.colorName, type: 'Glass', priority: g.status === 'Out of Stock' ? 'High' : 'Medium', purchased: false, notes: `Low/out of stock — ${g.type}`, createdAt: now }
      await saveShopping(item)
    }
    for (const s of lowSupplies) {
      const item: ShoppingItem = { id: nanoid(), name: s.name, type: 'Supply', priority: s.status === 'Out of Stock' ? 'High' : 'Medium', purchased: false, notes: `Low/out of stock — ${s.category}`, createdAt: now }
      await saveShopping(item)
    }
    setAddedToShopping(true)
  }

  const alerts = stats
    ? [
        stats.glass.outOfStock > 0 && `${stats.glass.outOfStock} glass sheet${stats.glass.outOfStock > 1 ? 's' : ''} out of stock`,
        stats.glass.low > 0 && `${stats.glass.low} glass sheet${stats.glass.low > 1 ? 's' : ''} running low`,
        stats.supplies.low > 0 && `${stats.supplies.low} suppl${stats.supplies.low > 1 ? 'ies' : 'y'} low or out of stock`,
      ].filter(Boolean)
    : []

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to StainedGlass Flow</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your stained glass studio organizer</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 mb-1">Heads up</p>
            <ul className="space-y-0.5 mb-3">
              {alerts.map((a, i) => (
                <li key={i} className="text-sm text-amber-700">{a}</li>
              ))}
            </ul>
            {addedToShopping ? (
              <p className="text-sm text-green-700 font-medium">✓ Added to shopping list</p>
            ) : (
              <button
                onClick={handleAddLowStockToShopping}
                className="flex items-center gap-1.5 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ShoppingBag size={14} /> Add all to shopping list
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { to: '/glass', icon: Layers, label: 'Glass Sheets', value: stats?.glass.total ?? '—', sub: stats?.glass.low ? `${stats.glass.low} low` : undefined, color: 'text-violet-600 bg-violet-50' },
          { to: '/patterns', icon: BookOpen, label: 'Patterns', value: stats?.patterns.total ?? '—', sub: stats?.patterns.wishList ? `${stats.patterns.wishList} on wish list` : undefined, color: 'text-purple-600 bg-purple-50' },
          { to: '/projects', icon: FolderKanban, label: 'Projects', value: stats?.projects.total ?? '—', sub: stats?.projects.inProgress ? `${stats.projects.inProgress} in progress` : undefined, color: 'text-blue-600 bg-blue-50' },
          { to: '/supplies', icon: Package, label: 'Supplies', value: stats?.supplies.total ?? '—', sub: stats?.supplies.low ? `${stats.supplies.low} low` : undefined, color: 'text-orange-600 bg-orange-50' },
          { to: '/shopping', icon: ShoppingCart, label: 'Shopping', value: stats?.shopping.pending ?? '—', sub: 'items to buy', color: 'text-rose-600 bg-rose-50' },
        ].map(({ to, icon: Icon, label, value, sub, color }) => (
          <Link key={to} to={to} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all p-4 group">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color.split(' ')[0]} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active projects */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Active Projects</h2>
            <Link to="/projects" className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {!stats || stats.projects.items.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active projects</p>
              <Link to="/projects" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                <Plus size={12} /> Start a project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.projects.items.map(project => (
                <Link key={project.id} to="/projects" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {(project.coverPhoto || project.progressPhotos[0]) ? (
                      <img src={project.coverPhoto || project.progressPhotos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderKanban size={16} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge label={project.status} />
                      {project.deadline && (
                        <span className="text-xs text-gray-400">Due {format(new Date(project.deadline), 'MMM d')}</span>
                      )}
                    </div>
                  </div>
                  {project.nextStep && (
                    <p className="text-xs text-gray-400 truncate max-w-[120px] hidden sm:block">{project.nextStep}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <CalendarClock size={16} className="text-violet-600" />
              Deadlines
            </h2>
            <Link to="/deadlines" className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {!stats || stats.projects.upcoming.length === 0 ? (
            <div className="text-center py-8">
              <CalendarClock size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.projects.upcoming.map(project => {
                const today = new Date(); today.setHours(0, 0, 0, 0)
                const daysLeft = differenceInCalendarDays(new Date(project.deadline!), today)
                const isOverdue = daysLeft < 0
                const urgencyText = isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`
                const urgencyColor = isOverdue ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-violet-600'
                return (
                  <Link key={project.id} to="/deadlines" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {(project.coverPhoto || project.progressPhotos[0])
                        ? <img src={project.coverPhoto || project.progressPhotos[0]} alt="" className="w-full h-full object-cover" />
                        : <FolderKanban size={14} className="text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(project.deadline!), 'MMM d')}</p>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${urgencyColor}`}>{urgencyText}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick add shortcuts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Add</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/glass', icon: Layers, label: 'Add Glass', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
              { to: '/patterns', icon: BookOpen, label: 'Add Pattern', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { to: '/projects', icon: FolderKanban, label: 'New Project', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { to: '/supplies', icon: Package, label: 'Add Supply', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 p-3 rounded-xl font-medium text-sm transition-colors ${color}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Pattern stats breakdown */}
          {stats && stats.patterns.total > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Pattern Library</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'In Stash', value: stats.patterns.inStash, color: 'text-violet-700 dark:text-violet-400' },
                  { label: 'Wish List', value: stats.patterns.wishList, color: 'text-purple-700 dark:text-purple-400' },
                  { label: 'Made', value: stats.patterns.made, color: 'text-green-700 dark:text-green-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
