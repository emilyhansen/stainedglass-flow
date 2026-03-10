import { useState, useEffect } from 'react'
import { Plus, ShoppingCart, ExternalLink, Check } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { ShoppingItem, ShoppingItemType } from '../lib/types'
import { getAllShopping, saveShopping, deleteShopping } from '../lib/db'
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
    const updated = { ...item, purchased: !item.purchased }
    await saveShopping(updated)
    setItems(await getAllShopping())
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
            <ShoppingCart size={24} className="text-teal-600" />
            Shopping List
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {pendingCount} item{pendingCount > 1 ? 's' : ''} to buy
              {estimatedTotal > 0 && ` · ~$${estimatedTotal.toFixed(2)}`}
            </p>
          )}
        </div>
        <Button onClick={() => { setEditing(emptyItem()); setModalOpen(true) }}>
          <Plus size={16} /> Add Item
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button onClick={() => setFilterType('All')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'All' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>All</button>
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === t ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{t}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showPurchased} onChange={e => setShowPurchased(e.target.checked)} className="rounded text-teal-600" />
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
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.purchased ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 hover:border-teal-400'}`}
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
            <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-teal-500 hover:text-teal-600 shrink-0">
              <ExternalLink size={15} />
            </a>
          )}
          <button className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={() => onDelete(item.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
