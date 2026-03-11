# StainedGlass Flow — Session Handoff

> Last updated after **Session 6** — app renamed to StainedGlass Flow, color scheme changed from teal to violet.

A stained glass studio organizer app built with Vite + React + TypeScript + Tailwind CSS + IndexedDB. No backend — all data stored locally via IndexedDB (`idb` library).

**Project path:** `/Users/emily.hansen/src/github-personal/stainedglass-stash`

---

## What We Were Trying to Do

Build a fully-featured stained glass studio organizer. Over five sessions:

**Session 1 — Batch A (5 features):** Cmd+K command palette, photo lightbox, pattern→project linking, commission pricing calculator, and a deadlines view.

**Session 2 — Batch B (6 features):** Glass price history, bulk tag editing (glass + supplies), glass usage history, a Stats & Reports page, a PDF → PNG converter, and a responsive/mobile layout.

**Session 3 — Dark Mode:** Full dark mode implementation across every component, shared UI, and page file.

**Session 4 — SVG Export + TypeScript fixes:** Added SVG output to the PDF/Image Converter (PNG input, PDF input, tracer settings panel, dual preview, per-page/bulk download); fixed 13 TypeScript strict-mode errors across 8 files.

**Session 5 — Dev tooling + CSS bug fix:** Diagnosed and fixed a stale Vite cache that caused Tailwind CSS to generate zero utility classes; created `start.sh` / `stop.sh` launcher scripts; fixed `.claude/launch.json` so the MCP preview tool works; updated README, CLAUDE.md, and .gitignore.

**Session 6 — Rebrand:** Renamed the app from "Glass Stash" to "StainedGlass Flow" and changed the primary color from teal to violet throughout.

---

## What Was Built

### Tech Stack
- **Vite + React 19 + TypeScript**
- **Tailwind CSS v3** — custom `.input` utility class in `src/index.css`; violet color palette (built-in, no custom override needed); `darkMode: 'class'`
- **React Router v7** — nested routes under `<Layout />`
- **idb** — IndexedDB wrapper; DB at **version 2** with `if (oldVersion < N)` migration guards
- **nanoid** — ID generation
- **date-fns** — date formatting (`format`, `differenceInCalendarDays`, `subMonths`, `startOfMonth`)
- **lucide-react** — icons throughout
- **pdfjs-dist** — in-browser PDF rendering (no server needed)
- **imagetracerjs** — in-browser raster→SVG tracing (no WASM, no server)

### Routes (`src/App.tsx`)
| Path | Page | Notes |
|------|------|-------|
| `/` | DashboardPage | Stats cards, active projects, deadlines widget, quick-add |
| `/glass` | GlassPage | Card + swatch view, bulk tag select, price history, usage history |
| `/patterns` | PatternsPage | Photos, line drawings, lightbox, project usage count |
| `/projects` | ProjectsPage | Journal, cost estimator, commission pricing, pattern link |
| `/supplies` | SuppliesPage | Grouped by category, bulk tag select |
| `/shopping` | ShoppingPage | Priority, purchase toggle |
| `/suppliers` | SuppliersPage | StarRating, specialty filter |
| `/settings` | SettingsPage | JSON export/import, CSV import, **dark mode toggle** |
| `/search` | SearchPage | Full-text across all stores |
| `/deadlines` | DeadlinesPage | Overdue/this week/this month/later groups |
| `/stats` | StatsPage | CSS bar charts, completions histogram, tag overview |
| `/pdf-converter` | PdfConverterPage | PDF/PNG/JPG → **PNG and/or SVG** with tracer settings |
| `/gallery` | GalleryPage | Photo gallery view |

