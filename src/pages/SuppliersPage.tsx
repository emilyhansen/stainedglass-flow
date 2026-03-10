import { useState, useEffect } from 'react'
import { Plus, Search, Store, Globe, MapPin, Star, ExternalLink } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { Supplier, SupplierType, SupplierSpecialty } from '../lib/types'
import { getAllSuppliers, saveSupplier, deleteSupplier } from '../lib/db'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ImageUpload } from '../components/ui/ImageUpload'


const TYPES: SupplierType[] = ['Online', 'Local', 'Both']
const SPECIALTIES: SupplierSpecialty[] = ['Glass', 'Supplies', 'Tools', 'Patterns', 'Equipment', 'Other']

function emptySupplier(): Supplier {
  const n = new Date().toISOString()
  return { id: nanoid(), name: '', type: 'Online', website: '', email: '', phone: '', address: '', specialty: [], notes: '', rating: undefined, photos: [], createdAt: n, updatedAt: n }
}

function StarRating({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className={`transition-colors ${n <= (value ?? 0) ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}
        >
          <Star size={20} fill={n <= (value ?? 0) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

function SupplierCard({ item, onClick, onDelete: _onDelete }: { item: Supplier; onClick: () => void; onDelete: () => void }) {
  const typeIcon = item.type === 'Online' ? <Globe size={12} /> : item.type === 'Local' ? <MapPin size={12} /> : <Store size={12} />
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-700 transition-all cursor-pointer" onClick={onClick}>
      <div className="h-32 bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700 rounded-t-2xl overflow-hidden">
        {item.photos[0] ? (
          <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={32} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-1">{item.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          {typeIcon}
          <span>{item.type}</span>
        </div>
        {item.specialty.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {item.specialty.slice(0, 3).map(s => (
              <span key={s} className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
        {item.rating ? (
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={11} className={n <= item.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
            ))}
          </div>
        ) : null}
        {item.website && (
          <a
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-1.5 truncate"
          >
            <ExternalLink size={10} />
            {item.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        )}
      </div>
    </div>
  )
}

function SupplierForm({ initial, onSave, onCancel }: { initial: Supplier; onSave: (s: Supplier) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Supplier>(initial)
  const set = (field: keyof Supplier) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const toggleSpecialty = (s: SupplierSpecialty) => {
    setForm(f => ({
      ...f,
      specialty: f.specialty.includes(s) ? f.specialty.filter(x => x !== s) : [...f.specialty, s],
    }))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <ImageUpload images={form.photos} onChange={p => setForm(f => ({ ...f, photos: p }))} maxImages={3} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Delphi Glass, Anything in Stained Glass" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="input" value={form.type} onChange={set('type')}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
          <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v || undefined }))} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                form.specialty.includes(s)
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input className="input" type="url" value={form.website ?? ''} onChange={set('website')} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="input" type="email" value={form.email ?? ''} onChange={set('email')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input className="input" type="tel" value={form.phone ?? ''} onChange={set('phone')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input className="input" value={form.address ?? ''} onChange={set('address')} placeholder="For local suppliers" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea className="input" rows={3} value={form.notes ?? ''} onChange={set('notes')} placeholder="Shipping notes, favorite products, discount codes, hours..." />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [filterSpecialty, setFilterSpecialty] = useState<string>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => { getAllSuppliers().then(setItems) }, [])

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || i.name.toLowerCase().includes(q) || (i.website ?? '').toLowerCase().includes(q) || (i.notes ?? '').toLowerCase().includes(q)
    const matchT = filterType === 'All' || i.type === filterType
    const matchS = filterSpecialty === 'All' || i.specialty.includes(filterSpecialty as SupplierSpecialty)
    return matchQ && matchT && matchS
  })

  const handleSave = async (item: Supplier) => {
    await saveSupplier(item)
    setItems(await getAllSuppliers())
    setModalOpen(false); setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deleteSupplier(id)
    setItems(await getAllSuppliers())
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Store size={24} className="text-teal-600" />
          Suppliers
        </h1>
        <Button onClick={() => { setEditing(emptySupplier()); setModalOpen(true) }}>
          <Plus size={16} /> Add Supplier
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input w-40" value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
          <option value="All">All Specialties</option>
          {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{filtered.length} supplier{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 && items.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No suppliers yet"
          description="Keep track of your favorite glass shops, online stores, and local suppliers."
          action={{ label: 'Add Supplier', onClick: () => { setEditing(emptySupplier()); setModalOpen(true) } }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="relative group">
              <SupplierCard item={item} onClick={() => { setEditing(item); setModalOpen(true) }} onDelete={() => setDeleteTarget(item.id)} />
              <button
                className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm text-base leading-none"
                onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing?.name ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        {editing && <SupplierForm initial={editing} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditing(null) }} />}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)} title="Remove Supplier" message="Remove this supplier from your list?" />
    </div>
  )
}
