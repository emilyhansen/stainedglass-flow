import { useState, useEffect } from 'react'
import { Plus, ShoppingCart, ExternalLink, Check, RefreshCw, BookOpen } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { ShoppingItem, ShoppingItemType, Pattern } from '../lib/types'
import { getAllShopping, saveShopping, deleteShopping, getAllGlass, saveGlass, getAllSupplies, saveSupply, getAllPatterns } from '../lib/db'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const TYPES: ShoppingItemType[] = ['Glass', 'Supply', 'Pattern', 'Tool', 'Other']
const PRIORITIES = ['High', 'Medium', 'Low'] as const

function emptyItem(): ShoppingItem {
  return { id: nanoid(), name: '', type: 'Glass', supplier: '', url: '', quantity: '', estimatedCost: undefined, priority: 'Medium', purchased: false, notes: '', createdAt: new Date().toISOString() }
}

function ShoppingForm({ initial, onSave, onCancel }: { initial: ShoppingItem; onSave: (i: ShoppingItem) => void; onCancel: () => void }) {
  const [form, setForm] = useState<ShoppingItem>(initial)
  const set = (field: keyof ShoppingItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Cobalt Cathedral Sheet, 60/40 Solder..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="input" value={form.type} onChange={set('type')}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <input className="input" value={form.supplier ?? ''} onChange={set('supplier')} placeholder="e.g. Delphi, Amazon" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input className="input" value={form.quantity ?? ''} onChange={set('quantity')} placeholder="e.g. 2 sheets" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
          <input className="input" type="number" step="0.01" value={form.estimatedCost ?? ''} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value ? +e.target.value : undefined }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <input className="input" type="url" value={form.url ?? ''} onChange={set('url')} placeholder="https://..." />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea className="input" rows={2} value={form.notes ?? ''} onChange={set('notes')} placeholder="Color code, dimensions, specific variant..." />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [filterType, setFilterType] = useState<string>('All')
  const [showPurchased, setShowPurchased] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [restockPrompt, setRestockPrompt] = useState<ShoppingItem | null>(null)
  const [patternPickerOpen, setPatternPickerOpen] = useState(false)
  const [patternPickerSearch, setPatternPickerSearch] = useState('')
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([])
  const [importToast, setImportToast] = useState<string | null>(null)

  useEffect(() => { getAllShopping().then(setItems) }, [])

  const filtered = items.filter(i => {
    const matchT = filterType === 'All' || i.type === filterType
    const matchP = showPurchased || !i.purchased
    return matchT && matchP
  })

  const handleSave = async (item: ShoppingItem) => {
    await saveShopping(item)
    setItems(await getAllShopping())
    setModalOpen(false); setEditing(null)
  }

  const togglePurchased = async (item: ShoppingItem) => {
    const nowPurchased = !item.purchased
    const updated = { ...item, purchased: nowPurchased }
    await saveShopping(updated)
    setItems(await getAllShopping())
    if (nowPurchased && item.linkedId) setRestockPrompt(updated)
  }

  const handleRestock = async () => {
    if (!restockPrompt?.linkedId) return
    if (restockPrompt.type === 'Glass') {
      const all = await getAllGlass()
      const target = all.find(g => g.id === restockPrompt.linkedId)
      if (target) await saveGlass({ ...target, status: 'In Stock' })
    } else if (restockPrompt.type === 'Supply') {
      const all = await getAllSupplies()
      const target = all.find(s => s.id === restockPrompt.linkedId)
      if (target) await saveSupply({ ...target, status: 'In Stock' })
    }
    setRestockPrompt(null)
  }

  const openPatternPicker = async () => {
    if (allPatterns.length === 0) setAllPatterns(await getAllPatterns())
    setPatternPickerSearch('')
    setPatternPickerOpen(true)
  }

  const handleImportFromPattern = async (pattern: Pattern) => {
    if (pattern.glassPlan.length === 0) {
      setImportToast(`"${pattern.name}" has no glass plan entries`)
      setPatternPickerOpen(false)
      setTimeout(() => setImportToast(null), 3000)
      return
    }
    const now = new Date().toISOString()
    for (const entry of pattern.glassPlan) {
      await saveShopping({ id: nanoid(), name: entry.glassName, type: 'Glass', priority: 'Medium', purchased: false, notes: `From pattern: ${pattern.name}`, linkedId: entry.glassId, createdAt: now })
    }
    setItems(await getAllShopping())
    setPatternPickerOpen(false)
    const n = pattern.glassPlan.length
    setImportToast(`Added ${n} item${n !== 1 ? 's' : ''} from "${pattern.name}"`)
    setTimeout(() => setImportToast(null), 3000)
  }

  const handleDelete = async (id: string) => {
    await deleteShopping(id)
    setItems(await getAllShopping())
  }

  const pendingCount = items.filter(i => !i.purchased).length
  const estimatedTotal = items.filter(i => !i.purchased && i.estimatedCost).reduce((s, i) => s + (i.estimatedCost ?? 0), 0)

  const byType = TYPES.reduce((acc, t) => {
    const typeItems = filtered.filter(i => i.type === t)
    if (typeItems.length > 0) acc[t] = typeItems
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={24} className="text-violet-600" />
            Shopping List
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {pendingCount} item{pendingCount > 1 ? 's' : ''} to buy
              {estimatedTotal > 0 && ` · ~$${estimatedTotal.toFixed(2)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={openPatternPicker}>
            <BookOpen size={16} /> From Pattern
          </Button>
          <Button onClick={() => { setEditing(emptyItem()); setModalOpen(true) }}>
            <Plus size={16} /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button onClick={() => setFilterType('All')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'All' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>All</button>
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === t ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{t}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showPurchased} onChange={e => setShowPurchased(e.target.checked)} className="rounded text-violet-600" />
          Show purchased
        </label>
      </div>

      {filtered.length === 0 && items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Shopping list is empty" description="Add glass, supplies, or patterns you need to buy." action={{ label: 'Add Item', onClick: () => { setEditing(emptyItem()); setModalOpen(true) } }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Check} title="All done!" description="Everything on your list has been purchased." />
      ) : filterType !== 'All' ? (
        <ItemList items={filtered} onEdit={item => { setEditing(item); setModalOpen(true) }} onToggle={togglePurchased} onDelete={id => setDeleteTarget(id)} />
      ) : (
        <div className="space-y-6">
          {Object.entries(byType).map(([type, typeItems]) => (
            <div key={type}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{type}</h2>
              <ItemList items={typeItems} onEdit={item => { setEditing(item); setModalOpen(true) }} onToggle={togglePurchased} onDelete={id => setDeleteTarget(id)} />
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing?.name ? 'Edit Item' : 'Add Item'} size="md">
        {editing && <ShoppingForm initial={editing} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditing(null) }} />}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)} title="Remove Item" message="Remove this item from your shopping list?" />

      <Modal open={patternPickerOpen} onClose={() => setPatternPickerOpen(false)} title="Add from Pattern" size="md">
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Search patterns..."
            value={patternPickerSearch}
            onChange={e => setPatternPickerSearch(e.target.value)}
            autoFocus
          />
          {allPatterns.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No patterns in your library yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {allPatterns
                .filter(p => !patternPickerSearch || p.name.toLowerCase().includes(patternPickerSearch.toLowerCase()))
                .map(p => (
                  <button
                    key={p.id}
                    className="w-full text-left bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 rounded-xl px-3 py-2.5 transition-colors"
                    onClick={() => handleImportFromPattern(p)}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {p.glassPlan.length > 0
                        ? `${p.glassPlan.length} glass color${p.glassPlan.length !== 1 ? 's' : ''} in plan`
                        : 'No glass plan'}
                      {p.difficulty ? ` · ${p.difficulty}` : ''}
                    </p>
                  </button>
                ))
              }
              {allPatterns.filter(p => !patternPickerSearch || p.name.toLowerCase().includes(patternPickerSearch.toLowerCase())).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No patterns match your search.</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {restockPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
          <RefreshCw size={15} className="text-violet-400 shrink-0" />
          <span className="text-sm text-gray-200">Mark <span className="font-medium">{restockPrompt.name}</span> as In Stock?</span>
          <button
            onClick={handleRestock}
            className="text-sm bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Mark In Stock
          </button>
          <button onClick={() => setRestockPrompt(null)} className="text-gray-400 hover:text-white shrink-0 text-lg leading-none">×</button>
        </div>
      )}

      {importToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2 pointer-events-none">
          <BookOpen size={14} className="text-violet-400" />
          <span className="text-sm">{importToast}</span>
        </div>
      )}
    </div>
  )
}

function ItemList({ items, onEdit, onToggle, onDelete }: { items: ShoppingItem[]; onEdit: (i: ShoppingItem) => void; onToggle: (i: ShoppingItem) => void; onDelete: (id: string) => void }) {
  const sorted = [...items].sort((a, b) => {
    const p = { High: 0, Medium: 1, Low: 2 }
    return p[a.priority] - p[b.priority]
  })

  return (
    <div className="space-y-2">
      {sorted.map(item => (
        <div key={item.id} className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 flex items-center gap-3 group transition-opacity ${item.purchased ? 'opacity-50' : ''}`}>
          <button
            onClick={() => onToggle(item)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.purchased ? 'bg-violet-500 border-violet-500 text-white' : 'border-gray-300 hover:border-violet-400'}`}
          >
            {item.purchased && <Check size={11} />}
          </button>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(item)}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{item.name}</span>
              <Badge label={item.priority} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {item.supplier && <span className="text-xs text-gray-500 dark:text-gray-400">{item.supplier}</span>}
              {item.quantity && <span className="text-xs text-gray-400 dark:text-gray-500">{item.quantity}</span>}
              {item.estimatedCost && <span className="text-xs text-gray-500 dark:text-gray-400">${item.estimatedCost.toFixed(2)}</span>}
              {item.notes && <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.notes}</span>}
            </div>
          </div>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-violet-500 hover:text-violet-600 shrink-0">
              <ExternalLink size={15} />
            </a>
          )}
          <button className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={() => onDelete(item.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
