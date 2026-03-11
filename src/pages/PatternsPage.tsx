import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, BookOpen, X, Layers, CheckSquare } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { Pattern, PatternStatus, PatternStyle, PatternDifficulty, PatternGlassPlan, GlassItem, Project } from '../lib/types'
import { getAllPatterns, savePattern, deletePattern, getAllGlass, getAllProjects } from '../lib/db'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ImageUpload } from '../components/ui/ImageUpload'
import { TagInput } from '../components/ui/TagInput'
import { Lightbox } from '../components/ui/Lightbox'
import { BulkTagBar } from '../components/ui/BulkTagBar'

const STATUSES: PatternStatus[] = ['Wish List', 'In Stash', 'In Progress', 'Made']
const STYLES: PatternStyle[] = ['Traditional', 'Art Nouveau', 'Geometric', 'Nature', 'Abstract', 'Religious', 'Floral', 'Animal', 'Landscape', 'Other']
const DIFFICULTIES: PatternDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

function emptyPattern(): Pattern {
  const n = new Date().toISOString()
  return { id: nanoid(), name: '', designer: '', source: '', style: undefined, difficulty: undefined, widthIn: undefined, heightIn: undefined, pieceCount: undefined, status: 'In Stash', notes: '', tags: [], photos: [], lineDrawings: [], attachments: [], glassPlan: [], purchaseDate: '', purchasePrice: undefined, createdAt: n, updatedAt: n }
}

