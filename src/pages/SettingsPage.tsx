import { useState, useRef } from 'react'
import { Download, Upload, Settings, AlertTriangle, CheckCircle, FileSpreadsheet, Moon, Sun, Bell, FolderOpen } from 'lucide-react'
import { exportAllData, importAllData, saveGlass, getAllGlass, getAllSupplies } from '../lib/db'
import { Button } from '../components/ui/Button'
import type { GlassItem, GlassType, GlassStatus } from '../lib/types'
import { nanoid } from 'nanoid'

const VALID_TYPES = new Set<string>(['Cathedral','Opalescent','Textured','Iridescent','Streaky','Seedy','Glue Chip','Beveled','Jewel','Mirror','Bevel','Bevel Cluster','Other'])
const VALID_STATUSES = new Set<string>(['In Stock','Low','Out of Stock'])

type ImportStatus = 'idle' | 'success' | 'error'

export function SettingsPage() {
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importError, setImportError] = useState('')
  const [importedCounts, setImportedCounts] = useState<Record<string, number> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [csvError, setCsvError] = useState('')
  const [csvCount, setCsvCount] = useState(0)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const [notifDays, setNotifDays] = useState(() => parseInt(localStorage.getItem('deadlineNotifDays') ?? '7', 10))
  const [backupDirHandle, setBackupDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [backupDirName, setBackupDirName] = useState('')
  const [folderSaveStatus, setFolderSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('darkMode', String(next))
  }

  const handleCsvImport = async (file: File) => {
    setCsvStatus('idle'); setCsvError(''); setCsvCount(0)
    try {
      const text = await file.text()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
      const col = (name: string) => headers.indexOf(name)
      let count = 0
      for (const line of lines.slice(1)) {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const get = (name: string) => vals[col(name)] ?? ''
        const typeRaw = get('type')
        const statusRaw = get('status')
        const now = new Date().toISOString()
        const item: GlassItem = {
          id: nanoid(), createdAt: now, updatedAt: now,
          name: get('name'), colorName: get('colorname') || get('color'),
          colorCode: get('colorcode') || get('code') || undefined,
          type: (VALID_TYPES.has(typeRaw) ? typeRaw : 'Other') as GlassType,
          status: (VALID_STATUSES.has(statusRaw) ? statusRaw : 'In Stock') as GlassStatus,
          manufacturer: get('manufacturer') || get('mfr') || undefined,
          supplier: get('supplier') || undefined,
          widthIn: +(get('widthin') || get('width')) || undefined,
          heightIn: +(get('heightin') || get('height')) || undefined,
          quantity: get('quantity') || get('qty') || undefined,
          costPerSheet: +(get('costpersheet') || get('cost') || get('price')) || undefined,
          notes: get('notes') || undefined,
          tags: get('tags') ? get('tags').split(';').map(t => t.trim()).filter(Boolean) : [],
          photos: [],
        }
        if (!item.name) continue
        await saveGlass(item)
        count++
      }
      setCsvCount(count); setCsvStatus('success')
      if (csvRef.current) csvRef.current.value = ''
    } catch (e) {
      setCsvError(e instanceof Error ? e.message : 'Failed to parse CSV.')
      setCsvStatus('error')
    }
  }

  const handlePickFolder = async () => {
    const win = window as Window & { showDirectoryPicker?: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle> }
    if (!win.showDirectoryPicker) {
      alert('Folder selection requires Chrome or Edge. Use the Export button to save manually.')
      return
    }
    try {
      const dir = await win.showDirectoryPicker({ mode: 'readwrite' })
      setBackupDirHandle(dir)
      setBackupDirName(dir.name)
      setFolderSaveStatus('idle')
    } catch {
      // user cancelled
    }
  }

  const handleSaveToFolder = async () => {
    if (!backupDirHandle) return
    try {
      const data = await exportAllData()
      const json = JSON.stringify(data, null, 2)
      const filename = `stainedglass-flow-backup-${new Date().toISOString().slice(0, 10)}.json`
      const fileHandle = await backupDirHandle.getFileHandle(filename, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(json)
      await writable.close()
      setFolderSaveStatus('success')
      setTimeout(() => setFolderSaveStatus('idle'), 3000)
    } catch {
      setFolderSaveStatus('error')
    }
  }

  const handleExport = async () => {
    const data = await exportAllData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stainedglass-flow-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCsv = (filename: string, rows: string[][]) => {
    const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v
    const csv = rows.map(r => r.map(c => escape(String(c ?? ''))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const handleCsvExportGlass = async () => {
    const glass = await getAllGlass()
    const header = ['name','colorName','colorCode','type','manufacturer','supplier','widthIn','heightIn','quantity','status','costPerSheet','notes','tags']
    const rows = glass.map(g => [
      g.name, g.colorName, g.colorCode ?? '', g.type,
      g.manufacturer ?? '', g.supplier ?? '',
      String(g.widthIn ?? ''), String(g.heightIn ?? ''), g.quantity ?? '',
      g.status, String(g.costPerSheet ?? ''), g.notes ?? '',
      g.tags.join(';'),
    ])
    downloadCsv(`glass-inventory-${new Date().toISOString().slice(0,10)}.csv`, [header, ...rows])
  }

  const handleCsvExportSupplies = async () => {
    const supplies = await getAllSupplies()
    const header = ['name','category','brand','supplier','quantity','unit','status','costPerUnit','notes','tags']
    const rows = supplies.map(s => [
      s.name, s.category, s.brand ?? '', s.supplier ?? '',
      s.quantity ?? '', s.unit ?? '', s.status,
      String(s.costPerUnit ?? ''), s.notes ?? '',
      s.tags.join(';'),
    ])
    downloadCsv(`supplies-${new Date().toISOString().slice(0,10)}.csv`, [header, ...rows])
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    setImportStatus('idle')
    setImportError('')
    setImportedCounts(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Record<string, unknown[]>
      await importAllData(data)
      const counts: Record<string, number> = {}
      for (const key of ['glass', 'patterns', 'projects', 'supplies', 'shopping', 'suppliers']) {
        counts[key] = Array.isArray(data[key]) ? data[key].length : 0
      }
      setImportedCounts(counts)
      setImportStatus('success')
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Failed to parse backup file.')
      setImportStatus('error')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const countLabels: Record<string, string> = {
    glass: 'Glass pieces',
    patterns: 'Patterns',
    projects: 'Projects',
    supplies: 'Supplies',
    shopping: 'Shopping items',
    suppliers: 'Suppliers',
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-8">
        <Settings size={24} className="text-violet-600" />
        Settings
      </h1>

      {/* Dark Mode */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={20} className="text-violet-400" /> : <Sun size={20} className="text-amber-500" />}
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{darkMode ? 'Dark mode is on' : 'Light mode is on'}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${darkMode ? 'bg-violet-600' : 'bg-gray-300'}`}
            aria-label="Toggle dark mode"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <Bell size={20} className="text-violet-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Deadline Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get a browser notification when a project deadline is approaching. Shown once per session on app load.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 dark:text-gray-300 shrink-0">Warn me</label>
          <input
            type="number"
            min={1}
            max={30}
            className="input w-20 text-center"
            value={notifDays}
            onChange={e => {
              const v = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1))
              setNotifDays(v)
              localStorage.setItem('deadlineNotifDays', String(v))
            }}
          />
          <label className="text-sm text-gray-700 dark:text-gray-300 shrink-0">days before deadline</label>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Export / Backup</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download all your StainedGlass Flow data as a JSON file. Keep this somewhere safe — it's your full backup including all glass, patterns, projects, supplies, and suppliers.
            </p>
          </div>
          <Button onClick={handleExport} className="shrink-0">
            <Download size={15} />
            Export
          </Button>
        </div>
      </div>

      {/* CSV Export */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Export as CSV</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Download your glass inventory or supplies as a CSV spreadsheet — useful for printing, sharing with a supplier, or importing into Excel.</p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button onClick={handleCsvExportGlass} variant="secondary" className="shrink-0">
              <FileSpreadsheet size={15} /> Glass CSV
            </Button>
            <Button onClick={handleCsvExportSupplies} variant="secondary" className="shrink-0">
              <FileSpreadsheet size={15} /> Supplies CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Folder Backup */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <FolderOpen size={20} className="text-violet-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Backup to Folder</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Save backups directly to iCloud Drive, Google Drive, or any local folder. Chrome &amp; Edge only.</p>
          </div>
        </div>
        {backupDirHandle ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl px-3 py-2 flex-1 min-w-0">
              <FolderOpen size={14} className="text-violet-600 shrink-0" />
              <span className="text-sm font-medium text-violet-800 dark:text-violet-300 truncate">{backupDirName}</span>
            </div>
            <Button onClick={handleSaveToFolder} className="shrink-0">
              <Download size={15} /> Save Backup
            </Button>
            <button onClick={handlePickFolder} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">Change folder</button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handlePickFolder}>
            <FolderOpen size={15} /> Choose Folder
          </Button>
        )}
        {folderSaveStatus === 'success' && (
          <div className="flex items-center gap-2 mt-3 text-green-600">
            <CheckCircle size={15} />
            <span className="text-sm">Backup saved to folder.</span>
          </div>
        )}
        {folderSaveStatus === 'error' && (
          <div className="flex items-center gap-2 mt-3 text-red-600">
            <AlertTriangle size={15} />
            <span className="text-sm">Save failed. Make sure the folder is still accessible.</span>
          </div>
        )}
      </div>

      {/* Import */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Import / Restore</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Restore from a previously exported JSON backup file.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            <strong>Warning:</strong> Importing will replace all existing data. Make sure to export a backup first.
          </p>
        </div>

        {importStatus === 'success' && importedCounts && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex gap-2">
            <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Import successful!</p>
              <ul className="text-sm text-green-700 space-y-0.5">
                {Object.entries(importedCounts).map(([k, v]) => (
                  <li key={k}>{countLabels[k]}: {v}</li>
                ))}
              </ul>
              <p className="text-xs text-green-600 mt-1">Refresh the page to see your imported data.</p>
            </div>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700"><strong>Error:</strong> {importError}</p>
          </div>
        )}

        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-violet-400 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault() }}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleImport(file)
          }}
        >
          <Upload size={24} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop backup file here or click to browse</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JSON files only</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }}
        />

        {importing && (
          <p className="text-sm text-violet-600 text-center mt-3 animate-pulse">Importing data...</p>
        )}
      </div>

      {/* CSV Import */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mt-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Import Glass from CSV</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Bulk-import glass inventory from a spreadsheet. CSV columns (header row required):{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">name, colorName, colorCode, type, manufacturer, supplier, widthIn, heightIn, quantity, status, costPerSheet, notes, tags</code>
          <br /><span className="text-xs text-gray-400 mt-1 block">Separate multiple tags with semicolons. Items are added to existing inventory.</span>
        </p>

        {csvStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex gap-2">
            <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{csvCount} glass item{csvCount !== 1 ? 's' : ''} imported successfully.</p>
          </div>
        )}
        {csvStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700"><strong>Error:</strong> {csvError}</p>
          </div>
        )}

        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-violet-400 transition-colors cursor-pointer"
          onClick={() => csvRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvImport(f) }}
        >
          <FileSpreadsheet size={24} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop CSV file here or click to browse</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">CSV files only</p>
        </div>
        <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvImport(f) }} />
      </div>

      {/* About */}
      <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>StainedGlass Flow v1.0 · Data stored locally in your browser</p>
        <p className="mt-0.5">Export regularly to keep your data safe</p>
      </div>
    </div>
  )
}
