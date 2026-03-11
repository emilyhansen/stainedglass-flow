import { useState } from 'react'
import {
  HelpCircle, ChevronDown, ChevronRight,
  LayoutDashboard, Layers, BookOpen, FolderKanban, Images,
  CalendarClock, Package, ShoppingCart, Store, BarChart3,
  FileImage, Settings, Search, Tag, Trash2, Download, Upload,
  Keyboard, Moon, Bell,
} from 'lucide-react'

interface Section {
  id: string
  icon: React.ElementType
  iconColor: string
  title: string
  intro: string
  items: { heading: string; body: string }[]
}

const sections: Section[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    iconColor: 'text-violet-600',
    title: 'Dashboard',
    intro: 'The Dashboard is your home base — a quick overview of everything happening in your studio.',
    items: [
      { heading: 'Stats row', body: 'Shows counts of your glass sheets, patterns, active projects, and supplies at a glance.' },
      { heading: 'Active projects', body: 'Lists projects currently in progress so you can jump straight to them.' },
      { heading: 'Upcoming deadlines', body: 'Highlights projects or tasks due within the next 14 days.' },
      { heading: 'Low-stock alerts', body: 'Flags any glass sheets or supplies marked as "Low Stock" or "Out of Stock" so you know what to reorder.' },
      { heading: 'Quick-add shortcuts', body: 'Buttons to create a new glass sheet, pattern, project, or supply without navigating away.' },
    ],
  },
  {
    id: 'glass',
    icon: Layers,
    iconColor: 'text-violet-600',
    title: 'Glass Inventory',
    intro: 'Track every sheet of glass in your studio — what you have, how much is left, and where it has been used.',
    items: [
      { heading: 'Adding glass', body: 'Click "Add Glass" to record a new sheet. Fill in the color name, glass type (cathedral, opalescent, etc.), manufacturer, dimensions, and current stock status.' },
      { heading: 'Stock status', body: 'Each sheet can be marked as In Stock, Low Stock, Out of Stock, or Discontinued. The Dashboard alerts you when anything drops to Low or Out of Stock.' },
      { heading: 'Photos', body: 'Attach one or more photos to a glass record. Click any photo to open a full-screen lightbox and page through them.' },
      { heading: 'Tags', body: 'Add freeform tags (e.g. "blue", "textured", "favourite") to each sheet for quick filtering.' },
      { heading: 'Price history', body: 'Log what you paid for each sheet over time. The card shows the most recent price and a running history so you can track cost changes.' },
      { heading: '"Used in N projects"', body: 'Each card shows how many projects reference that glass so you can see which sheets are getting used.' },
      { heading: 'Restock shortcut', body: 'The shopping-cart icon on a glass card instantly adds that sheet to your Shopping List.' },
      { heading: 'Color-sorted swatch grid', body: 'The grid view arranges cards by hue so similar colors appear together, making it easy to scan your collection visually.' },
      { heading: 'Bulk actions', body: 'Click "Select" to enter bulk mode. Check multiple cards, then use the floating bar to add/remove a tag, change status, or delete all selected sheets at once.' },
    ],
  },
  {
    id: 'patterns',
    icon: BookOpen,
    iconColor: 'text-purple-600',
    title: 'Patterns',
    intro: 'Your pattern library — store photos, line drawings, and metadata for every design you own or have made.',
    items: [
      { heading: 'Adding a pattern', body: 'Click "Add Pattern" and fill in the name, designer, style (geometric, nature, etc.), difficulty, and piece count. Attach reference photos and line drawings.' },
      { heading: 'Glass plan', body: 'Within each pattern you can record which glass colors you plan to use — this list can later be imported directly into your Shopping List.' },
      { heading: 'Linking to a project', body: 'Any pattern can be linked to a project. Once linked, the project card shows the pattern name and you can open the pattern from the project.' },
      { heading: 'Status', body: 'Mark patterns as Idea, In Progress, or Complete to track where you are with each design.' },
      { heading: 'Bulk actions', body: 'Use "Select" to enter bulk mode and apply tags, change status, or delete multiple patterns at once.' },
    ],
  },
  {
    id: 'projects',
    icon: FolderKanban,
    iconColor: 'text-blue-600',
    title: 'Projects',
    intro: 'Track stained glass pieces from first idea to finished work. Each project is a full journal of your build.',
    items: [
      { heading: 'Creating a project', body: 'Click "New Project" to create a record. Set the name, type (panel, lamp, suncatcher, etc.), status, and an optional linked pattern.' },
      { heading: 'Status workflow', body: 'Projects move through: Idea → In Progress → Complete. Filter the list by status to focus on active work.' },
      { heading: 'Journal entries', body: 'Add dated notes to a project to document your progress, problems, and decisions over time.' },
      { heading: 'Progress photos', body: 'Attach photos at any stage of the build. Click a photo to view it full-screen in the lightbox.' },
      { heading: 'Cost tracking', body: 'Log material costs as you go. The project card shows the running total so you always know what a piece has cost so far.' },
      { heading: 'Commission pricing', body: 'For commissioned work, record the agreed price and see a profit margin calculated from your tracked costs.' },
      { heading: 'Deadlines', body: 'Set a due date on any project. Upcoming deadlines appear on the Dashboard and the Deadlines page.' },
      { heading: 'Bulk actions', body: 'Use "Select" to apply tags, change status, or delete multiple projects at once.' },
    ],
  },
  {
    id: 'gallery',
    icon: Images,
    iconColor: 'text-pink-600',
    title: 'Gallery',
    intro: 'A visual overview of all photos across your glass, patterns, and projects in one scrollable grid.',
    items: [
      { heading: 'Browsing', body: 'All photos from every record are shown together. Click any image to open it full-screen.' },
      { heading: 'Source labels', body: 'Each thumbnail is labelled with the item it belongs to so you can identify what you are looking at.' },
    ],
  },
  {
    id: 'deadlines',
    icon: CalendarClock,
    iconColor: 'text-orange-600',
    title: 'Deadlines',
    intro: 'A focused calendar view of every project that has a due date set.',
    items: [
      { heading: 'Overview', body: 'Projects are listed in date order with a countdown showing days remaining. Overdue items are highlighted in red.' },
      { heading: 'Adding deadlines', body: 'Set a due date on a project from the Projects page. It will appear here automatically.' },
      { heading: 'Browser notifications', body: 'If you grant notification permission in Settings, StainedGlass Flow can remind you of upcoming deadlines even when the app is not in focus.' },
    ],
  },
  {
    id: 'supplies',
    icon: Package,
    iconColor: 'text-orange-600',
    title: 'Supplies',
    intro: 'Keep track of all your non-glass consumables — solder, flux, copper foil, lead came, tools, and more.',
    items: [
      { heading: 'Adding a supply', body: 'Click "Add Supply" and fill in the name, category, brand, quantity, and unit. Set the status to track when things are running low.' },
      { heading: 'Categories', body: 'Supplies are grouped by category (Solder, Foil, Lead, Flux, Tools, Other) so you can scan what you need quickly.' },
      { heading: 'Stock status', body: 'Same status options as glass: In Stock, Low Stock, Out of Stock. Low and Out of Stock items trigger a Dashboard alert.' },
      { heading: 'Bulk actions', body: 'Use "Select" to update tags, status, or delete multiple supplies at once.' },
    ],
  },
  {
    id: 'shopping',
    icon: ShoppingCart,
    iconColor: 'text-green-600',
    title: 'Shopping List',
    intro: 'A running list of everything you need to buy, organized by type and priority.',
    items: [
      { heading: 'Adding items', body: 'Click "Add Item" or use the restock shortcut on any glass card to populate the list automatically.' },
      { heading: 'Import from pattern', body: 'Click "From Pattern" to pull in the glass plan from any pattern as shopping list items — useful when preparing to start a new build.' },
      { heading: 'Priority', body: 'Set each item as High, Medium, or Low priority. The list sorts by priority so the most urgent items are always at the top.' },
      { heading: 'Marking purchased', body: 'Tick the checkbox on any item to mark it as bought. Purchased items are visually crossed out and can be cleared in bulk.' },
    ],
  },
  {
    id: 'suppliers',
    icon: Store,
    iconColor: 'text-teal-600',
    title: 'Suppliers',
    intro: 'An address book for the vendors and studios you buy from.',
    items: [
      { heading: 'Adding a supplier', body: 'Record the name, type (online, local, wholesale), contact details, website, and notes for each vendor.' },
      { heading: 'Specialties', body: 'Tag suppliers with what they carry (glass, tools, foil, etc.) so you can filter by what you need.' },
      { heading: 'Star rating', body: 'Rate each supplier from 1–5 stars for quick reference when deciding where to order.' },
      { heading: 'Filtering', body: 'Use the type and specialty filters to narrow the list when looking for a specific kind of supplier.' },
    ],
  },
  {
    id: 'search',
    icon: Search,
    iconColor: 'text-gray-600',
    title: 'Search',
    intro: 'Find anything in your stash by name, tag, manufacturer, or description.',
    items: [
      { heading: 'Global search', body: 'The Search page searches across glass, patterns, projects, and supplies simultaneously.' },
      { heading: 'Command palette (⌘K)', body: 'Press ⌘K (or Ctrl+K on Windows/Linux) from anywhere in the app to open a floating search palette. Type to find items instantly and press Enter to navigate to them.' },
    ],
  },
  {
    id: 'stats',
    icon: BarChart3,
    iconColor: 'text-indigo-600',
    title: 'Stats & Reports',
    intro: 'Charts and summaries that give you a bird\'s-eye view of your studio activity.',
    items: [
      { heading: 'Inventory breakdown', body: 'Bar charts showing how your glass and supplies are distributed across status categories.' },
      { heading: 'Project activity', body: 'Monthly counts of projects started and completed so you can see your output over time.' },
      { heading: 'Cost summary', body: 'Total material spend tracked across all projects.' },
    ],
  },
  {
    id: 'pdf-converter',
    icon: FileImage,
    iconColor: 'text-red-600',
    title: 'PDF Converter',
    intro: 'Convert PDF pattern files into PNG images you can attach to pattern records.',
    items: [
      { heading: 'Uploading a PDF', body: 'Drop a PDF file onto the converter or click to browse. The app renders each page as a PNG in your browser — no files are sent to any server.' },
      { heading: 'Resolution', body: 'Choose a resolution (72–300 DPI) before converting. Higher DPI gives sharper images but larger file sizes.' },
      { heading: 'Downloading', body: 'After conversion, click any thumbnail to download that page as a PNG, or download all pages at once.' },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    iconColor: 'text-gray-600',
    title: 'Settings & Backup',
    intro: 'App preferences and tools for backing up or restoring all your data.',
    items: [
      { heading: 'Dark mode', body: 'Toggle between light and dark themes. The preference is saved and applied automatically on next load.' },
      { heading: 'Notifications', body: 'Grant browser notification permission here so the app can remind you of upcoming project deadlines.' },
      { heading: 'Export (one-time download)', body: 'Click "Export JSON" to download a full backup of all your data as a single JSON file. Save this somewhere safe.' },
      { heading: 'Folder backup (Chrome / Edge)', body: 'Click "Choose Folder" to pick an iCloud Drive, Google Drive, or local folder. StainedGlass Flow will write a dated backup file directly into that folder whenever you trigger a backup — no download dialog needed.' },
      { heading: 'Import / Restore', body: 'Drag a previously exported JSON file onto the import area (or click to browse) to restore your data. Warning: importing replaces all current data.' },
      { heading: 'CSV import/export', body: 'Individual tables (glass, patterns, etc.) can be exported or imported as CSV files for editing in a spreadsheet.' },
    ],
  },
]

