import { useState, useRef } from 'react'
import { FileImage, Upload, Download, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import ImageTracer from 'imagetracerjs'

// Point the worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

type OutputFormat = 'png' | 'svg' | 'both'
type TracerPreset = 'simple' | 'detailed' | 'custom'

interface TracerOptions {
  numberofcolors: number
  pathomit: number
  blurradius: number
  [key: string]: unknown
}

const PRESETS: Record<Exclude<TracerPreset, 'custom'>, TracerOptions> = {
  simple:   { numberofcolors: 2,  pathomit: 16, blurradius: 1 },
  detailed: { numberofcolors: 16, pathomit: 4,  blurradius: 0 },
}

interface PageResult {
  pageNum: number
  dataUrl: string
  svgStr?: string
  width: number
  height: number
}

function tracerOptsFromState(preset: TracerPreset, custom: TracerOptions): TracerOptions {
  if (preset === 'custom') return custom
  return PRESETS[preset]
}

export function PdfConverterPage() {
  const [pages, setPages] = useState<PageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [scale, setScale] = useState(2)
  const [selectedPage, setSelectedPage] = useState<number | null>(null)

  // Output format
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('both')

  // Tracer settings
  const [tracerPreset, setTracerPreset] = useState<TracerPreset>('simple')
  const [customOpts, setCustomOpts] = useState<TracerOptions>({ numberofcolors: 2, pathomit: 16, blurradius: 1 })
  const [tracerOpen, setTracerOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const traceToSvg = (canvas: HTMLCanvasElement, opts: TracerOptions): string => {
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return ImageTracer.imagedataToSVG(imageData, opts)
  }

  const convertPdf = async (file: File) => {
    setLoading(true)
    setError(null)
    setPages([])
    setProgress(0)
    setFileName(file.name.replace(/\.pdf$/i, ''))

    const opts = tracerOptsFromState(tracerPreset, customOpts)
    const wantSvg = outputFormat === 'svg' || outputFormat === 'both'

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const totalPages = pdf.numPages
      const results: PageResult[] = []

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
        results.push({
          pageNum: i,
          dataUrl: canvas.toDataURL('image/png'),
          svgStr: wantSvg ? traceToSvg(canvas, opts) : undefined,
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
        })
        setProgress(Math.round((i / totalPages) * 100))
      }

      setPages(results)
    } catch (err) {
      setError('Failed to convert PDF. Make sure the file is a valid PDF.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const convertImage = async (file: File) => {
    setLoading(true)
    setError(null)
    setPages([])
    setProgress(0)
    setFileName(file.name.replace(/\.[^.]+$/, ''))

    const opts = tracerOptsFromState(tracerPreset, customOpts)
    const wantSvg = outputFormat === 'svg' || outputFormat === 'both'

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target!.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = dataUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      setPages([{
        pageNum: 1,
        dataUrl: canvas.toDataURL('image/png'),
        svgStr: wantSvg ? traceToSvg(canvas, opts) : undefined,
        width: canvas.width,
        height: canvas.height,
      }])
      setProgress(100)
    } catch (err) {
      setError('Failed to process image.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file: File) => {
    if (file.type === 'application/pdf') convertPdf(file)
    else if (file.type.startsWith('image/')) convertImage(file)
    else setError('Unsupported file type. Please upload a PDF, PNG, or JPG.')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const downloadPng = (page: PageResult) => {
    const a = document.createElement('a')
    a.href = page.dataUrl
    a.download = `${fileName}_page${page.pageNum}.png`
    a.click()
  }

  const downloadSvg = (page: PageResult) => {
    if (!page.svgStr) return
    const blob = new Blob([page.svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}_page${page.pageNum}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAllPng = () => {
    pages.forEach((page, i) => setTimeout(() => downloadPng(page), i * 200))
  }

  const downloadAllSvg = () => {
    pages.filter(p => p.svgStr).forEach((page, i) => setTimeout(() => downloadSvg(page), i * 200))
  }

  const svgDataUrl = (svgStr: string) =>
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)

  const currentPage = selectedPage !== null ? pages[selectedPage] : null
  const wantSvg = outputFormat === 'svg' || outputFormat === 'both'
  const wantPng = outputFormat === 'png' || outputFormat === 'both'

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileImage size={24} className="text-teal-600" />
          PDF / Image Converter
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Convert PDF patterns or images to PNG or SVG for vinyl cutters and light tables</p>
      </div>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 mb-6 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onDragEnter={e => e.preventDefault()}
      >
        <Upload size={28} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drop a PDF, PNG, or JPG here, or click to browse</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Each page rendered as high-resolution output</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Toolbar: Resolution + Output format */}
      <div className="flex flex-wrap items-center gap-6 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Resolution:</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${scale === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-300'}`}
              >
                {s === 1 ? '96 dpi' : s === 2 ? '192 dpi' : '288 dpi'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Output:</label>
          <div className="flex gap-2">
            {(['png', 'svg', 'both'] as OutputFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setOutputFormat(f)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${outputFormat === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-300'}`}
              >
                {f === 'both' ? 'PNG + SVG' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tracer settings (collapsible, shown when SVG output selected) */}
      {wantSvg && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setTracerOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>SVG Tracer Settings</span>
            {tracerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {tracerOpen && (
            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
              {/* Preset selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Preset</label>
                <div className="flex gap-2">
                  {([
                    { id: 'simple', label: 'Simple (2 colors)', desc: 'Best for line drawings & vinyl cutting' },
                    { id: 'detailed', label: 'Detailed (16 colors)', desc: 'Better for photos & multicolor art' },
                    { id: 'custom', label: 'Custom', desc: 'Set your own options' },
                  ] as { id: TracerPreset; label: string; desc: string }[]).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setTracerPreset(p.id)}
                      title={p.desc}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${tracerPreset === p.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-300'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom sliders */}
              {tracerPreset === 'custom' && (
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { key: 'numberofcolors', label: 'Colors', min: 2, max: 32 },
                    { key: 'pathomit', label: 'Path Omit (noise)', min: 0, max: 32 },
                    { key: 'blurradius', label: 'Blur Radius', min: 0, max: 5 },
                  ] as { key: keyof TracerOptions; label: string; min: number; max: number }[]).map(({ key, label, min, max }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}: <span className="text-teal-700 dark:text-teal-400 font-semibold">{customOpts[key] as number}</span></label>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={customOpts[key] as number}
                        onChange={e => setCustomOpts(o => ({ ...o, [key]: +e.target.value }))}
                        className="w-full accent-teal-600"
                      />
                    </div>
                  ))}
                </div>
              )}

              {tracerPreset !== 'custom' && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {tracerPreset === 'simple'
                    ? 'Black & white, 2 colors — ideal for stained glass line drawings and vinyl cutters (Cricut, Silhouette).'
                    : 'Full color palette, fine detail — better for reference photos or multicolor patterns.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Converting… {progress}%</p>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {pages.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {pages.length} page{pages.length > 1 ? 's' : ''} converted from <span className="text-gray-900 dark:text-white">{fileName}</span>
            </p>
            <div className="flex items-center gap-2">
              {pages.length > 1 && wantPng && (
                <button
                  onClick={downloadAllPng}
                  className="flex items-center gap-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Download size={14} /> All PNG
                </button>
              )}
              {pages.length > 1 && wantSvg && pages.some(p => p.svgStr) && (
                <button
                  onClick={downloadAllSvg}
                  className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Download size={14} /> All SVG
                </button>
              )}
              <button
                onClick={() => { setPages([]); setFileName(''); setSelectedPage(null) }}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-200 transition-colors"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          {/* Preview panel */}
          {currentPage && (
            <div className="bg-black/90 rounded-2xl overflow-hidden mb-6">
              <div className="flex items-center justify-between px-4 py-3 bg-black/50 gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">Page {currentPage.pageNum} of {pages.length}</span>
                <span className="text-gray-400 text-xs">{currentPage.width} × {currentPage.height}px</span>
                <div className="flex items-center gap-2 ml-auto">
                  {wantPng && (
                    <button
                      onClick={() => downloadPng(currentPage)}
                      className="flex items-center gap-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Download size={14} /> PNG
                    </button>
                  )}
                  {currentPage.svgStr && (
                    <button
                      onClick={() => downloadSvg(currentPage)}
                      className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Download size={14} /> SVG
                    </button>
                  )}
                </div>
              </div>

              {/* Dual preview when both formats */}
              {currentPage.svgStr && outputFormat === 'both' ? (
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-gray-400 text-xs text-center mb-2">PNG</p>
                    <img src={currentPage.dataUrl} alt={`Page ${currentPage.pageNum} PNG`} className="max-w-full max-h-[40vh] object-contain rounded-lg shadow-2xl mx-auto block" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs text-center mb-2">SVG</p>
                    <img src={svgDataUrl(currentPage.svgStr)} alt={`Page ${currentPage.pageNum} SVG`} className="max-w-full max-h-[40vh] object-contain rounded-lg shadow-2xl mx-auto block bg-white" />
                  </div>
                </div>
              ) : (
                <div className="p-4 flex justify-center items-center min-h-[300px]">
                  <img
                    src={currentPage.svgStr && outputFormat === 'svg' ? svgDataUrl(currentPage.svgStr) : currentPage.dataUrl}
                    alt={`Page ${currentPage.pageNum}`}
                    className={`max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl ${currentPage.svgStr && outputFormat === 'svg' ? 'bg-white' : ''}`}
                  />
                </div>
              )}

              {pages.length > 1 && (
                <div className="flex items-center justify-center gap-4 pb-4">
                  <button
                    onClick={() => setSelectedPage(p => p !== null ? Math.max(0, p - 1) : 0)}
                    disabled={selectedPage === 0}
                    className="flex items-center gap-1 text-sm text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
                  >
                    <ChevronLeft size={18} /> Prev
                  </button>
                  <span className="text-white/50 text-sm">{(selectedPage ?? 0) + 1} / {pages.length}</span>
                  <button
                    onClick={() => setSelectedPage(p => p !== null ? Math.min(pages.length - 1, p + 1) : 0)}
                    disabled={selectedPage === pages.length - 1}
                    className="flex items-center gap-1 text-sm text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map((page, idx) => (
              <div
                key={page.pageNum}
                className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-md ${selectedPage === idx ? 'border-teal-400 ring-2 ring-teal-200' : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600'}`}
                onClick={() => setSelectedPage(idx)}
              >
                <img src={page.dataUrl} alt={`Page ${page.pageNum}`} className="w-full aspect-[3/4] object-contain bg-white" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {wantPng && (
                    <button onClick={e => { e.stopPropagation(); downloadPng(page) }} className="text-white hover:text-teal-300 transition-colors" title="Download PNG">
                      <Download size={13} />
                    </button>
                  )}
                  {page.svgStr && (
                    <button onClick={e => { e.stopPropagation(); downloadSvg(page) }} className="text-violet-300 hover:text-violet-100 transition-colors" title="Download SVG">
                      <Download size={13} />
                    </button>
                  )}
                </div>
                <div className="absolute top-1 left-1 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-md">
                  {page.pageNum}
                </div>
                {page.svgStr && (
                  <div className="absolute top-1 right-1 bg-violet-600/80 text-white text-xs px-1.5 py-0.5 rounded-md">SVG</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Usage tips */}
      {pages.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">How to use</h3>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex gap-2"><span className="text-teal-600 font-bold">1.</span> Upload a PDF, PNG, or JPG pattern file above</li>
            <li className="flex gap-2"><span className="text-teal-600 font-bold">2.</span> Choose output format: PNG, SVG, or both</li>
            <li className="flex gap-2"><span className="text-teal-600 font-bold">3.</span> For SVG: pick "Simple" preset for line drawings (best for Cricut/Silhouette), or "Detailed" for photos</li>
            <li className="flex gap-2"><span className="text-teal-600 font-bold">4.</span> Choose resolution (192 dpi recommended for printing)</li>
            <li className="flex gap-2"><span className="text-teal-600 font-bold">5.</span> Download individual pages or all at once</li>
          </ol>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">All processing happens locally in your browser — no files are uploaded anywhere.</p>
        </div>
      )}
    </div>
  )
}
