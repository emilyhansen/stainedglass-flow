import { useState, useEffect, useMemo } from 'react'
import { Images, Search } from 'lucide-react'
import type { Project, ProjectStatus, ProjectType } from '../lib/types'
import { getAllProjects } from '../lib/db'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Lightbox } from '../components/ui/Lightbox'

const STATUSES: ProjectStatus[] = ['Planning', 'In Progress', 'On Hold', 'Completed']
const TYPES: ProjectType[] = ['Panel', 'Suncatcher', 'Lamp', 'Mosaic', 'Repair', 'Box', 'Mirror Frame', 'Other']

interface GalleryItem {
  projectId: string
  projectName: string
  status: ProjectStatus
  type: ProjectType
  photo: string
  allPhotos: string[]
  photoIndex: number
}

export function GalleryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterType, setFilterType] = useState<string>('All')
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => { getAllProjects().then(setProjects) }, [])

  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = []
    projects.forEach(p => {
      // collect all photos: cover + progressPhotos + journal photos
      const all: string[] = []
      if (p.coverPhoto) all.push(p.coverPhoto)
      all.push(...p.progressPhotos)
      p.journal.forEach(j => all.push(...j.photos))

      all.forEach((photo, idx) => {
        items.push({
          projectId: p.id,
          projectName: p.name,
          status: p.status,
          type: p.type,
          photo,
          allPhotos: all,
          photoIndex: idx,
        })
      })
    })
    return items
  }, [projects])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return galleryItems.filter(item => {
      const matchQ = !q || item.projectName.toLowerCase().includes(q)
      const matchS = filterStatus === 'All' || item.status === filterStatus
      const matchT = filterType === 'All' || item.type === filterType
      return matchQ && matchS && matchT
    })
  }, [galleryItems, search, filterStatus, filterType])

  const totalPhotos = galleryItems.length
  const hasProjects = projects.length > 0
  const hasPhotos = totalPhotos > 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Images size={24} className="text-teal-600" />
            Project Gallery
          </h1>
          {hasPhotos && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} across {projects.filter(p => {
              const all = [p.coverPhoto, ...p.progressPhotos, ...p.journal.flatMap(j => j.photos)].filter(Boolean)
              return all.length > 0
            }).length} project{projects.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      {hasPhotos && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}

      {!hasProjects ? (
        <EmptyState icon={Images} title="No projects yet" description="Add your first project to start building your gallery." />
      ) : !hasPhotos ? (
        <EmptyState icon={Images} title="No photos yet" description="Add cover photos or progress photos to your projects to see them here." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filters." />
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {filtered.map((item, idx) => (
            <div
              key={`${item.projectId}-${item.photoIndex}-${idx}`}
              className="break-inside-avoid rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-700 transition-all cursor-zoom-in group relative"
              onClick={() => { setLightboxImages(item.allPhotos); setLightboxIndex(item.photoIndex) }}
            >
              <img
                src={item.photo}
                alt={item.projectName}
                className="w-full object-cover block"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-semibold truncate">{item.projectName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge label={item.status} />
                  <span className="text-gray-300 text-xs">{item.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxImages.length > 0}
        onClose={() => setLightboxImages([])}
      />
    </div>
  )
}
