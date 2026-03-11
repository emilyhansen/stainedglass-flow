import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Layers, LayoutGrid, Grid3x3, CheckSquare, X, Clock, FolderKanban, ShoppingCart } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { GlassItem, GlassStatus, GlassType, GlassPriceEntry, ShoppingItem } from '../lib/types'
import { getAllGlass, saveGlass, deleteGlass, getAllProjects, saveShopping } from '../lib/db'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ImageUpload } from '../components/ui/ImageUpload'
import { TagInput } from '../components/ui/TagInput'
import { Lightbox } from '../components/ui/Lightbox'
import { BulkTagBar } from '../components/ui/BulkTagBar'

const GLASS_TYPES: GlassType[] = ['Cathedral', 'Opalescent', 'Textured', 'Iridescent', 'Streaky', 'Seedy', 'Glue Chip', 'Beveled', 'Jewel', 'Mirror', 'Bevel', 'Bevel Cluster', 'Other']
const PIECE_TYPES: GlassType[] = ['Bevel', 'Bevel Cluster']
const STATUSES: GlassStatus[] = ['In Stock', 'Low', 'Out of Stock']

// Approximate hue for sorting by color family
const colorHintMap: Record<string, number> = {
  red: 0, orange: 30, yellow: 55, amber: 40, gold: 50,
  green: 120, teal: 170, cyan: 185, blue: 220, cobalt: 225, purple: 270,
  violet: 280, pink: 330, magenta: 310, rose: 340, white: 361, clear: 362,
  black: 363, grey: 364, gray: 364, brown: 25, tan: 35, ivory: 360,
}
function colorSortKey(item: GlassItem): number {
  const s = (item.colorName || item.name).toLowerCase()
  for (const [word, hue] of Object.entries(colorHintMap)) {
    if (s.includes(word)) return hue
  }
  return 999
}

