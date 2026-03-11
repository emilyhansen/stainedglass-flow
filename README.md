# StainedGlass Flow

A personal studio organizer for stained glass artists. Track your glass inventory, patterns, projects, and supplies — all stored locally in your browser with no account required.

## Features

- **Glass Inventory** — Log every piece of glass with color, type, manufacturer, dimensions, cost, and photos. Toggle between a card view and a compact color-sorted swatch grid. Tracks price history over time and shows which projects each sheet was used in. Bulk-select cards to add/remove tags or change status across multiple sheets at once.
- **Patterns** — Catalog your pattern collection with style, difficulty, piece count, line drawings, photos, and a glass color plan. Tracks status from Wish List through Made, and shows how many projects have used each pattern.
- **Projects** — Manage active and completed work with a full journal, progress photos, deadline tracking, a materials cost calculator, and a commission pricing tool (markup + labor rate + hours = suggested price). Start a new project from a pattern template to pre-fill the glass plan.
- **Supplies** — Inventory your copper foil, solder, flux, came, tools, and other consumables, grouped by category with reorder thresholds.
- **Shopping List** — Capture items to buy with priority, estimated cost, and a purchased toggle. Items link back to glass or supply records. Marking a linked item as purchased prompts you to also mark the inventory record as In Stock.
- **Suppliers** — Contact list with star ratings, specialty tags, website links, and type filter (local / online).
- **Stats & Reports** — Visual dashboards: glass by type, inventory status, project progress, completions per month, most-used glass, tag overview. No chart library — pure CSS.
- **PDF / Image Converter** — Upload a PDF, PNG, or JPG and convert it to high-resolution PNG and/or traced SVG. Ideal for resizing patterns for vinyl cutters (Cricut, Silhouette) or light tables. Presets for line drawings and photos; custom tracer controls.
- **Deadlines** — Active projects grouped by urgency: overdue, this week, this month, later.
- **Search** — Full-text search (⌘K) across glass, patterns, projects, and supplies from anywhere in the app.
- **Settings & Backup** — Export all data as JSON; restore from a JSON backup; CSV import/export for glass and supplies inventory. Configure how many days before a deadline to trigger a browser notification.
- **Dark Mode** — Full dark mode with no flash on load; toggle in Settings.

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 (dark mode: class) |
| Routing | React Router v7 |
| Storage | IndexedDB via [idb](https://github.com/jakearchibald/idb) |
| Icons | lucide-react |
| PDF rendering | pdfjs-dist |
| SVG tracing | imagetracerjs |

All data is stored locally in your browser's IndexedDB — nothing is sent to a server.

## Getting Started

```bash
npm install
npm run dev        # or: ./start.sh
```

Then open [http://localhost:5173](http://localhost:5173).

`start.sh` is a convenience script that always runs from the correct project directory regardless of where your terminal is.

## Other Scripts

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # ESLint
npx tsc --noEmit # type check only
```

## Project Structure

```
src/
  lib/
    types.ts       # all TypeScript interfaces and union types
    db.ts          # IndexedDB abstraction layer (CRUD + export/import)
  components/
    layout/        # Layout (responsive shell), Sidebar (mobile drawer)
    ui/            # Badge, Button, Modal, ImageUpload, TagInput,
                   # EmptyState, ConfirmDialog, Lightbox,
                   # CommandPalette, BulkTagBar
  pages/
    DashboardPage.tsx
    GlassPage.tsx
    PatternsPage.tsx
    ProjectsPage.tsx
    SuppliesPage.tsx
    ShoppingPage.tsx
    SuppliersPage.tsx
    SettingsPage.tsx
    SearchPage.tsx
    DeadlinesPage.tsx
    StatsPage.tsx
    PdfConverterPage.tsx
    GalleryPage.tsx
  types/
    imagetracerjs.d.ts  # type declaration for imagetracerjs
```

## Data & Backup

Data lives entirely in your browser. To back up:

1. Go to **Settings & Backup**
2. Click **Export** to download `stainedglass-flow-backup-[date].json`
3. To restore, drag that file onto the import area (or click to browse)

> **Note:** Importing replaces all existing data. Export first if you want to keep anything.

## Troubleshooting

**App loads but has no styling (no layout, no colors)?**

The Vite dependency cache is stale. Delete it and restart:

```bash
rm -rf node_modules/.vite && npm run dev
# or shorthand:
./start.sh --fresh
```

Vite rebuilds the cache automatically — it's safe to delete any time.

---

**Port 5173 already in use?**

Vite will automatically pick the next available port (5174, 5175, …) and print the actual URL in the terminal.

---

## Future Plans

- Cloud sync / Supabase backend (`db.ts` is designed for this swap)
- Mobile app