function PatternCard({ item, usageCount, allGlass, onClick, onPhotoClick, selectMode, selected, onToggleSelect }: { item: Pattern; usageCount: number; allGlass: GlassItem[]; onClick: () => void; onPhotoClick?: (images: string[], index: number) => void; selectMode?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const glassMap = useMemo(() => Object.fromEntries(allGlass.map(g => [g.id, g])), [allGlass])
  const planCost = useMemo(() => {
    const plan = item.glassPlan ?? []
    const total = plan.reduce((sum, entry) => sum + (glassMap[entry.glassId]?.costPerSheet ?? 0), 0)
    return plan.length > 0 && total > 0 ? total : null
  }, [item.glassPlan, glassMap])
  const allImages = [...item.photos, ...item.lineDrawings]
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${selected ? 'border-violet-400 ring-2 ring-violet-200' : 'border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700'}`} onClick={selectMode ? onToggleSelect : onClick}>
      {selectMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selected ? 'bg-violet-500 border-violet-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
            {selected && <svg viewBox="0 0 10 10" className="w-3 h-3 text-white fill-none stroke-current stroke-2"><polyline points="1.5,5 4,8 8.5,2" /></svg>}
          </div>
        </div>
      )}
      <div
        className="aspect-[4/3] bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700 rounded-t-2xl overflow-hidden"
        onClick={!selectMode && allImages.length > 0 && onPhotoClick ? e => { e.stopPropagation(); onPhotoClick(allImages, 0) } : undefined}
      >
        {item.photos[0] ? (
          <img src={item.photos[0]} alt={item.name} className={`w-full h-full object-cover ${!selectMode && allImages.length > 0 && onPhotoClick ? 'cursor-zoom-in' : ''}`} />
        ) : item.lineDrawings[0] ? (
          <img src={item.lineDrawings[0]} alt={item.name} className={`w-full h-full object-cover ${!selectMode && allImages.length > 0 && onPhotoClick ? 'cursor-zoom-in' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={36} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{item.name}</h3>
          <Badge label={item.status} />
        </div>
        {item.designer && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.designer}</p>}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.style && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{item.style}</span>}
          {item.difficulty && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{item.difficulty}</span>}
          {item.pieceCount && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{item.pieceCount} pcs</span>}
        </div>
        {item.widthIn && item.heightIn && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.widthIn}" × {item.heightIn}"</p>
        )}
        {planCost !== null && (
          <p className="text-xs text-emerald-600 mt-1 font-medium">Est. glass: ${planCost.toFixed(2)}</p>
        )}
        {usageCount > 0 && (
          <p className="text-xs text-violet-600 mt-1 font-medium">Used in {usageCount} project{usageCount !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  )
}

function GlassPlanSection({ plan, allGlass, onChange }: {
  plan: PatternGlassPlan[]
  allGlass: GlassItem[]
  onChange: (p: PatternGlassPlan[]) => void
}) {
  const glassMap = useMemo(() => Object.fromEntries(allGlass.map(g => [g.id, g])), [allGlass])
  const totalCost = plan.reduce((sum, e) => sum + (glassMap[e.glassId]?.costPerSheet ?? 0), 0)
  const [glassSearch, setGlassSearch] = useState('')
  const [pendingLabel, setPendingLabel] = useState('')

  const suggestions = glassSearch
    ? allGlass.filter(g => (g.name || g.colorName).toLowerCase().includes(glassSearch.toLowerCase())).slice(0, 5)
    : []

  const addEntry = (g: GlassItem) => {
    if (plan.find(p => p.glassId === g.id && p.pieceLabel === pendingLabel)) return
    onChange([...plan, { id: nanoid(), pieceLabel: pendingLabel || 'Piece', glassId: g.id, glassName: g.name || g.colorName }])
    setGlassSearch(''); setPendingLabel('')
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          <Layers size={12} /> Glass Color Plan
        </div>
        {totalCost > 0 && (
          <span className="text-xs font-semibold text-emerald-600">Est. ${totalCost.toFixed(2)}</span>
        )}
      </div>
      {plan.length > 0 && (
        <div className="space-y-1.5">
          {plan.map(entry => (
            <div key={entry.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
              <input
                className="input w-28 text-xs py-1"
                placeholder="Piece label"
                value={entry.pieceLabel}
                onChange={e => onChange(plan.map(p => p.id === entry.id ? { ...p, pieceLabel: e.target.value } : p))}
              />
              <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">{entry.glassName}</span>
              {glassMap[entry.glassId]?.costPerSheet != null && (
                <span className="text-xs text-emerald-600 shrink-0">${glassMap[entry.glassId].costPerSheet!.toFixed(2)}</span>
              )}
              <button type="button" onClick={() => onChange(plan.filter(p => p.id !== entry.id))} className="text-gray-300 hover:text-red-400 shrink-0"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="input w-28 text-sm"
          placeholder="Label (e.g. Sky)"
          value={pendingLabel}
          onChange={e => setPendingLabel(e.target.value)}
        />
        <div className="relative flex-1">
          <input
            className="input text-sm"
            placeholder="Search glass to assign..."
            value={glassSearch}
            onChange={e => setGlassSearch(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 overflow-hidden">
              {suggestions.map(g => (
                <button key={g.id} type="button" onClick={() => addEntry(g)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-sm text-left">
                  {g.photos[0] && <img src={g.photos[0]} alt="" className="w-6 h-6 rounded object-cover" />}
                  <span className="flex-1 truncate">{g.name || g.colorName}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{g.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PatternForm({ initial, allGlass, onSave, onCancel }: { initial: Pattern; allGlass: GlassItem[]; onSave: (p: Pattern) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Pattern>({ ...initial, glassPlan: initial.glassPlan ?? [] })
  const set = (field: keyof Pattern) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <ImageUpload label="Finished Examples" images={form.photos} onChange={p => setForm(f => ({ ...f, photos: p }))} />
        </div>
        <div>
          <ImageUpload label="Line Drawings" images={form.lineDrawings} onChange={p => setForm(f => ({ ...f, lineDrawings: p }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Pattern Name *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Celtic Knot Panel" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Designer</label>
          <input className="input" value={form.designer ?? ''} onChange={set('designer')} placeholder="e.g. Paned Expressions" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Source</label>
          <input className="input" value={form.source ?? ''} onChange={set('source')} placeholder="Book, website, etc." />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Style</label>
          <select className="input" value={form.style ?? ''} onChange={set('style')}>
            <option value="">Select...</option>
            {STYLES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Difficulty</label>
          <select className="input" value={form.difficulty ?? ''} onChange={set('difficulty')}>
            <option value="">Select...</option>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Width (in)</label>
          <input className="input" type="number" value={form.widthIn ?? ''} onChange={e => setForm(f => ({ ...f, widthIn: e.target.value ? +e.target.value : undefined }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Height (in)</label>
          <input className="input" type="number" value={form.heightIn ?? ''} onChange={e => setForm(f => ({ ...f, heightIn: e.target.value ? +e.target.value : undefined }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Piece Count</label>
          <input className="input" type="number" value={form.pieceCount ?? ''} onChange={e => setForm(f => ({ ...f, pieceCount: e.target.value ? +e.target.value : undefined }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Purchase Date</label>
          <input className="input" type="date" value={form.purchaseDate ?? ''} onChange={set('purchaseDate')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Purchase Price ($)</label>
          <input className="input" type="number" step="0.01" value={form.purchasePrice ?? ''} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value ? +e.target.value : undefined }))} />
        </div>
      </div>

      <TagInput label="Tags" tags={form.tags} onChange={t => setForm(f => ({ ...f, tags: t }))} />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes</label>
        <textarea className="input" rows={2} value={form.notes ?? ''} onChange={set('notes')} placeholder="Notes about this pattern..." />
      </div>

      <GlassPlanSection plan={form.glassPlan ?? []} allGlass={allGlass} onChange={p => setForm(f => ({ ...f, glassPlan: p }))} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export function PatternsPage() {
  const [items, setItems] = useState<Pattern[]>([])
  const [allGlass, setAllGlass] = useState<GlassItem[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterStyle, setFilterStyle] = useState<string>('All')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All')
  const [filterTag, setFilterTag] = useState<string>('')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pattern | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    getAllPatterns().then(setItems)
    getAllGlass().then(setAllGlass)
    getAllProjects().then(setAllProjects)
  }, [])

  const projectUsageMap = useMemo(() => {
    const map: Record<string, number> = {}
    allProjects.forEach(p => { if (p.patternId) map[p.patternId] = (map[p.patternId] ?? 0) + 1 })
    return map
  }, [allProjects])

  const allTags = [...new Set(items.flatMap(i => i.tags))].sort()

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || i.name.toLowerCase().includes(q) || (i.designer ?? '').toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))
    const matchS = filterStatus === 'All' || i.status === filterStatus
    const matchSt = filterStyle === 'All' || i.style === filterStyle
    const matchD = filterDifficulty === 'All' || i.difficulty === filterDifficulty
    const matchTag = !filterTag || i.tags.includes(filterTag)
    return matchQ && matchS && matchSt && matchD && matchTag
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleBulkAddTag = async (tag: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      if (!item.tags.includes(tag)) await savePattern({ ...item, tags: [...item.tags, tag] })
    }
    setItems(await getAllPatterns())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkRemoveTag = async (tag: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      await savePattern({ ...item, tags: item.tags.filter(t => t !== tag) })
    }
    setItems(await getAllPatterns())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deletePattern(id)
    setItems(await getAllPatterns())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkSetStatus = async (status: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      await savePattern({ ...item, status: status as PatternStatus })
    }
    setItems(await getAllPatterns())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  const handleSave = async (item: Pattern) => {
    await savePattern(item)
    setItems(await getAllPatterns())
    setModalOpen(false); setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deletePattern(id)
    setItems(await getAllPatterns())
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen size={24} className="text-violet-600" />
          Patterns
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${selectMode ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 text-violet-700 dark:text-violet-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-600'}`}
          >
            <CheckSquare size={15} /> Select
          </button>
          <Button onClick={() => { setEditing(emptyPattern()); setModalOpen(true) }}>
            <Plus size={16} /> Add Pattern
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search patterns..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-40" value={filterStyle} onChange={e => setFilterStyle(e.target.value)}>
          <option value="All">All Styles</option>
          {STYLES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-40" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
          <option value="All">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterTag === tag ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-400'}`}
            >{tag}</button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{filtered.length} pattern{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 && items.length === 0 ? (
        <EmptyState icon={BookOpen} title="No patterns yet" description="Add your pattern library to keep track of what you own and want to make." action={{ label: 'Add Pattern', onClick: () => { setEditing(emptyPattern()); setModalOpen(true) } }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="relative group">
              <PatternCard
                item={item}
                usageCount={projectUsageMap[item.id] ?? 0}
                allGlass={allGlass}
                onClick={() => { if (!selectMode) { setEditing(item); setModalOpen(true) } }}
                onPhotoClick={!selectMode ? (imgs, i) => { setLightboxImages(imgs); setLightboxIndex(i) } : undefined}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
              {!selectMode && (
                <button className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm text-base leading-none" onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing?.name ? 'Edit Pattern' : 'Add Pattern'} size="xl">
        {editing && <PatternForm initial={editing} allGlass={allGlass} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditing(null) }} />}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)} title="Delete Pattern" message="Remove this pattern from your library?" />

      <Lightbox images={lightboxImages} initialIndex={lightboxIndex} open={lightboxImages.length > 0} onClose={() => setLightboxImages([])} />

      {selectMode && selectedIds.size > 0 && (
        <BulkTagBar
          count={selectedIds.size}
          onAddTag={handleBulkAddTag}
          onRemoveTag={handleBulkRemoveTag}
          onDelete={handleBulkDelete}
          onSetStatus={handleBulkSetStatus}
          statusOptions={STATUSES}
          onCancel={exitSelectMode}
        />
      )}
      {selectMode && selectedIds.size === 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-gray-300">Click patterns to select them</span>
          <button onClick={exitSelectMode} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
      )}
    </div>
  )
}