function emptyGlass(): GlassItem {
  return {
    id: nanoid(), name: '', colorName: '', colorCode: '', type: 'Cathedral',
    manufacturer: '', supplier: '', widthIn: undefined, heightIn: undefined,
    quantity: '', status: 'In Stock', costPerSheet: undefined, priceHistory: [],
    notes: '', tags: [], photos: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
}

// Card view (existing)
function GlassCard({
  item, onClick, onPhotoClick, usedInProjects, selectMode, selected, onToggleSelect,
}: {
  item: GlassItem
  onClick: () => void
  onPhotoClick?: (images: string[], index: number) => void
  usedInProjects?: string[]
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${selected ? 'border-violet-400 ring-2 ring-violet-200' : 'border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700'}`}
      onClick={selectMode ? onToggleSelect : onClick}
    >
      {selectMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selected ? 'bg-violet-500 border-violet-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
            {selected && <svg viewBox="0 0 10 10" className="w-3 h-3 text-white fill-none stroke-current stroke-2"><polyline points="1.5,5 4,8 8.5,2" /></svg>}
          </div>
        </div>
      )}
      <div
        className="aspect-[4/3] bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700 rounded-t-2xl overflow-hidden"
        onClick={!selectMode && item.photos.length > 0 && onPhotoClick ? e => { e.stopPropagation(); onPhotoClick(item.photos, 0) } : undefined}
      >
        {item.photos[0] ? (
          <img src={item.photos[0]} alt={item.name} className={`w-full h-full object-cover ${!selectMode && item.photos.length > 0 && onPhotoClick ? 'cursor-zoom-in' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layers size={36} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{item.name || item.colorName}</h3>
          <Badge label={item.status} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.type}{item.manufacturer ? ` · ${item.manufacturer}` : ''}</p>
        {item.colorCode && <p className="text-xs text-gray-400 dark:text-gray-500">#{item.colorCode}</p>}
        {item.quantity && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.quantity}</p>}
        {usedInProjects && usedInProjects.length > 0 && (
          <p className="text-xs text-violet-600 mt-1 flex items-center gap-1 truncate">
            <FolderKanban size={10} />
            Used in {usedInProjects.length} project{usedInProjects.length > 1 ? 's' : ''}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Swatch view – compact color-sorted squares
function GlassSwatch({ item, onClick, selected, selectMode, onToggleSelect }: {
  item: GlassItem
  onClick: () => void
  selected?: boolean
  selectMode?: boolean
  onToggleSelect?: () => void
}) {
  const statusDot: Record<GlassStatus, string> = {
    'In Stock': 'bg-green-400',
    'Low': 'bg-yellow-400',
    'Out of Stock': 'bg-red-400',
  }
  return (
    <button
      onClick={selectMode ? onToggleSelect : onClick}
      className={`group relative rounded-xl overflow-hidden border hover:shadow-md transition-all ${selected ? 'border-violet-400 ring-2 ring-violet-200' : 'border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-600'}`}
      title={`${item.name || item.colorName}${item.colorCode ? ` · #${item.colorCode}` : ''}`}
    >
      {selectMode && (
        <div className="absolute top-1 left-1 z-10">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selected ? 'bg-violet-500 border-violet-500' : 'bg-white/80 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600'}`}>
            {selected && <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-2"><polyline points="1.5,5 4,8 8.5,2" /></svg>}
          </div>
        </div>
      )}
      <div className="aspect-square bg-gradient-to-br from-gray-200 dark:from-gray-700 to-gray-300 dark:to-gray-600">
        {item.photos[0] ? (
          <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">🪟</div>
        )}
      </div>
      <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${statusDot[item.status]} ring-1 ring-white`} />
      <div className="p-1.5 bg-white dark:bg-gray-900">
        <p className="text-xs font-medium text-gray-800 dark:text-white truncate leading-tight">{item.name || item.colorName}</p>
        {item.colorCode && <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">#{item.colorCode}</p>}
      </div>
    </button>
  )
}

// Price History section inside GlassForm
function PriceHistorySection({ history, onChange }: { history: GlassPriceEntry[]; onChange: (h: GlassPriceEntry[]) => void }) {
  const [open, setOpen] = useState(history.length > 0)
  const addEntry = () => {
    const entry: GlassPriceEntry = { date: new Date().toISOString().slice(0, 10), costPerSheet: 0, supplier: '', notes: '' }
    onChange([...history, entry])
    setOpen(true)
  }
  const updateEntry = (i: number, field: keyof GlassPriceEntry, value: string | number) => {
    const updated = history.map((e, idx) => idx === i ? { ...e, [field]: value } : e)
    onChange(updated)
  }
  const removeEntry = (i: number) => onChange(history.filter((_, idx) => idx !== i))

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        <span className="flex items-center gap-2"><Clock size={14} className="text-gray-400" /> Price History ({history.length})</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No price history yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Date</label>
                    <input className="input text-sm py-1" type="date" value={entry.date} onChange={e => updateEntry(i, 'date', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Cost ($)</label>
                    <input className="input text-sm py-1" type="number" step="0.01" value={entry.costPerSheet || ''} onChange={e => updateEntry(i, 'costPerSheet', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Supplier</label>
                    <input className="input text-sm py-1" value={entry.supplier || ''} onChange={e => updateEntry(i, 'supplier', e.target.value)} placeholder="optional" />
                  </div>
                  <button type="button" onClick={() => removeEntry(i)} className="mb-0 text-gray-300 hover:text-red-400 transition-colors pb-1.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addEntry}
            className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Add price entry
          </button>
        </div>
      )}
    </div>
  )
}

function GlassForm({
  initial, onSave, onCancel, usedInProjects,
}: {
  initial: GlassItem
  onSave: (g: GlassItem) => void
  onCancel: () => void
  usedInProjects?: string[]
}) {
  const [form, setForm] = useState<GlassItem>({ ...initial, priceHistory: initial.priceHistory ?? [] })
  const set = (field: keyof GlassItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <ImageUpload images={form.photos} onChange={p => setForm(f => ({ ...f, photos: p }))} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name / Label</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Cobalt Blue Cathedral" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Color Name</label>
          <input className="input" value={form.colorName} onChange={set('colorName')} placeholder="e.g. Cobalt Blue" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Color Code</label>
          <input className="input" value={form.colorCode ?? ''} onChange={set('colorCode')} placeholder="e.g. 1437" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Type</label>
          <select className="input" value={form.type} onChange={set('type')}>
            {GLASS_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Manufacturer</label>
          <input className="input" value={form.manufacturer ?? ''} onChange={set('manufacturer')} placeholder="e.g. Wissmach, Bullseye" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Supplier</label>
          <input className="input" value={form.supplier ?? ''} onChange={set('supplier')} placeholder="e.g. Delphi Glass" />
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Quantity</label>
          <input className="input" value={form.quantity ?? ''} onChange={set('quantity')} placeholder="e.g. 1 full sheet" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {PIECE_TYPES.includes(form.type) ? 'Cost per piece ($)' : 'Cost per sheet ($)'}
        </label>
        <input className="input w-32" type="number" step="0.01" value={form.costPerSheet ?? ''} onChange={e => setForm(f => ({ ...f, costPerSheet: e.target.value ? +e.target.value : undefined }))} />
      </div>

      {/* Price History */}
      <PriceHistorySection
        history={form.priceHistory ?? []}
        onChange={h => setForm(f => ({ ...f, priceHistory: h }))}
      />

      <TagInput label="Tags" tags={form.tags} onChange={t => setForm(f => ({ ...f, tags: t }))} />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes</label>
        <textarea className="input" rows={2} value={form.notes ?? ''} onChange={set('notes')} placeholder="Any notes about this glass..." />
      </div>

      {/* Project Usage */}
      {usedInProjects && usedInProjects.length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5 flex items-center gap-1.5">
            <FolderKanban size={12} /> Used in {usedInProjects.length} project{usedInProjects.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {usedInProjects.map(name => (
              <span key={name} className="text-xs bg-white dark:bg-gray-800 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-2 py-0.5 rounded-full">{name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

type ViewMode = 'cards' | 'swatches'

export function GlassPage() {
  const [items, setItems] = useState<GlassItem[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterType, setFilterType] = useState<string>('All')
  const [filterTag, setFilterTag] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GlassItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  // Bulk select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // Glass usage map
  const [glassUsageMap, setGlassUsageMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    getAllGlass().then(setItems)
    getAllProjects().then(projects => {
      const map: Record<string, string[]> = {}
      for (const p of projects) {
        for (const g of p.glassUsed) {
          if (!map[g.glassId]) map[g.glassId] = []
          map[g.glassId].push(p.name)
        }
      }
      setGlassUsageMap(map)
    })
  }, [])

  const allTags = useMemo(() => [...new Set(items.flatMap(i => i.tags))].sort(), [items])

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.colorName.toLowerCase().includes(q) || (i.colorCode ?? '').toLowerCase().includes(q) || (i.manufacturer ?? '').toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))
    const matchS = filterStatus === 'All' || i.status === filterStatus
    const matchT = filterType === 'All' || i.type === filterType
    const matchTag = !filterTag || i.tags.includes(filterTag)
    return matchQ && matchS && matchT && matchTag
  })

  const estValue = items.reduce((sum, i) => sum + (i.costPerSheet ?? 0), 0)

  // Swatch view sorts by color family
  const swatchSorted = viewMode === 'swatches'
    ? [...filtered].sort((a, b) => colorSortKey(a) - colorSortKey(b))
    : filtered

  const handleSave = async (item: GlassItem) => {
    await saveGlass(item)
    setItems(await getAllGlass())
    setModalOpen(false); setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deleteGlass(id)
    setItems(await getAllGlass())
  }

  const openNew = () => { setEditing(emptyGlass()); setModalOpen(true) }
  const openEdit = (item: GlassItem) => { setEditing(item); setModalOpen(true) }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkAddTag = async (tag: string) => {
    const updates = items.filter(i => selectedIds.has(i.id))
    for (const item of updates) {
      if (!item.tags.includes(tag)) {
        await saveGlass({ ...item, tags: [...item.tags, tag] })
      }
    }
    setItems(await getAllGlass())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkRemoveTag = async (tag: string) => {
    const updates = items.filter(i => selectedIds.has(i.id))
    for (const item of updates) {
      await saveGlass({ ...item, tags: item.tags.filter(t => t !== tag) })
    }
    setItems(await getAllGlass())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteGlass(id)
    setItems(await getAllGlass())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkSetStatus = async (status: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      await saveGlass({ ...item, status: status as GlassStatus })
    }
    setItems(await getAllGlass())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  const [shoppingToast, setShoppingToast] = useState<string | null>(null)
  const handleAddToShopping = async (item: GlassItem) => {
    const newItem: ShoppingItem = {
      id: nanoid(),
      name: item.name || item.colorName,
      type: 'Glass',
      supplier: item.supplier,
      priority: item.status === 'Out of Stock' ? 'High' : 'Medium',
      purchased: false,
      notes: item.manufacturer ? `${item.manufacturer}${item.colorCode ? ` #${item.colorCode}` : ''}` : undefined,
      linkedId: item.id,
      createdAt: new Date().toISOString(),
    }
    await saveShopping(newItem)
    setShoppingToast(item.name || item.colorName)
    setTimeout(() => setShoppingToast(null), 2500)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers size={24} className="text-violet-600" />
          Glass Inventory
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Card view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('swatches')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'swatches' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Swatch view"
            >
              <Grid3x3 size={16} />
            </button>
          </div>
          <button
            onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${selectMode ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 text-violet-700 dark:text-violet-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-600'}`}
            title="Multi-select for bulk tag editing"
          >
            <CheckSquare size={15} /> Select
          </button>
          <Button onClick={openNew}><Plus size={16} /> Add Glass</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search glass..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          {GLASS_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterTag === tag ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-400'}`}
            >{tag}</button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} piece{filtered.length !== 1 ? 's' : ''}
          {estValue > 0 && <span className="text-gray-400 dark:text-gray-500"> · Est. value ${estValue.toFixed(2)}</span>}
        </p>
        {selectMode && <p className="text-sm text-violet-600 font-medium">{selectedIds.size} selected — click items to select</p>}
        {viewMode === 'swatches' && !selectMode && <p className="text-xs text-gray-400 dark:text-gray-500">Sorted by color family</p>}
      </div>

      {filtered.length === 0 && items.length === 0 ? (
        <EmptyState icon={Layers} title="No glass yet" description="Start building your stash by adding your first piece of glass." action={{ label: 'Add Glass', onClick: openNew }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filters." />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="relative group">
              <GlassCard
                item={item}
                onClick={() => !selectMode && openEdit(item)}
                onPhotoClick={!selectMode ? (imgs, i) => { setLightboxImages(imgs); setLightboxIndex(i) } : undefined}
                usedInProjects={glassUsageMap[item.id]}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
              {!selectMode && (
                <>
                  {(item.status === 'Low' || item.status === 'Out of Stock') && (
                    <button
                      className="absolute top-2 right-9 bg-white/90 hover:bg-violet-50 text-gray-400 hover:text-violet-600 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      onClick={e => { e.stopPropagation(); handleAddToShopping(item) }}
                      title="Add to shopping list"
                    >
                      <ShoppingCart size={12} />
                    </button>
                  )}
                  <button
                    className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm text-base leading-none"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}
                  >×</button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {swatchSorted.map(item => (
            <div key={item.id} className="relative group">
              <GlassSwatch
                item={item}
                onClick={() => !selectMode && openEdit(item)}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
              {!selectMode && (
                <button
                  className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm text-xs leading-none"
                  onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}
                >×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing?.createdAt === editing?.updatedAt ? 'Add Glass' : 'Edit Glass'} size="lg">
        {editing && (
          <GlassForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setModalOpen(false); setEditing(null) }}
            usedInProjects={glassUsageMap[editing.id]}
          />
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)} title="Delete Glass" message="Are you sure you want to remove this glass from your inventory?" />

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
          <span className="text-sm text-gray-300">Click items to select them</span>
          <button onClick={exitSelectMode} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {shoppingToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2 pointer-events-none">
          <ShoppingCart size={14} className="text-violet-400" />
          <span className="text-sm">Added to shopping list</span>
        </div>
      )}
    </div>
  )
}