### Key Files
- `src/lib/types.ts` — all TypeScript types; **read this first** in any new session
- `src/lib/db.ts` — CRUD layer for all 6 stores; abstracts IndexedDB
- `src/components/layout/Layout.tsx` — app shell; mobile top bar + hamburger; Cmd+K listener
- `src/components/layout/Sidebar.tsx` — slide-in drawer on mobile (`open`/`onClose` props), sticky on desktop
- `src/components/ui/` — Badge, Button, Modal, ImageUpload, TagInput, EmptyState, ConfirmDialog, Lightbox, CommandPalette, **BulkTagBar**
- `src/pages/` — one file per route (see table above)
- `src/types/imagetracerjs.d.ts` — type declaration for `imagetracerjs` (no official types on npm)
- `start.sh` — launcher script; always runs from project root regardless of terminal cwd; `./start.sh --fresh` clears Vite cache first
- `stop.sh` — stops whatever process is on port 5173

---

## Completed Features — Full Inventory

### Phase 1 Core (pre-existing)
- Glass Inventory (card + swatch view, sort by hue)
- Patterns (with line drawings, glass color plan)
- Projects (status, journal, cost estimator)
- Supplies (grouped by category)
- Shopping List (grouped by type, priority, purchase toggle)
- Suppliers (star rating, specialty tags, filter)
- Settings & Backup (JSON export + drag-drop import, CSV glass import + CSV export for glass/supplies)
- Dashboard (stats, active projects, low-stock alerts + "Add all to shopping list")

### Batch A (Session 1)
1. **Cmd+K Command Palette** — `CommandPalette.tsx`; global `keydown` listener in `Layout.tsx`; debounced search across all 4 stores; keyboard nav (↑↓ Enter Esc); ⌘K hint button on mobile top bar
2. **Photo Lightbox** — `Lightbox.tsx`; used in GlassPage, PatternsPage, ProjectsPage; `cursor-zoom-in` + `onClick={e => { e.stopPropagation(); openLightbox(...) }}`
3. **Pattern→Project Linking** — `patternId`/`patternName` on `Project`; ProjectForm has inline pattern search; PatternCard shows "Used in N projects" count via `useMemo`
4. **Commission Pricing** — `commissionMarkup`, `commissionLaborRate`, `commissionLaborHours` on `Project`; `CommissionSection` component inside ProjectsPage; markup slider 0–300% + labor rate × hours = suggested price
5. **Deadlines Page** — `/deadlines`; groups active projects: Overdue (red), This week (amber), This month (violet), Later (gray), No deadline; CalendarClock nav item in Sidebar; "Upcoming Deadlines" widget on Dashboard

### Batch B (Session 2)
6. **Glass Price History** — `GlassPriceEntry` interface + `priceHistory?: GlassPriceEntry[]` on `GlassItem`; collapsible `PriceHistorySection` inside `GlassForm`; "+ Add price entry" auto-fills today's date; rows: date / cost / supplier / × remove
7. **Bulk Tag Editing** — shared `BulkTagBar` component (`src/components/ui/BulkTagBar.tsx`); "Select" button in GlassPage + SuppliesPage toolbars; checkbox overlay on cards; floating dark bar at bottom with "Add tag" / "Remove tag" flows; applies to all selected IDs then exits select mode
8. **Glass Usage History** — GlassPage loads `getAllProjects()` on mount; builds `glassUsageMap: Record<glassId, projectName[]>`; GlassCard shows "Used in N projects" (violet, FolderKanban icon); GlassForm modal shows violet badge panel listing all project names
9. **Stats & Reports Page** — `/stats`; pure CSS horizontal bars (no recharts/chart.js); sections: Glass by Type, Inventory Status (glass+supplies), Projects by Status + by Type, Pattern Library, Completions per Month (column chart using inline styles), Shopping Summary, Most Used Glass, Tags Overview
10. **PDF → PNG Converter** — `/pdf-converter`; `pdfjs-dist` with `workerSrc` set via `import.meta.url`; drag-and-drop or file picker; scale selector (1×/2×/3× = 96/192/288 dpi); renders all pages to canvas; thumbnail grid; click thumbnail → page preview panel with prev/next nav
11. **Responsive / Mobile Layout** — `Layout.tsx`: `hidden lg:block` wrapper around desktop sidebar + `lg:hidden` mobile top bar (hamburger + ⌘K badge); `Sidebar.tsx` accepts `open`/`onClose` props; fixed drawer with `translate-x-0`/`-translate-x-full` transition + dark backdrop on mobile; close on backdrop click or nav link click

