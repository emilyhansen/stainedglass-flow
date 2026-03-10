import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Package, CheckSquare, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { Supply, SupplyCategory, SupplyStatus, Project } from '../lib/types'
import { getAllSupplies, saveSupply, deleteSupply, getAllProjects } from '../lib/db'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ImageUpload } from '../components/ui/ImageUpload'
import { TagInput } from '../components/ui/TagInput'
import { BulkTagBar } from '../components/ui/BulkTagBar'

const CATEGORIES: SupplyCategory[] = ['Lead Came', 'Copper Foil', 'Solder', 'Flux', 'Patina', 'Cutting Tools', 'Grinder', 'Safety', 'Hanging Hardware', 'Adhesive', 'Cleaning', 'Other']
const STATUSES: SupplyStatus[] = ['In Stock', 'Low', 'Out of Stock']

function emptySupply(): Supply {
  const n = new Date().toISOString()
  return { id: nanoid(), name: '', category: 'Copper Foil', brand: '', supplier: '', quantity: '', unit: '', status: 'In Stock', reorderThreshold: '', costPerUnit: undefined, notes: '', photos: [], tags: [], createdAt: n, updatedAt: n }
}

function SupplyCard({
  item, usageCount, onClick, onDelete: _onDelete, selectMode, selected, onToggleSelect,
}: {
  item: Supply
  usageCount: number
  onClick: () => void
  onDelete: () => void
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const categoryIcon: Record<SupplyCategory, string> = {
    'Lead Came': '🔩', 'Copper Foil': '🥉', 'Solder': '⚡', 'Flux': '🧪', 'Patina': '🎨',
    'Cutting Tools': '✂️', 'Grinder': '⚙️', 'Safety': '🦺', 'Hanging Hardware': '🪝',
    'Adhesive': '🔗', 'Cleaning': '🧹', 'Other': '📦',
  }
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${selected ? 'border-teal-400 ring-2 ring-teal-200' : 'border-gray-100 dark:border-gray-800 hover:border-teal-200 dark:hover:border-teal-700'}`}
      onClick={selectMode ? onToggleSelect : onClick}
    >
      {selectMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selected ? 'bg-teal-500 border-teal-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
            {selected && <svg viewBox="0 0 10 10" className="w-3 h-3 text-white fill-none stroke-current stroke-2"><polyline points="1.5,5 4,8 8.5,2" /></svg>}
          </div>
        </div>
      )}
      <div className="aspect-square bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700 rounded-t-2xl overflow-hidden">
        {item.photos[0] ? (
          <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {categoryIcon[item.category]}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{item.name}</h3>
          <Badge label={item.status} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.category}{item.brand ? ` · ${item.brand}` : ''}</p>
        {item.quantity && <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</p>}
        {usageCount > 0 && (
          <p className="text-xs text-teal-600 mt-1 font-medium">Used in {usageCount} project{usageCount !== 1 ? 's' : ''}</p>
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

function SupplyForm({ initial, onSave, onCancel }: { initial: Supply; onSave: (s: Supply) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Supply>(initial)
  const set = (field: keyof Supply) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <ImageUpload images={form.photos} onChange={p => setForm(f => ({ ...f, photos: p }))} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. 7/32&quot; Copper Foil" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Brand</label>
          <input className="input" value={form.brand ?? ''} onChange={set('brand')} placeholder="e.g. Venture, Canfield" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Supplier</label>
          <input className="input" value={form.supplier ?? ''} onChange={set('supplier')} placeholder="e.g. Delphi Glass" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Quantity</label>
          <input className="input" value={form.quantity ?? ''} onChange={set('quantity')} placeholder="e.g. 3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Unit</label>
          <input className="input" value={form.unit ?? ''} onChange={set('unit')} placeholder="rolls, lbs, oz..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Cost per Unit ($)</label>
          <input className="input" type="number" step="0.01" value={form.costPerUnit ?? ''} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value ? +e.target.value : undefined }))} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Reorder Threshold</label>
        <input className="input" value={form.reorderThreshold ?? ''} onChange={set('reorderThreshold')} placeholder="e.g. Less than 1 roll" />
      </div>

      <TagInput label="Tags" tags={form.tags} onChange={t => setForm(f => ({ ...f, tags: t }))} />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes</label>
        <textarea className="input" rows={2} value={form.notes ?? ''} onChange={set('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export function SuppliesPage() {
  const [items, setItems] = useState<Supply[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterTag, setFilterTag] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supply | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  // Bulk select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    getAllSupplies().then(setItems)
    getAllProjects().then(setAllProjects)
  }, [])

  const supplyUsageMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    allProjects.forEach(p => {
      p.suppliesUsed.forEach(s => {
        if (!map[s.supplyId]) map[s.supplyId] = []
        map[s.supplyId].push(p.name)
      })
    })
    return map
  }, [allProjects])

  const allTags = useMemo(() => [...new Set(items.flatMap(i => i.tags))].sort(), [items])

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))
    const matchC = filterCategory === 'All' || i.category === filterCategory
    const matchS = filterStatus === 'All' || i.status === filterStatus
    const matchTag = !filterTag || i.tags.includes(filterTag)
    return matchQ && matchC && matchS && matchTag
  })

  const estValue = items.reduce((sum, i) => sum + (i.costPerUnit ?? 0), 0)

  // Group by category for display
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {} as Record<string, Supply[]>)

  const handleSave = async (item: Supply) => {
    await saveSupply(item)
    setItems(await getAllSupplies())
    setModalOpen(false); setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deleteSupply(id)
    setItems(await getAllSupplies())
  }

  const lowCount = items.filter(i => i.status === 'Low' || i.status === 'Out of Stock').length

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkAddTag = async (tag: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      if (!item.tags.includes(tag)) await saveSupply({ ...item, tags: [...item.tags, tag] })
    }
    setItems(await getAllSupplies())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkRemoveTag = async (tag: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      await saveSupply({ ...item, tags: item.tags.filter(t => t !== tag) })
    }
    setItems(await getAllSupplies())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteSupply(id)
    setItems(await getAllSupplies())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  const renderGrid = (gridItems: Supply[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {gridItems.map(item => (
        <div key={item.id} className="relative group">
          <SupplyCard
            item={item}
            usageCount={supplyUsageMap[item.id]?.length ?? 0}
            onClick={() => { if (!selectMode) { setEditing(item); setModalOpen(true) } }}
            onDelete={() => setDeleteTarget(item.id)}
            selectMode={selectMode}
            selected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
          />
          {!selectMode && (
            <button
              className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm text-base leading-none font-bold"
              onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}
            >×</button>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={24} className="text-teal-600" />
            Supplies
          </h1>
          {lowCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5 font-medium">{lowCount} item{lowCount > 1 ? 's' : ''} low or out of stock</p>
          )}
          {estValue > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">Est. value ${estValue.toFixed(2)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${selectMode ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 text-teal-700 dark:text-teal-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-600'}`}
          >
            <CheckSquare size={15} /> Select
          </button>
          <Button onClick={() => { setEditing(emptySupply()); setModalOpen(true) }}>
            <Plus size={16} /> Add Supply
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search supplies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterTag === tag ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-teal-400'}`}
            >{tag}</button>
          ))}
        </div>
      )}

      {selectMode && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
          <CheckSquare size={15} className="text-teal-600" />
          <span className="text-sm text-teal-700 dark:text-teal-400 font-medium">{selectedIds.size} selected — click items to select</span>
          <button onClick={exitSelectMode} className="ml-auto text-teal-500 hover:text-teal-700"><X size={14} /></button>
        </div>
      )}

      {filtered.length === 0 && items.length === 0 ? (
        <EmptyState icon={Package} title="No supplies yet" description="Track your copper foil, solder, flux, came, and other supplies." action={{ label: 'Add Supply', onClick: () => { setEditing(emptySupply()); setModalOpen(true) } }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filters." />
      ) : filterCategory !== 'All' ? (
        renderGrid(filtered)
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">{cat}</h2>
              {renderGrid(catItems)}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing?.name ? 'Edit Supply' : 'Add Supply'} size="lg">
        {editing && <SupplyForm initial={editing} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditing(null) }} />}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)} title="Delete Supply" message="Remove this supply from your inventory?" />

      {selectMode && selectedIds.size > 0 && (
        <BulkTagBar
          count={selectedIds.size}
          onAddTag={handleBulkAddTag}
          onRemoveTag={handleBulkRemoveTag}
          onDelete={handleBulkDelete}
          onCancel={exitSelectMode}
        />
      )}
    </div>
  )
}
