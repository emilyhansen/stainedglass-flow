import { useState, useEffect } from 'react'
import { Plus, Search, FolderKanban, Calendar, ChevronRight, DollarSign, Layers, Package, X, Printer, BookOpen, CheckSquare } from 'lucide-react'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import type { Project, ProjectStatus, ProjectType, ProjectGlassUsage, ProjectSupplyUsage, GlassItem, Supply, Pattern, ShoppingItem } from '../lib/types'
import { getAllProjects, saveProject, deleteProject, getAllGlass, getAllSupplies, saveShopping, getAllPatterns } from '../lib/db'
import { Button } from '../components/ui/Button'

import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ImageUpload } from '../components/ui/ImageUpload'
import { TagInput } from '../components/ui/TagInput'
import { Lightbox } from '../components/ui/Lightbox'
import { BulkTagBar } from '../components/ui/BulkTagBar'

const STATUSES: ProjectStatus[] = ['Planning', 'In Progress', 'On Hold', 'Completed']
const TYPES: ProjectType[] = ['Panel', 'Suncatcher', 'Lamp', 'Mosaic', 'Repair', 'Box', 'Mirror Frame', 'Other']

function emptyProject(): Project {
  const n = new Date().toISOString()
  return {
    id: nanoid(), name: '', type: 'Panel', status: 'Planning', patternId: '', patternName: '',
    coverPhoto: '', progressPhotos: [], glassUsed: [], suppliesUsed: [], description: '',
    nextStep: '', deadline: '', startDate: '', completedDate: '', estimatedCost: undefined,
    actualCost: undefined, commissionMarkup: 0, commissionLaborRate: undefined,
    commissionLaborHours: undefined, recipient: '', tags: [], journal: [], createdAt: n, updatedAt: n,
  }
}

const statusColors: Record<ProjectStatus, string> = {
  Planning: 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
}