### Session 3 — Dark Mode ✅
12. **Dark Mode** — Tailwind `darkMode: 'class'`; toggle in SettingsPage Appearance card with Sun/Moon lucide icons; no-flash inline script in `index.html` (`if(localStorage.getItem('darkMode')==='true')document.documentElement.classList.add('dark')`); complete coverage of every page, component, card, and form.

### Session 4 — SVG Export ✅
13. **PDF/Image → SVG Converter** — Extended `/pdf-converter` to output SVG in addition to (or instead of) PNG:
    - **Input:** PDF (multi-page via pdfjs), PNG, JPG — file picker or drag-and-drop
    - **Output:** PNG only / SVG only / PNG + SVG (toggle buttons in toolbar)
    - **Tracer:** `imagetracerjs` v1.2.6 — pure JS, in-browser, no server; called via `ImageTracer.imagedataToSVG(imageData, opts)`
    - **Presets:** Simple (2 colors, ideal for line drawings + vinyl cutters) / Detailed (16 colors) / Custom
    - **Custom sliders:** Colors (2–32), Path Omit noise (0–32), Blur Radius (0–5)
    - **Preview:** When "both" selected, side-by-side PNG + SVG comparison panel
    - **Downloads:** "Download SVG" per page (violet button) + "All SVG" bulk download; SVG thumbnail badge
    - **TypeScript:** `src/types/imagetracerjs.d.ts` declares the module (no official @types package)

### Session 6 — Rebrand ✅
21. **App renamed to StainedGlass Flow** — Updated `index.html` (title, apple-mobile-web-app-title, theme-color), Sidebar header/footer, Layout mobile header, DashboardPage welcome heading, SettingsPage description/footer, and backup filename (`stainedglass-flow-backup-[date].json`). DB name (`stained-glass-stash`) intentionally unchanged to preserve existing data.
22. **Color scheme: teal → violet** — Removed custom teal override from `tailwind.config.js` (violet is a Tailwind built-in). Global find-and-replace of all `teal-*` classes → `violet-*` across 21 src files. Updated `theme-color` meta tag to `#7c3aed` (violet-600).

### Session 5 — Dev Tooling ✅
14. **CSS / Vite cache bug diagnosed and fixed** — Stale `node_modules/.vite` caused Tailwind to generate zero utility classes (empty `@tailwind utilities`). Fix: `rm -rf node_modules/.vite && npm run dev`. The cache rebuilds automatically.
15. **`start.sh`** — Launcher script at project root. `./start.sh` starts dev server from the correct directory regardless of terminal cwd. `./start.sh --fresh` clears Vite cache first.
16. **`stop.sh`** — Stops whatever process is on port 5173 (`lsof -ti tcp:5173 | xargs kill`).
17. **`.claude/launch.json` fixed** — The MCP `preview_start` tool looks for launch config at the Claude project root (`/Users/emily.hansen/src/github/stash/.claude/`), which differs from the actual project. Created `launch.json` there that shells out to the correct directory: `bash -c "cd /Users/emily.hansen/src/github-personal/stainedglass-stash && npm run dev"`.
18. **README.md updated** — Added `start.sh` to Getting Started; added `GalleryPage.tsx` to project structure; added Troubleshooting section (Vite cache fix + port-in-use note).
19. **CLAUDE.md updated** — Added `start.sh` to commands; added "CSS not rendering?" troubleshooting section with cache fix command.
20. **`.gitignore` updated** — Added explicit `node_modules/.vite` entry (already covered by `node_modules` but now self-documenting).

---

## Dark Mode Reference

