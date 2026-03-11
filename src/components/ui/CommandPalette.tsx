import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Layers, BookOpen, FolderKanban, Package, X,
  LayoutDashboard, ShoppingCart, Store, BarChart3, FileImage,
  Images, CalendarClock, Settings, HelpCircle,
} from 'lucide-react'
import { getAllGlass, getAllPatterns, getAllProjects, getAllSupplies } from '../../lib/db'
import { Badge } from './Badge'

const PAGE_SHORTCUTS = [
  { label: 'Dashboard',       route: '/',             icon: LayoutDashboard },
  { label: 'Glass Inventory', route: '/glass',        icon: Layers },
  { label: 'Patterns',        route: '/patterns',     icon: BookOpen },
  { label: 'Projects',        route: '/projects',     icon: FolderKanban },
  { label: 'Gallery',         route: '/gallery',      icon: Images },
  { label: 'Deadlines',       route: '/deadlines',    icon: CalendarClock },
  { label: 'Supplies',        route: '/supplies',     icon: Package },
  { label: 'Shopping List',   route: '/shopping',     icon: ShoppingCart },
  { label: 'Suppliers',       route: '/suppliers',    icon: Store },
  { label: 'Stats & Reports', route: '/stats',        icon: BarChart3 },
  { label: 'PDF Converter',   route: '/pdf-converter',icon: FileImage },
  { label: 'Settings',        route: '/settings',     icon: Settings },
  { label: 'Help',            route: '/help',         icon: HelpCircle },
]

type FlatResult = {
  id: string
  type: 'Glass' | 'Pattern' | 'Project' | 'Supply'
  photo?: string
  title: string
  sub: string
  badge: string
  route: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FlatResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const matchedPages = query.trim()
    ? PAGE_SHORTCUTS.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : []

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    const [glass, patterns, projects, supplies] = await Promise.all([
      getAllGlass(), getAllPatterns(), getAllProjects(), getAllSupplies(),
    ])
    const lq = q.toLowerCase()
    const flat: FlatResult[] = [
      ...glass
        .filter(i => i.name.toLowerCase().includes(lq) || i.colorName.toLowerCase().includes(lq) || (i.manufacturer ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq)))
        .map((i): FlatResult => ({ id: i.id, type: 'Glass', photo: i.photos[0], title: i.name || i.colorName, sub: `${i.type}${i.manufacturer ? ` · ${i.manufacturer}` : ''}`, badge: i.status, route: '/glass' })),
      ...patterns
        .filter(i => i.name.toLowerCase().includes(lq) || (i.designer ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq)))
        .map((i): FlatResult => ({ id: i.id, type: 'Pattern', photo: i.photos[0] || i.lineDrawings[0], title: i.name, sub: i.designer ?? '', badge: i.status, route: '/patterns' })),
      ...projects
        .filter(i => i.name.toLowerCase().includes(lq) || (i.description ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq)))
        .map((i): FlatResult => ({ id: i.id, type: 'Project', photo: i.coverPhoto || i.progressPhotos[0], title: i.name, sub: i.type, badge: i.status, route: '/projects' })),
      ...supplies
        .filter(i => i.name.toLowerCase().includes(lq) || (i.brand ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq)))
        .map((i): FlatResult => ({ id: i.id, type: 'Supply', title: i.name, sub: `${i.category}${i.brand ? ` · ${i.brand}` : ''}`, badge: i.status, route: '/supplies' })),
    ]
    setResults(flat)
    setSelectedIndex(0)
    setLoading(false)
  }, [])

  const handleQueryChange = (q: string) => {
    setQuery(q)
    setLoading(q.trim().length > 0)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 150)
  }

  const selectItem = useCallback((item: FlatResult) => {
    navigate(item.route)
    onClose()
  }, [navigate, onClose])

  // Keyboard navigation handled here (Escape is owned by Layout's toggle;
  // we handle it here too so pressing Esc while palette is open closes it)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        selectItem(results[selectedIndex])
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, results, selectedIndex, selectItem, onClose])

  if (!open) return null

  const typeIcon = (type: FlatResult['type']) => {
    switch (type) {
      case 'Glass':   return <Layers size={12} className="text-violet-600" />
      case 'Pattern': return <BookOpen size={12} className="text-purple-600" />
      case 'Project': return <FolderKanban size={12} className="text-blue-600" />
      case 'Supply':  return <Package size={12} className="text-orange-600" />
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[14vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={17} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 text-base text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
            placeholder="Search glass, patterns, projects, supplies..."
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setLoading(false) }} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
              <X size={15} />
            </button>
          )}
          <kbd className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono shrink-0">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[56vh] overflow-y-auto">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-8 animate-pulse">Searching...</p>
          )}
          {!loading && !query && (
            <p className="text-sm text-gray-400 text-center py-8">Type to search your entire stash</p>
          )}
          {!loading && query && results.length === 0 && matchedPages.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No results for "{query}"</p>
          )}
          {!loading && matchedPages.length > 0 && (
            <div className="py-1.5 border-b border-gray-100 dark:border-gray-800">
              <p className="px-4 pt-1.5 pb-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pages</p>
              {matchedPages.map(page => {
                const PageIcon = page.icon
                return (
                  <button
                    key={page.route}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => { navigate(page.route); onClose() }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <PageIcon size={15} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{page.label}</p>
                  </button>
                )
              })}
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="py-1.5">
              {results.map((item, i) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {item.photo
                      ? <img src={item.photo} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                    {item.sub && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.sub}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {typeIcon(item.type)}
                    <Badge label={item.badge} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        {(results.length > 0 || matchedPages.length > 0) && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </div>
  )
}
