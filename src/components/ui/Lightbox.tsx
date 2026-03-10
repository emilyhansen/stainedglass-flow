import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  images: string[]
  initialIndex: number
  open: boolean
  onClose: () => void
}

export function Lightbox({ images, initialIndex, open, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % images.length)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, images.length, onClose])

  if (!open || images.length === 0) return null

  const hasMult = images.length > 1

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      {hasMult && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm select-none">
          {index + 1} / {images.length}
        </span>
      )}

      {/* Prev */}
      {hasMult && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          onClick={e => { e.stopPropagation(); setIndex(i => (i - 1 + images.length) % images.length) }}
          aria-label="Previous"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      {/* Next */}
      {hasMult && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          onClick={e => { e.stopPropagation(); setIndex(i => (i + 1) % images.length) }}
          aria-label="Next"
        >
          <ChevronRight size={40} />
        </button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt=""
        className="max-w-[88vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {/* Hint */}
      {hasMult && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs select-none">
          ← → to navigate · esc to close
        </p>
      )}
    </div>
  )
}
