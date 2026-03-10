import { useState } from 'react'
import { Tag, X, Trash2 } from 'lucide-react'
import { Button } from './Button'

interface BulkTagBarProps {
  count: number
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onDelete?: () => void
  onCancel: () => void
}

export function BulkTagBar({ count, onAddTag, onRemoveTag, onDelete, onCancel }: BulkTagBarProps) {
  const [mode, setMode] = useState<'idle' | 'add' | 'remove' | 'confirmDelete'>('idle')
  const [tagInput, setTagInput] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagInput.trim()) return
    if (mode === 'add') onAddTag(tagInput.trim())
    if (mode === 'remove') onRemoveTag(tagInput.trim())
    setTagInput('')
    setMode('idle')
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[360px]">
      <span className="text-sm font-medium text-gray-200 shrink-0">{count} selected</span>
      <div className="h-4 w-px bg-gray-600 shrink-0" />

      {mode === 'idle' && (
        <>
          <button
            onClick={() => setMode('add')}
            className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <Tag size={13} /> Add tag
          </button>
          <button
            onClick={() => setMode('remove')}
            className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <X size={13} /> Remove tag
          </button>
          {onDelete && (
            <button
              onClick={() => setMode('confirmDelete')}
              className="flex items-center gap-1.5 text-sm bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </>
      )}

      {(mode === 'add' || mode === 'remove') && (
        <form onSubmit={submit} className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-400 shrink-0">{mode === 'add' ? 'Add tag:' : 'Remove tag:'}</span>
          <input
            autoFocus
            className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white placeholder-gray-500 flex-1 outline-none focus:border-violet-400"
            placeholder="tag name..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
          />
          <Button type="submit" className="text-xs px-2.5 py-1 shrink-0">Apply</Button>
          <button type="button" onClick={() => setMode('idle')} className="text-gray-400 hover:text-white shrink-0">
            <X size={14} />
          </button>
        </form>
      )}

      {mode === 'confirmDelete' && (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-red-300">Delete {count} item{count !== 1 ? 's' : ''}?</span>
          <button
            onClick={() => { onDelete?.(); setMode('idle') }}
            className="text-sm bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Confirm
          </button>
          <button onClick={() => setMode('idle')} className="text-gray-400 hover:text-white shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="h-4 w-px bg-gray-600 shrink-0" />
      <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