const tips: { icon: React.ElementType; heading: string; body: string }[] = [
  { icon: Keyboard, heading: '⌘K command palette', body: 'Press ⌘K (Ctrl+K on Windows/Linux) from any screen to search your entire stash instantly. Arrow keys navigate results; Enter opens the item.' },
  { icon: Tag, heading: 'Tags everywhere', body: 'Glass, patterns, projects, and supplies all support freeform tags. Use them consistently and you can filter your whole stash by a single keyword.' },
  { icon: Trash2, heading: 'Bulk actions', body: 'On Glass, Patterns, Projects, and Supplies pages, click "Select" to enter bulk mode. Select multiple cards and apply a tag, change status, or delete them all at once.' },
  { icon: Moon, heading: 'Dark mode', body: 'Toggle dark mode in Settings. The preference persists across sessions and loads instantly on start-up with no flash of light.' },
  { icon: Download, heading: 'Back up regularly', body: 'All data lives in your browser\'s IndexedDB — it is not synced to a server. Export a JSON backup after any significant work session so you don\'t lose data if you clear your browser storage.' },
  { icon: Upload, heading: 'Importing data', body: 'If you move to a new computer or browser, export on the old one and import on the new one. The import replaces everything, so do it on a fresh install.' },
  { icon: Bell, heading: 'Deadline reminders', body: 'Enable browser notifications in Settings to get reminded of approaching deadlines even when the app tab is in the background.' },
]

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)
  const Icon = section.icon

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Icon size={18} className={section.iconColor} />
        <span className="flex-1 font-semibold text-gray-900 dark:text-white">{section.title}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 mr-2 hidden sm:block">{section.intro.split(' ').slice(0, 8).join(' ')}…</span>
        {open
          ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
          : <ChevronRight size={16} className="text-gray-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4">{section.intro}</p>
          <dl className="space-y-3">
            {section.items.map(item => (
              <div key={item.heading}>
                <dt className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.heading}</dt>
                <dd className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <HelpCircle size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Help & Documentation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Everything you need to know about StainedGlass Flow</p>
        </div>
      </div>

      {/* What is this app */}
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800/40 p-5">
        <h2 className="font-semibold text-violet-900 dark:text-violet-300 mb-2">What is StainedGlass Flow?</h2>
        <p className="text-sm text-violet-800 dark:text-violet-400 leading-relaxed">
          StainedGlass Flow is a studio organizer for stained glass artists. It keeps your glass inventory,
          pattern library, project journal, supplies, shopping list, and supplier contacts all in one place —
          entirely in your browser, with no account required and no data sent to any server.
          Everything is stored locally in your browser using IndexedDB.
        </p>
      </div>

      {/* Module sections */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Modules</h2>
        <div className="space-y-2">
          {sections.map(section => (
            <AccordionSection key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Tips & Shortcuts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map(tip => {
            const Icon = tip.icon
            return (
              <div key={tip.heading} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={15} className="text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tip.heading}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{tip.body}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data & privacy */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Your data & privacy</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          StainedGlass Flow stores all data locally in your browser's IndexedDB. Nothing is uploaded to any server.
          Because the data lives in your browser, it can be erased if you clear your browser's site data.
          Use the <strong className="text-gray-700 dark:text-gray-300">Settings → Export JSON</strong> backup regularly to avoid data loss.
          The app works fully offline once loaded.
        </p>
      </div>
    </div>
  )
}