### How It Works
- **`tailwind.config.js`** — `darkMode: 'class'`
- **`index.html`** — No-flash inline script: `<script>if(localStorage.getItem('darkMode')==='true')document.documentElement.classList.add('dark')</script>`
- **Toggle (`SettingsPage.tsx`):**
  ```tsx
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('darkMode', String(next))
  }
  ```
- **Input fields special case:** `@apply dark:...` in `@layer components` doesn't work in Tailwind v3. Use `.dark .input {}` in `src/index.css` instead.

### Color Mapping
| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-900` (cards) |
| `bg-gray-50/100` | `dark:bg-gray-800` |
| `border-gray-200` | `dark:border-gray-700` |
| `text-gray-900` | `dark:text-white` |
| `text-gray-600/700` | `dark:text-gray-300/200` |
| `text-gray-500` | `dark:text-gray-400` |
| Page body | `dark:bg-gray-950` (CSS) |
| Badges | `dark:bg-*-900/30 dark:text-*-400` |

---

## Important Design Decisions

- **All forms open in modals** (not separate pages)
- **Delete buttons** hidden, revealed on card hover via `group`/`group-hover`
- **DB version 2** — Suppliers store added in v2. If adding a new store in future, bump to v3 with `if (oldVersion < 3)` guard
- **Images** stored as base64 data URLs in IndexedDB (compressed via canvas in `ImageUpload.tsx`)
- **GlassType** includes Bevel and Bevel Cluster (added late); cost label is dynamic: "per piece" vs "per sheet"
- **priceHistory / commission fields** are `optional` on their interfaces — safe to add without a DB migration
- **BulkTagBar** is shared between GlassPage and SuppliesPage via `src/components/ui/BulkTagBar.tsx`
- **pdfjs-dist v5 API change** — `page.render()` now requires `canvas: HTMLCanvasElement | null` as a required parameter (added in v5.x). Pass the canvas element explicitly: `page.render({ canvas, canvasContext: ctx, viewport })`
- **imagetracerjs index signature** — The local `TracerOptions` interface must include `[key: string]: unknown` to be assignable to the module's `TracerOptions`. When accessing known numeric keys via `keyof`, cast with `as number`.

---

## What Didn't Work / Watch Out For

- **Edit before Read**: The `Edit` tool errors with "file has not been read yet" if you haven't read the file in the current session. Always `Read` before `Edit`.
- **TypeScript strict null**: Run `npx tsc --noEmit` before and after changes. It's fast and catches import/type issues immediately.
- **IndexedDB store creation**: Stores can ONLY be created inside the `upgrade` callback in `openDB`. Bump the DB version and add an `if (oldVersion < N)` guard every time.
- **pdfjs worker path**: Using `.worker.min.js` fails in newer pdfjs-dist — use `.worker.mjs` instead.
- **pdfjs v5 `canvas` required**: `RenderParameters.canvas` is now required (not optional). Pass the `HTMLCanvasElement` directly.
- **`@apply dark:` in `@layer components`**: Does NOT work in Tailwind v3 with `darkMode: 'class'`. Use `.dark .input {}` CSS descendant selector.
- **String literal `||` chains**: TypeScript 5.9 flags `get('col1' || 'col2')` as always-truthy. Use `get('col1') || get('col2')` instead, and `+(get('col1') || get('col2')) || undefined` to coerce to number with undefined fallback.
- **Mixed `(string | number)[]` in CSV rows**: TypeScript won't accept `number | string` where `string[]` is expected. Wrap numeric fields with `String(value ?? '')`.
- **Project path mismatch**: The real project is at `/Users/emily.hansen/src/github-personal/stainedglass-stash`. MEMORY.md may still reference the old path (`/src/github/stash`) — ignore it.
- **TypeScript check command**: Use `npx --prefix /path/to/project tsc --noEmit -p /path/to/project/tsconfig.app.json` when the shell working directory doesn't match.
- **MCP `preview_start` tool path**: The tool looks for `.claude/launch.json` at `/Users/emily.hansen/src/github/stash/.claude/launch.json` (the Claude session root, not the real project). That file now exists and shells out to the correct project path. Do not delete it.
- **Stale Vite cache**: If CSS looks completely broken (no layout, no colors), run `./start.sh --fresh` or `rm -rf node_modules/.vite && npm run dev`. The `node_modules/.vite` cache can get out of sync with Tailwind's JIT scan.

---

## Current State

**Everything is working. TypeScript is clean. All features complete.**

- `npx tsc --noEmit` → zero errors
- Dev server: `./start.sh` → `http://localhost:5173`; `./stop.sh` to stop it
- App name: **StainedGlass Flow** (formerly Glass Stash)
- Primary color: **violet** (`violet-600` / `#7c3aed`) — all teal classes replaced
- Dark mode: toggle in Settings, no-flash on load, persists via localStorage
- PDF/Image Converter: PNG + SVG output, Simple/Detailed/Custom tracer presets, dual preview, per-page and bulk downloads — all verified in browser (light + dark mode)
- All 13 routes wired, all features verified
- CSS cache bug: fixed and documented in README Troubleshooting + CLAUDE.md

