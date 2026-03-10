import { useState } from 'react'
import { Search, Layers, BookOpen, FolderKanban, Package } from 'lucide-react'
import { getAllGlass, getAllPatterns, getAllProjects, getAllSupplies } from '../lib/db'
import type { GlassItem, Pattern, Project, Supply } from '../lib/types'
import { Badge } from '../components/ui/Badge'
import { useNavigate } from 'react-router-dom'

interface Results {
  glass: GlassItem[]
  patterns: Pattern[]
  projects: Project[]
  supplies: Supply[]
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    const [glass, patterns, projects, supplies] = await Promise.all([
      getAllGlass(), getAllPatterns(), getAllProjects(), getAllSupplies(),
    ])
    const lq = q.toLowerCase()
    setResults({
      glass: glass.filter(i => i.name.toLowerCase().includes(lq) || i.colorName.toLowerCase().includes(lq) || (i.manufacturer ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq))),
      patterns: patterns.filter(i => i.name.toLowerCase().includes(lq) || (i.designer ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq))),
      projects: projects.filter(i => i.name.toLowerCase().includes(lq) || (i.description ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq))),
      supplies: supplies.filter(i => i.name.toLowerCase().includes(lq) || (i.brand ?? '').toLowerCase().includes(lq) || i.tags.some(t => t.toLowerCase().includes(lq))),
    })
    setLoading(false)
  }

  const total = results ? results.glass.length + results.patterns.length + results.projects.length + results.supplies.length : 0

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <Search size={24} className="text-teal-600" />
        Search
      </h1>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          className="input pl-11 py-3 text-base"
          placeholder="Search across glass, patterns, projects, and supplies..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-gray-400 animate-pulse">Searching...</p>}

      {results && !loading && (
        total === 0 ? (
          <p className="text-sm text-gray-500">No results for "{query}"</p>
        ) : (
          <div className="space-y-6">
            {results.glass.length > 0 && (
              <Section title="Glass Inventory" icon={<Layers size={15} className="text-teal-600" />} count={results.glass.length}>
                {results.glass.map(item => (
                  <ResultRow key={item.id} photo={item.photos[0]} title={item.name || item.colorName} sub={`${item.type}${item.manufacturer ? ` · ${item.manufacturer}` : ''}`} badge={item.status} onClick={() => navigate('/glass')} />
                ))}
              </Section>
            )}
            {results.patterns.length > 0 && (
              <Section title="Patterns" icon={<BookOpen size={15} className="text-purple-600" />} count={results.patterns.length}>
                {results.patterns.map(item => (
                  <ResultRow key={item.id} photo={item.photos[0] || item.lineDrawings[0]} title={item.name} sub={item.designer ?? ''} badge={item.status} onClick={() => navigate('/patterns')} />
                ))}
              </Section>
            )}
            {results.projects.length > 0 && (
              <Section title="Projects" icon={<FolderKanban size={15} className="text-blue-600" />} count={results.projects.length}>
                {results.projects.map(item => (
                  <ResultRow key={item.id} photo={item.coverPhoto || item.progressPhotos[0]} title={item.name} sub={item.type} badge={item.status} onClick={() => navigate('/projects')} />
                ))}
              </Section>
            )}
            {results.supplies.length > 0 && (
              <Section title="Supplies" icon={<Package size={15} className="text-orange-600" />} count={results.supplies.length}>
                {results.supplies.map(item => (
                  <ResultRow key={item.id} title={item.name} sub={`${item.category}${item.brand ? ` · ${item.brand}` : ''}`} badge={item.status} onClick={() => navigate('/supplies')} />
                ))}
              </Section>
            )}
          </div>
        )
      )}
    </div>
  )
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ResultRow({ photo, title, sub, badge, onClick }: { photo?: string; title: string; sub: string; badge: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub}</p>}
      </div>
      <Badge label={badge} />
    </button>
  )
}