function ProjectCard({ item, onClick, onPhotoClick, selectMode, selected, onToggleSelect }: { item: Project; onClick: () => void; onPhotoClick?: (images: string[], index: number) => void; selectMode?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const photos = [...(item.coverPhoto ? [item.coverPhoto] : []), ...item.progressPhotos]
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
        className="aspect-[16/10] bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-700 rounded-t-2xl overflow-hidden relative"
        onClick={!selectMode && photos.length > 0 && onPhotoClick ? e => { e.stopPropagation(); onPhotoClick(photos, 0) } : undefined}
      >
        {item.coverPhoto ? (
          <img src={item.coverPhoto} alt={item.name} className={`w-full h-full object-cover ${photos.length > 0 && onPhotoClick ? 'cursor-zoom-in' : ''}`} />
        ) : item.progressPhotos[0] ? (
          <img src={item.progressPhotos[0]} alt={item.name} className={`w-full h-full object-cover ${photos.length > 0 && onPhotoClick ? 'cursor-zoom-in' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderKanban size={36} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>{item.status}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1 truncate">{item.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.type}</p>
        {item.patternName && (
          <div className="flex items-center gap-1 text-xs text-purple-600 mb-1.5">
            <BookOpen size={10} />
            <span className="truncate">{item.patternName}</span>
          </div>
        )}
        {item.deadline && (
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Calendar size={11} />
            <span>Due {format(new Date(item.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}
        {item.nextStep && (
          <div className="flex items-center gap-1 text-xs text-violet-600 mt-1.5 font-medium">
            <ChevronRight size={12} />
            <span className="truncate">{item.nextStep}</span>
          </div>
        )}
        {(item.actualCost || item.estimatedCost) && (
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
            <DollarSign size={10} />
            <span>{item.actualCost ? `$${item.actualCost.toFixed(2)} actual` : `$${item.estimatedCost!.toFixed(2)} est.`}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Cost Calculator sub-component used inside ProjectForm
function MaterialsSection({
  glassUsed,
  suppliesUsed,
  allGlass,
  allSupplies,
  onChange,
}: {
  glassUsed: ProjectGlassUsage[]
  suppliesUsed: ProjectSupplyUsage[]
  allGlass: GlassItem[]
  allSupplies: Supply[]
  onChange: (g: ProjectGlassUsage[], s: ProjectSupplyUsage[]) => void
}) {
  const [glassSearch, setGlassSearch] = useState('')
  const [supplySearch, setSupplySearch] = useState('')

  const addGlass = (g: GlassItem) => {
    if (glassUsed.find(u => u.glassId === g.id)) return
    onChange([...glassUsed, { glassId: g.id, glassName: g.name || g.colorName, amount: '', multiplier: 1 }], suppliesUsed)
    setGlassSearch('')
  }

  const removeGlass = (id: string) => onChange(glassUsed.filter(u => u.glassId !== id), suppliesUsed)
  const updateGlass = (id: string, patch: Partial<ProjectGlassUsage>) =>
    onChange(glassUsed.map(u => u.glassId === id ? { ...u, ...patch } : u), suppliesUsed)

  const addSupply = (s: Supply) => {
    if (suppliesUsed.find(u => u.supplyId === s.id)) return
    onChange(glassUsed, [...suppliesUsed, { supplyId: s.id, supplyName: s.name, amount: '', multiplier: 1 }])
    setSupplySearch('')
  }

  const removeSupply = (id: string) => onChange(glassUsed, suppliesUsed.filter(u => u.supplyId !== id))
  const updateSupply = (id: string, patch: Partial<ProjectSupplyUsage>) =>
    onChange(glassUsed, suppliesUsed.map(u => u.supplyId === id ? { ...u, ...patch } : u))

  const glassSuggestions = glassSearch
    ? allGlass.filter(g => (g.name || g.colorName).toLowerCase().includes(glassSearch.toLowerCase())).slice(0, 5)
    : []
  const supplySuggestions = supplySearch
    ? allSupplies.filter(s => s.name.toLowerCase().includes(supplySearch.toLowerCase())).slice(0, 5)
    : []

  // Cost totals
  const glassById = Object.fromEntries(allGlass.map(g => [g.id, g]))
  const supplyById = Object.fromEntries(allSupplies.map(s => [s.id, s]))

  const glassCost = glassUsed.reduce((sum, u) => {
    const cost = glassById[u.glassId]?.costPerSheet ?? 0
    return sum + cost * (u.multiplier ?? 1)
  }, 0)
  const supplyCost = suppliesUsed.reduce((sum, u) => {
    const cost = supplyById[u.supplyId]?.costPerUnit ?? 0
    return sum + cost * (u.multiplier ?? 1)
  }, 0)
  const totalCost = glassCost + supplyCost

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Materials &amp; Cost Calculator</h3>
        {totalCost > 0 && (
          <div className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-sm font-semibold">
            Total: ${totalCost.toFixed(2)}
          </div>
        )}
      </div>

      {/* Glass used */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          <Layers size={12} /> Glass Used
        </div>

        {glassUsed.length > 0 && (
          <div className="space-y-2 mb-2">
            {glassUsed.map(u => {
              const cost = (glassById[u.glassId]?.costPerSheet ?? 0) * (u.multiplier ?? 1)
              return (
                <div key={u.glassId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                  <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{u.glassName}</span>
                  <input
                    className="input w-28 text-xs py-1"
                    placeholder="Amount (e.g. ½ sheet)"
                    value={u.amount ?? ''}
                    onChange={e => updateGlass(u.glassId, { amount: e.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">×</span>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      className="input w-16 text-xs py-1"
                      placeholder="1"
                      value={u.multiplier ?? 1}
                      onChange={e => updateGlass(u.glassId, { multiplier: +e.target.value || 1 })}
                    />
                  </div>
                  {glassById[u.glassId]?.costPerSheet ? (
                    <span className="text-xs text-gray-500 w-14 text-right shrink-0">${cost.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-gray-300 w-14 text-right shrink-0">no cost</span>
                  )}
                  <button type="button" onClick={() => removeGlass(u.glassId)} className="text-gray-300 hover:text-red-400 shrink-0"><X size={14} /></button>
                </div>
              )
            })}
          </div>
        )}

        <div className="relative">
          <input
            className="input text-sm"
            placeholder="Search glass to add..."
            value={glassSearch}
            onChange={e => setGlassSearch(e.target.value)}
          />
          {glassSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 overflow-hidden">
              {glassSuggestions.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => addGlass(g)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm text-left dark:text-gray-200"
                >
                  {g.photos[0] && <img src={g.photos[0]} alt="" className="w-6 h-6 rounded object-cover" />}
                  <span className="flex-1 truncate">{g.name || g.colorName}</span>
                  {g.costPerSheet && <span className="text-xs text-gray-400">${g.costPerSheet}/sheet</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supplies used */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          <Package size={12} /> Supplies Used
        </div>

        {suppliesUsed.length > 0 && (
          <div className="space-y-2 mb-2">
            {suppliesUsed.map(u => {
              const cost = (supplyById[u.supplyId]?.costPerUnit ?? 0) * (u.multiplier ?? 1)
              return (
                <div key={u.supplyId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                  <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{u.supplyName}</span>
                  <input
                    className="input w-28 text-xs py-1"
                    placeholder="Amount"
                    value={u.amount ?? ''}
                    onChange={e => updateSupply(u.supplyId, { amount: e.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">×</span>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      className="input w-16 text-xs py-1"
                      placeholder="1"
                      value={u.multiplier ?? 1}
                      onChange={e => updateSupply(u.supplyId, { multiplier: +e.target.value || 1 })}
                    />
                  </div>
                  {supplyById[u.supplyId]?.costPerUnit ? (
                    <span className="text-xs text-gray-500 w-14 text-right shrink-0">${cost.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-gray-300 w-14 text-right shrink-0">no cost</span>
                  )}
                  <button type="button" onClick={() => removeSupply(u.supplyId)} className="text-gray-300 hover:text-red-400 shrink-0"><X size={14} /></button>
                </div>
              )
            })}
          </div>
        )}

        <div className="relative">
          <input
            className="input text-sm"
            placeholder="Search supplies to add..."
            value={supplySearch}
            onChange={e => setSupplySearch(e.target.value)}
          />
          {supplySuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 overflow-hidden">
              {supplySuggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSupply(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm text-left dark:text-gray-200"
                >
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.category}</span>
                  {s.costPerUnit && <span className="text-xs text-gray-400">${s.costPerUnit}/{s.unit || 'unit'}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost summary */}
      {(glassUsed.length > 0 || suppliesUsed.length > 0) && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm space-y-1">
          {glassCost > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Glass</span><span>${glassCost.toFixed(2)}</span></div>}
          {supplyCost > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Supplies</span><span>${supplyCost.toFixed(2)}</span></div>}
          {totalCost > 0 && (
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Total Materials</span><span>${totalCost.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CommissionSection({ form, setForm, allGlass, allSupplies }: {
  form: Project
  setForm: React.Dispatch<React.SetStateAction<Project>>
  allGlass: GlassItem[]
  allSupplies: Supply[]
}) {
  const glassById = Object.fromEntries(allGlass.map(g => [g.id, g]))
  const supplyById = Object.fromEntries(allSupplies.map(s => [s.id, s]))
  const materialsCost =
    form.glassUsed.reduce((s, u) => s + (glassById[u.glassId]?.costPerSheet ?? 0) * (u.multiplier ?? 1), 0) +
    (form.suppliesUsed ?? []).reduce((s, u) => s + (supplyById[u.supplyId]?.costPerUnit ?? 0) * (u.multiplier ?? 1), 0)

  const laborRate = form.commissionLaborRate ?? 0
  const laborHours = form.commissionLaborHours ?? 0
  const laborCost = laborRate * laborHours
  const baseCost = materialsCost + laborCost
  const markupPct = form.commissionMarkup ?? 0
  const markupAmt = baseCost * (markupPct / 100)
  const suggestedPrice = baseCost + markupAmt

  return (
    <div className="border-t border-gray-100 pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Commission Pricing</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Labor Rate ($/hr)</label>
          <input
            className="input"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 25"
            value={form.commissionLaborRate ?? ''}
            onChange={e => setForm(f => ({ ...f, commissionLaborRate: e.target.value ? +e.target.value : undefined }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
          <input
            className="input"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 10"
            value={form.commissionLaborHours ?? ''}
            onChange={e => setForm(f => ({ ...f, commissionLaborHours: e.target.value ? +e.target.value : undefined }))}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Markup: {markupPct}%
        </label>
        <input
          type="range"
          min="0"
          max="300"
          step="5"
          className="w-full accent-violet-600"
          value={markupPct}
          onChange={e => setForm(f => ({ ...f, commissionMarkup: +e.target.value }))}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>0%</span><span>150%</span><span>300%</span>
        </div>
      </div>

      {(baseCost > 0 || markupPct > 0) && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
          {materialsCost > 0 && (
            <div className="flex justify-between text-gray-600"><span>Materials</span><span>${materialsCost.toFixed(2)}</span></div>
          )}
          {laborCost > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Labor ({laborHours}h × ${laborRate}/hr)</span>
              <span>${laborCost.toFixed(2)}</span>
            </div>
          )}
          {markupPct > 0 && baseCost > 0 && (
            <div className="flex justify-between text-gray-600"><span>Markup ({markupPct}%)</span><span>+${markupAmt.toFixed(2)}</span></div>
          )}
          {suggestedPrice > 0 && (
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
              <span>Suggested Price</span><span>${suggestedPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectForm({ initial, onSave, onCancel, allGlass, allSupplies, allPatterns }: {
  initial: Project
  onSave: (p: Project) => void
  onCancel: () => void
  allGlass: GlassItem[]
  allSupplies: Supply[]
  allPatterns: Pattern[]
}) {
  const [form, setForm] = useState<Project>({ ...initial, suppliesUsed: initial.suppliesUsed ?? [] })
  const [journalText, setJournalText] = useState('')
  const [journalPhotos, setJournalPhotos] = useState<string[]>([])
  const [patternSearch, setPatternSearch] = useState('')
  const [journalLightbox, setJournalLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const set = (field: keyof Project) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const addJournalEntry = () => {
    if (!journalText.trim() && journalPhotos.length === 0) return
    const entry = { id: nanoid(), date: new Date().toISOString(), text: journalText, photos: journalPhotos }
    setForm(f => ({ ...f, journal: [...f.journal, entry] }))
    setJournalText(''); setJournalPhotos([])
  }

  const handlePrint = () => {
    const glassById = Object.fromEntries(allGlass.map(g => [g.id, g]))
    const supplyById = Object.fromEntries(allSupplies.map(s => [s.id, s]))
    const glassCost = form.glassUsed.reduce((s, u) => s + (glassById[u.glassId]?.costPerSheet ?? 0) * (u.multiplier ?? 1), 0)
    const supplyCost = (form.suppliesUsed ?? []).reduce((s, u) => s + (supplyById[u.supplyId]?.costPerUnit ?? 0) * (u.multiplier ?? 1), 0)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>${form.name}</title><style>
      body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;color:#111;padding:0 20px}
      h1{font-size:1.5rem;margin-bottom:4px} .meta{color:#555;font-size:.9rem;margin-bottom:20px}
      h2{font-size:1rem;font-weight:600;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:24px}
      table{width:100%;border-collapse:collapse;font-size:.85rem} td,th{padding:5px 8px;text-align:left;border-bottom:1px solid #eee}
      th{font-weight:600;background:#f9f9f9} .total{font-weight:600} p{margin:6px 0;font-size:.9rem}
      @media print{body{margin:0}}
    </style></head><body>
      <h1>${form.name}</h1>
      <div class="meta">${form.type} · ${form.status}${form.deadline ? ` · Due ${new Date(form.deadline).toLocaleDateString()}` : ''}${form.recipient ? ` · For ${form.recipient}` : ''}</div>
      ${form.description ? `<p>${form.description}</p>` : ''}
      ${form.nextStep ? `<p><strong>Next step:</strong> ${form.nextStep}</p>` : ''}
      ${form.glassUsed.length > 0 ? `<h2>Glass Used</h2><table><tr><th>Glass</th><th>Amount</th><th>Multiplier</th><th>Cost</th></tr>
        ${form.glassUsed.map(u => { const cost = (glassById[u.glassId]?.costPerSheet ?? 0) * (u.multiplier ?? 1); return `<tr><td>${u.glassName}</td><td>${u.amount ?? ''}</td><td>${u.multiplier ?? 1}</td><td>${cost > 0 ? '$' + cost.toFixed(2) : '—'}</td></tr>` }).join('')}
        <tr class="total"><td colspan="3">Glass subtotal</td><td>$${glassCost.toFixed(2)}</td></tr></table>` : ''}
      ${(form.suppliesUsed ?? []).length > 0 ? `<h2>Supplies Used</h2><table><tr><th>Supply</th><th>Amount</th><th>Multiplier</th><th>Cost</th></tr>
        ${(form.suppliesUsed ?? []).map(u => { const cost = (supplyById[u.supplyId]?.costPerUnit ?? 0) * (u.multiplier ?? 1); return `<tr><td>${u.supplyName}</td><td>${u.amount ?? ''}</td><td>${u.multiplier ?? 1}</td><td>${cost > 0 ? '$' + cost.toFixed(2) : '—'}</td></tr>` }).join('')}
        <tr class="total"><td colspan="3">Supplies subtotal</td><td>$${supplyCost.toFixed(2)}</td></tr></table>` : ''}
      ${(glassCost + supplyCost) > 0 ? `<p style="font-size:1rem;font-weight:600;margin-top:16px">Total: $${(glassCost + supplyCost).toFixed(2)}</p>` : ''}
      ${form.journal.length > 0 ? `<h2>Journal</h2>${form.journal.map(e => `<p><strong>${new Date(e.date).toLocaleDateString()}</strong> — ${e.text}</p>`).join('')}` : ''}
    </body></html>`)
    win.document.close()
    win.print()
  }

  const coverPhoto = form.coverPhoto || form.progressPhotos[0] || ''

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, coverPhoto }) }} className="space-y-5">
      <ImageUpload label="Progress Photos" images={form.progressPhotos} onChange={p => setForm(f => ({ ...f, progressPhotos: p }))} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Sunflower Panel for Mom" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <select className="input" value={form.type} onChange={set('type')}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Pattern linking */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Based on Pattern</label>
        {form.patternId ? (
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl px-3 py-2">
            <BookOpen size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="text-sm text-purple-800 dark:text-purple-300 flex-1 truncate">{form.patternName}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, patternId: '', patternName: '' }))} className="text-purple-400 hover:text-purple-600 shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              className="input"
              placeholder="Search patterns to link..."
              value={patternSearch}
              onChange={e => setPatternSearch(e.target.value)}
            />
            {patternSearch && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 overflow-hidden">
                {allPatterns.filter(p => p.name.toLowerCase().includes(patternSearch.toLowerCase())).slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, patternId: p.id, patternName: p.name })); setPatternSearch('') }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm text-left dark:text-gray-200"
                  >
                    {(p.photos[0] || p.lineDrawings[0]) && <img src={p.photos[0] || p.lineDrawings[0]} alt="" className="w-6 h-6 rounded object-cover shrink-0" />}
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.difficulty && <span className="text-xs text-gray-400">{p.difficulty}</span>}
                  </button>
                ))}
                {allPatterns.filter(p => p.name.toLowerCase().includes(patternSearch.toLowerCase())).length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No patterns found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea className="input" rows={2} value={form.description ?? ''} onChange={set('description')} placeholder="What are you making and for whom?" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Next Step</label>
        <input className="input" value={form.nextStep ?? ''} onChange={set('nextStep')} placeholder="e.g. Cut glass pieces, Grind edges..." />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
          <input className="input" type="date" value={form.startDate ?? ''} onChange={set('startDate')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
          <input className="input" type="date" value={form.deadline ?? ''} onChange={set('deadline')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Completed</label>
          <input className="input" type="date" value={form.completedDate ?? ''} onChange={set('completedDate')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recipient (if a gift)</label>
        <input className="input" value={form.recipient ?? ''} onChange={set('recipient')} placeholder="e.g. For Mom's birthday" />
      </div>

      <TagInput label="Tags" tags={form.tags} onChange={t => setForm(f => ({ ...f, tags: t }))} />

      {/* Materials & Cost Calculator */}
      <MaterialsSection
        glassUsed={form.glassUsed}
        suppliesUsed={form.suppliesUsed ?? []}
        allGlass={allGlass}
        allSupplies={allSupplies}
        onChange={(g, s) => setForm(f => ({ ...f, glassUsed: g, suppliesUsed: s }))}
      />

      {/* Manual cost overrides */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Cost ($) override</label>
          <input className="input" type="number" step="0.01" value={form.estimatedCost ?? ''} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value ? +e.target.value : undefined }))} placeholder="Or use calculator above" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Cost ($)</label>
          <input className="input" type="number" step="0.01" value={form.actualCost ?? ''} onChange={e => setForm(f => ({ ...f, actualCost: e.target.value ? +e.target.value : undefined }))} />
        </div>
      </div>

      {/* Commission Pricing Calculator */}
      <CommissionSection form={form} setForm={setForm} allGlass={allGlass} allSupplies={allSupplies} />

      {/* Journal */}
      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Journal</h3>
        {form.journal.length > 0 && (
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {form.journal.map(entry => (
              <div key={entry.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{format(new Date(entry.date), 'MMM d, yyyy h:mm a')}</p>
                {entry.text && <p className="text-sm text-gray-700 dark:text-gray-300">{entry.text}</p>}
                {entry.photos.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {entry.photos.map((p, i) => (
                      <img
                        key={i} src={p} alt=""
                        className="w-12 h-12 object-cover rounded-lg cursor-zoom-in"
                        onClick={() => setJournalLightbox({ images: entry.photos, index: i })}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
          <textarea className="input bg-white dark:bg-gray-900" rows={2} placeholder="Add a journal entry..." value={journalText} onChange={e => setJournalText(e.target.value)} />
          <ImageUpload label="" images={journalPhotos} onChange={setJournalPhotos} maxImages={4} />
          <Button type="button" variant="secondary" size="sm" onClick={addJournalEntry}>Add Entry</Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {form.name ? (
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <Printer size={15} /> Print sheet
          </button>
        ) : <div />}
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </div>

      <Lightbox
        images={journalLightbox?.images ?? []}
        initialIndex={journalLightbox?.index ?? 0}
        open={!!journalLightbox}
        onClose={() => setJournalLightbox(null)}
      />
    </form>
  )
}

export function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([])
  const [allGlass, setAllGlass] = useState<GlassItem[]>([])
  const [allSupplies, setAllSupplies] = useState<Supply[]>([])
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterType, setFilterType] = useState<string>('All')
  const [filterTag, setFilterTag] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deductProject, setDeductProject] = useState<Project | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [patternPickerOpen, setPatternPickerOpen] = useState(false)
  const [patternPickerSearch, setPatternPickerSearch] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    getAllProjects().then(setItems)
    getAllGlass().then(setAllGlass)
    getAllSupplies().then(setAllSupplies)
    getAllPatterns().then(setAllPatterns)
  }, [])

  const allTags = [...new Set(items.flatMap(i => i.tags))].sort()

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchQ = !q || i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))
    const matchS = filterStatus === 'All' || i.status === filterStatus
    const matchT = filterType === 'All' || i.type === filterType
    const matchTag = !filterTag || i.tags.includes(filterTag)
    return matchQ && matchS && matchT && matchTag
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleBulkAddTag = async (tag: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      if (!item.tags.includes(tag)) await saveProject({ ...item, tags: [...item.tags, tag] })
    }
    setItems(await getAllProjects())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkRemoveTag = async (tag: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      await saveProject({ ...item, tags: item.tags.filter(t => t !== tag) })
    }
    setItems(await getAllProjects())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteProject(id)
    setItems(await getAllProjects())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const handleBulkSetStatus = async (status: string) => {
    for (const item of items.filter(i => selectedIds.has(i.id))) {
      await saveProject({ ...item, status: status as ProjectStatus })
    }
    setItems(await getAllProjects())
    setSelectMode(false); setSelectedIds(new Set())
  }

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  const handleSave = async (item: Project) => {
    const wasCompleted = editing?.status === 'Completed'
    await saveProject(item)
    setItems(await getAllProjects())
    setModalOpen(false); setEditing(null)
    if (!wasCompleted && item.status === 'Completed' && (item.glassUsed.length > 0 || item.suppliesUsed.length > 0)) {
      setDeductProject(item)
    }
  }

  const handleAddToShopping = async (project: Project) => {
    const now = new Date().toISOString()
    for (const g of project.glassUsed) {
      const shoppingItem: ShoppingItem = { id: nanoid(), name: g.glassName, type: 'Glass', priority: 'Medium', purchased: false, quantity: g.amount ?? '', notes: `Used in: ${project.name}`, createdAt: now }
      await saveShopping(shoppingItem)
    }
    for (const s of project.suppliesUsed) {
      const shoppingItem: ShoppingItem = { id: nanoid(), name: s.supplyName, type: 'Supply', priority: 'Medium', purchased: false, quantity: s.amount ?? '', notes: `Used in: ${project.name}`, createdAt: now }
      await saveShopping(shoppingItem)
    }
    setDeductProject(null)
  }

  const handleDelete = async (id: string) => {
    await deleteProject(id)
    setItems(await getAllProjects())
  }

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: items.filter(i => i.status === s).length }), {} as Record<string, number>)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FolderKanban size={24} className="text-violet-600" />
          Projects
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${selectMode ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 text-violet-700 dark:text-violet-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-600'}`}
          >
            <CheckSquare size={15} /> Select
          </button>
          <Button variant="secondary" onClick={() => { setPatternPickerSearch(''); setPatternPickerOpen(true) }}>
            <BookOpen size={16} /> From Pattern
          </Button>
          <Button onClick={() => { setEditing(emptyProject()); setModalOpen(true) }}>
            <Plus size={16} /> New Project
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {STATUSES.map(s => (
            <button
              key={s}
              className={`bg-white dark:bg-gray-900 rounded-xl border p-3 text-left transition-colors ${filterStatus === s ? 'border-violet-400 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts[s] ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterTag === tag ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-400'}`}
            >{tag}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 && items.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Track your stained glass projects from planning to completion." action={{ label: 'New Project', onClick: () => { setEditing(emptyProject()); setModalOpen(true) } }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="relative group">
              <ProjectCard
                item={item}
                onClick={() => { if (!selectMode) { setEditing(item); setModalOpen(true) } }}
                onPhotoClick={!selectMode ? (imgs, i) => { setLightboxImages(imgs); setLightboxIndex(i) } : undefined}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
              {!selectMode && (
                <button className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm text-base leading-none font-bold" onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing?.name ? 'Edit Project' : 'New Project'} size="xl">
        {editing && (
          <ProjectForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setModalOpen(false); setEditing(null) }}
            allGlass={allGlass}
            allSupplies={allSupplies}
            allPatterns={allPatterns}
          />
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)} title="Delete Project" message="Delete this project and all its data?" />

      <ConfirmDialog
        open={!!deductProject}
        onClose={() => setDeductProject(null)}
        onConfirm={() => deductProject && handleAddToShopping(deductProject)}
        title="Reorder materials?"
        message={`"${deductProject?.name}" is complete! Add its ${(deductProject?.glassUsed.length ?? 0) + (deductProject?.suppliesUsed.length ?? 0)} material(s) to your shopping list to restock?`}
      />

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
          <span className="text-sm text-gray-300">Click projects to select them</span>
          <button onClick={exitSelectMode} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      <Modal open={patternPickerOpen} onClose={() => setPatternPickerOpen(false)} title="Choose a Pattern" size="md">
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
                    onClick={() => {
                      const proj = emptyProject()
                      proj.patternId = p.id
                      proj.patternName = p.name
                      proj.glassUsed = p.glassPlan.map(e => ({ glassId: e.glassId, glassName: e.glassName, amount: '', multiplier: 1 }))
                      setEditing(proj)
                      setPatternPickerOpen(false)
                      setModalOpen(true)
                    }}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {[p.style, p.difficulty, p.pieceCount ? `${p.pieceCount} pieces` : null].filter(Boolean).join(' · ')}
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
    </div>
  )
}
