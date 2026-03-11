import { useState, useEffect } from 'react'
import { BarChart3, Layers, BookOpen, FolderKanban, Package, DollarSign, Timer } from 'lucide-react'
import { getAllGlass, getAllPatterns, getAllProjects, getAllSupplies, getAllShopping } from '../lib/db'
import type { GlassItem, Pattern, Project, Supply, ShoppingItem } from '../lib/types'
import { format, subMonths, startOfMonth, differenceInCalendarDays, parseISO } from 'date-fns'

// Horizontal bar component
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{value}</span>
    </div>
  )
}

// Stat card
function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={18} className={color.split(' ')[0]} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// Section wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}

export function StatsPage() {
  const [glass, setGlass] = useState<GlassItem[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [shopping, setShopping] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllGlass(), getAllPatterns(), getAllProjects(), getAllSupplies(), getAllShopping()])
      .then(([g, p, pr, s, sh]) => {
        setGlass(g); setPatterns(p); setProjects(pr); setSupplies(s); setShopping(sh)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading stats…</p>
      </div>
    )
  }

  // ---- Glass stats ----
  const glassValue = glass.reduce((s, g) => s + (g.costPerSheet ?? 0), 0)
  const glassTypeCounts = Object.entries(
    glass.reduce((acc, g) => { acc[g.type] = (acc[g.type] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])
  const maxGlassType = Math.max(1, ...glassTypeCounts.map(([, c]) => c))

  const glassStatusCounts: Record<string, number> = {
    'In Stock': glass.filter(g => g.status === 'In Stock').length,
    'Low': glass.filter(g => g.status === 'Low').length,
    'Out of Stock': glass.filter(g => g.status === 'Out of Stock').length,
  }

  // ---- Pattern stats ----
  const patternStatusCounts: Record<string, number> = {
    'In Stash': patterns.filter(p => p.status === 'In Stash').length,
    'Wish List': patterns.filter(p => p.status === 'Wish List').length,
    'In Progress': patterns.filter(p => p.status === 'In Progress').length,
    'Made': patterns.filter(p => p.status === 'Made').length,
  }

  // ---- Project stats ----
  const projectStatusCounts: Record<string, number> = {
    'Planning': projects.filter(p => p.status === 'Planning').length,
    'In Progress': projects.filter(p => p.status === 'In Progress').length,
    'On Hold': projects.filter(p => p.status === 'On Hold').length,
    'Completed': projects.filter(p => p.status === 'Completed').length,
  }

  const projectTypeCounts = Object.entries(
    projects.reduce((acc, p) => { acc[p.type] = (acc[p.type] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxProjectType = Math.max(1, ...projectTypeCounts.map(([, c]) => c))

  // Completions per month (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = startOfMonth(subMonths(new Date(), 5 - i))
    return { label: format(d, 'MMM'), month: format(d, 'yyyy-MM') }
  })
  const completionsByMonth = last6Months.map(({ label, month }) => ({
    label,
    count: projects.filter(p => p.completedDate?.startsWith(month)).length,
  }))
  const maxCompletions = Math.max(1, ...completionsByMonth.map(m => m.count))

  // ---- Supply stats ----
  const suppliesValue = supplies.reduce((s, su) => s + (su.costPerUnit ?? 0), 0)
  const supplyCatCounts = Object.entries(
    supplies.reduce((acc, s) => { acc[s.category] = (acc[s.category] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxSupplyCat = Math.max(1, ...supplyCatCounts.map(([, c]) => c))

  // ---- Shopping stats ----
  const shoppingPending = shopping.filter(s => !s.purchased).length
  const shoppingDone = shopping.filter(s => s.purchased).length
  const estimatedSpend = shopping.filter(s => !s.purchased).reduce((sum, s) => sum + (s.estimatedCost ?? 0), 0)

  // ---- Completion time ----
  const completedWithDates = projects.filter(p => p.status === 'Completed' && p.startDate && p.completedDate)
  const avgCompletionDays = completedWithDates.length > 0
    ? Math.round(completedWithDates.reduce((sum, p) =>
        sum + differenceInCalendarDays(parseISO(p.completedDate!), parseISO(p.startDate!)), 0
      ) / completedWithDates.length)
    : null

  // ---- Total value ----
  const totalInventoryValue = glassValue + suppliesValue
  const totalPatternValue = patterns.reduce((s, p) => s + (p.purchasePrice ?? 0), 0)

  const barColors: Record<string, string> = {
    'In Stock': 'bg-green-400', 'Low': 'bg-yellow-400', 'Out of Stock': 'bg-red-400',
    'In Stash': 'bg-violet-400', 'Wish List': 'bg-purple-400', 'In Progress': 'bg-blue-400',
    'Made': 'bg-green-500', 'Planning': 'bg-gray-400', 'On Hold': 'bg-orange-400',
    'Completed': 'bg-green-500',
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-violet-600" />
          Stats &amp; Reports
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">An overview of your stained glass studio inventory</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard icon={Layers} label="Glass Pieces" value={glass.length} sub={glassValue > 0 ? `$${glassValue.toFixed(0)} est.` : undefined} color="text-violet-600 bg-violet-50" />
        <StatCard icon={BookOpen} label="Patterns" value={patterns.length} sub={`${patternStatusCounts['Made']} made`} color="text-purple-600 bg-purple-50" />
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} sub={`${projectStatusCounts['Completed']} completed`} color="text-blue-600 bg-blue-50" />
        <StatCard icon={Package} label="Supplies" value={supplies.length} sub={suppliesValue > 0 ? `$${suppliesValue.toFixed(0)} est.` : undefined} color="text-orange-600 bg-orange-50" />
        <StatCard icon={DollarSign} label="Total Value" value={`$${totalInventoryValue.toFixed(0)}`} sub="glass + supplies" color="text-green-600 bg-green-50" />
        <StatCard icon={Timer} label="Avg Completion" value={avgCompletionDays !== null ? `${avgCompletionDays}d` : '—'} sub={completedWithDates.length > 0 ? `${completedWithDates.length} project${completedWithDates.length !== 1 ? 's' : ''}` : 'no data yet'} color="text-rose-600 bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Glass by type */}
        <Section title="Glass by Type">
          <div className="space-y-2.5">
            {glassTypeCounts.slice(0, 8).map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                </div>
                <Bar value={count} max={maxGlassType} color="bg-violet-400" />
              </div>
            ))}
            {glassTypeCounts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No glass yet</p>}
          </div>
        </Section>

        {/* Glass status breakdown */}
        <Section title="Inventory Status">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Glass</p>
              <div className="space-y-2">
                {Object.entries(glassStatusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{status}</span>
                    </div>
                    <Bar value={count} max={glass.length || 1} color={barColors[status] ?? 'bg-gray-300'} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Supplies</p>
              <div className="space-y-2">
                {(['In Stock', 'Low', 'Out of Stock'] as const).map(status => {
                  const count = supplies.filter(s => s.status === status).length
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{status}</span>
                      </div>
                      <Bar value={count} max={supplies.length || 1} color={barColors[status] ?? 'bg-gray-300'} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Projects by status */}
        <Section title="Projects by Status">
          <div className="space-y-2.5">
            {Object.entries(projectStatusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{status}</span>
                </div>
                <Bar value={count} max={projects.length || 1} color={barColors[status] ?? 'bg-blue-400'} />
              </div>
            ))}
            {projects.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No projects yet</p>}
          </div>
          {projectTypeCounts.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">By Type</p>
              <div className="space-y-2">
                {projectTypeCounts.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                    </div>
                    <Bar value={count} max={maxProjectType} color="bg-blue-400" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* Patterns by status */}
        <Section title="Pattern Library">
          <div className="space-y-2.5">
            {Object.entries(patternStatusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{status}</span>
                </div>
                <Bar value={count} max={patterns.length || 1} color={barColors[status] ?? 'bg-purple-400'} />
              </div>
            ))}
            {patterns.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No patterns yet</p>}
          </div>
          {totalPatternValue > 0 && (
            <p className="text-xs text-gray-400 mt-3">Est. patterns value: <span className="font-medium text-gray-700">${totalPatternValue.toFixed(2)}</span></p>
          )}
        </Section>
      </div>

      {/* Project completions over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Section title="Project Completions (Last 6 Months)">
          <div className="flex items-end gap-3 h-32">
            {completionsByMonth.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{count > 0 ? count : ''}</span>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full bg-violet-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${maxCompletions > 0 ? (count / maxCompletions) * 100 : 0}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
              </div>
            ))}
          </div>
          {projects.filter(p => p.status === 'Completed').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4 -mt-28">No completed projects yet</p>
          )}
        </Section>

        {/* Shopping summary */}
        <Section title="Shopping List">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{shoppingPending}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pending</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">{shoppingDone}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Purchased</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{estimatedSpend > 0 ? `$${estimatedSpend.toFixed(0)}` : '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Est. spend</p>
              </div>
            </div>
            {shopping.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Priority</p>
                {(['High', 'Medium', 'Low'] as const).map(priority => {
                  const count = shopping.filter(s => !s.purchased && s.priority === priority).length
                  return count > 0 ? (
                    <div key={priority} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{priority}</span>
                      </div>
                      <Bar value={count} max={shoppingPending || 1} color={priority === 'High' ? 'bg-red-400' : priority === 'Medium' ? 'bg-yellow-400' : 'bg-gray-400'} />
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Supplies by category */}
      <Section title="Supplies by Category">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {supplyCatCounts.map(([cat, count]) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{cat}</span>
              </div>
              <Bar value={count} max={maxSupplyCat} color="bg-orange-400" />
            </div>
          ))}
          {supplyCatCounts.length === 0 && <p className="text-sm text-gray-400 text-center py-4 col-span-2">No supplies yet</p>}
        </div>
      </Section>

      {/* Most-used glass */}
      {glass.length > 0 && (() => {
        const usedGlassIds = projects.flatMap(p => p.glassUsed.map(g => g.glassId))
        const usageCounts: Record<string, number> = {}
        for (const id of usedGlassIds) usageCounts[id] = (usageCounts[id] ?? 0) + 1
        const topGlass = Object.entries(usageCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, count]) => ({ item: glass.find(g => g.id === id), count }))
          .filter(r => r.item)
        const maxUsage = Math.max(1, ...topGlass.map(r => r.count))

        return topGlass.length > 0 ? (
          <div className="mt-6">
            <Section title="Most Used Glass (across projects)">
              <div className="space-y-2.5">
                {topGlass.map(({ item, count }) => item && (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.name || item.colorName}</span>
                      <span className="text-xs text-gray-400">{count} project{count > 1 ? 's' : ''}</span>
                    </div>
                    <Bar value={count} max={maxUsage} color="bg-violet-500" />
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null
      })()}

      {/* Tags overview */}
      {(() => {
        const allTags = [...new Set([...glass.flatMap(g => g.tags), ...supplies.flatMap(s => s.tags)])]
        if (allTags.length === 0) return null
        return (
          <div className="mt-6">
            <Section title="Tags in Use">
              <div className="flex flex-wrap gap-1.5">
                {allTags.sort().map(tag => {
                  const count = glass.filter(g => g.tags.includes(tag)).length + supplies.filter(s => s.tags.includes(tag)).length
                  return (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                      {tag} <span className="text-gray-400">{count}</span>
                    </span>
                  )
                })}
              </div>
            </Section>
          </div>
        )
      })()}
    </div>
  )
}