**No known bugs. No partial features. No broken routes.**

---

## DB Schema (current — version 2)

DB name: `stained-glass-stash`, version: **2**

| Store | Key | Indexes |
|-------|-----|---------|
| `glass` | `id` | `by-status`, `by-type` |
| `patterns` | `id` | `by-status` |
| `projects` | `id` | `by-status` |
| `supplies` | `id` | `by-status`, `by-category` |
| `shopping` | `id` | `by-type` |
| `suppliers` | `id` | `by-type` |

To add a new store, bump to version **3**:
```typescript
if (oldVersion < 3) {
  db.createObjectStore('newstore', { keyPath: 'id' })
}
```

---

## Next Steps (Potential Future Features)

All originally planned features are complete. Suggestions from `TODO.md`:

### High value / low effort
- **Supply usage history** — mirror glass usage history: load projects, build `supplyUsageMap`, show "Used in N projects" on supply cards
- **Pattern difficulty filter** — `difficulty` field exists on Pattern but no filter chip on PatternsPage yet
- **Glass restock shortcut** — "Add to Shopping List" button on Low/Out of Stock glass cards
- **Project start/completed date stats** — StatsPage could show average time-to-completion

### Medium effort
- **Supabase migration** — `db.ts` is already abstracted; swap `getAllGlass()` etc. for Supabase queries, add auth
- **Pattern glass plan cost rollup** — PatternsPage has `GlassPlanSection` but doesn't sum the cost
- **Batch delete** — extend BulkTagBar to support bulk deletion with a ConfirmDialog

### Lower priority
- **Deadline notifications** — Browser Notifications API reminder on app load when deadline is within N days
- **Print stylesheet** — `@media print` for project cost summaries
- **iCloud / Google Drive backup** — piggyback on Settings export with Drive Picker API

---

## Running Locally

```bash
cd /Users/emily.hansen/src/github-personal/stainedglass-stash
npm install
./start.sh              # http://localhost:5173
./start.sh --fresh      # clears Vite cache first (fixes missing CSS)
./stop.sh               # stop the dev server
npx tsc --noEmit        # type-check only
npm run build           # production build
```

The `.claude/launch.json` is at `/Users/emily.hansen/src/github/stash/.claude/launch.json` (the Claude session root) and points to this project. The MCP `preview_start` tool uses server name `stainedglass-stash` on port 5173.

---

## Context Files to Read First in Any New Session

1. `src/lib/types.ts` — all data shapes (GlassItem, GlassPriceEntry, Project, Pattern, Supply…)
2. `src/lib/db.ts` — CRUD layer; understand before touching data flow
3. The specific page file you're modifying
4. `src/components/ui/` — check what UI primitives already exist before building new ones
