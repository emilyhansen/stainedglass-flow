import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Layers, BookOpen, FolderKanban,
  Package, ShoppingCart, Store, Settings, Sparkles, Search, CalendarClock,
  BarChart3, FileImage, Images, X,
} from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/glass', icon: Layers, label: 'Glass Inventory', end: false },
  { to: '/patterns', icon: BookOpen, label: 'Patterns', end: false },
  { to: '/projects', icon: FolderKanban, label: 'Projects', end: false },
  { to: '/gallery', icon: Images, label: 'Gallery', end: false },
  { to: '/deadlines', icon: CalendarClock, label: 'Deadlines', end: false },
  { to: '/supplies', icon: Package, label: 'Supplies', end: false },
  { to: '/shopping', icon: ShoppingCart, label: 'Shopping List', end: false },
  { to: '/suppliers', icon: Store, label: 'Suppliers', end: false },
  { to: '/search', icon: Search, label: 'Search', end: false },
  { to: '/stats', icon: BarChart3, label: 'Stats & Reports', end: false },
  { to: '/pdf-converter', icon: FileImage, label: 'PDF Converter', end: false },
]

const linkCls = (isActive: boolean) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
  }`

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const isMobileControlled = onClose !== undefined

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileControlled && open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen
          ${isMobileControlled
            ? `fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`
            : 'sticky top-0'
          }
        `}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-base flex-1">Glass Stash</span>
          {/* Close button on mobile */}
          {isMobileControlled && (
            <button onClick={onClose} className="lg:hidden text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 -mr-1">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => linkCls(isActive)}
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
          <NavLink to="/settings" className={({ isActive }) => linkCls(isActive)} onClick={onClose}>
            {({ isActive }) => (
              <>
                <Settings size={18} className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'} />
                Settings &amp; Backup
              </>
            )}
          </NavLink>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center pt-2">Glass Stash v1.0</p>
        </div>
      </aside>
    </>
  )
}
