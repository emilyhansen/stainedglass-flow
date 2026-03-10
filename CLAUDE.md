# StainedGlass Flow — Claude Instructions

## Project

StainedGlass Flow — stained glass studio organizer. Vite + React 19 + TypeScript + Tailwind CSS v3 + IndexedDB (no backend). All data stored locally via `idb`.

**Real project path:** `/Users/emily.hansen/src/github-personal/stainedglass-stash`
(MEMORY.md may reference an old path or old name — ignore it if it differs)

## Commands

```bash
npm run dev          # dev server at http://localhost:5173
./start.sh           # same as above, but works from any directory
npx tsc --noEmit     # type check — run before AND after any changes
npm run build        # production build
npm run lint         # ESLint
```

### CSS not rendering? Clear the Vite cache

If Tailwind utility classes are missing (no layout, no colors, unstyled HTML):
```bash
rm -rf node_modules/.vite && npm run dev
```
The `.vite` folder caches pre-processed CSS. When stale, Tailwind generates zero utilities.
This is harmless to delete — Vite rebuilds it automatically on next start.

TypeScript check command when shell working directory is wrong:
```bash
npx --prefix /Users/emily.hansen/src/github-personal/stainedglass-stash tsc --noEmit \
  -p /Users/emily.hansen/src/github-personal/stainedglass-stash/tsconfig.app.json
```

## Read These First

Before touching any feature, read:
1. `src/lib/types.ts` — every data shape in the app
2. `src/lib/db.ts` — all CRUD; the only place IndexedDB is touched
3. The specific page file you're working on
4. `src/components/ui/` — check what primitives exist before building new ones

## Architecture

- **One file per route** in `src/pages/` — forms live in the same file as the page (in modals, not separate routes)
- **All forms in modals** — never navigate away to a form page
- **Delete buttons** hidden by default, revealed on card hover via Tailwind `group`/`group-hover`
- **Images** stored as base64 data URLs in IndexedDB (compressed in `ImageUpload.tsx`)
- **DB version 2** — to add a new store, bump to v3 with `if (oldVersion < 3)` guard in `db.ts`

## Tailwind / Dark Mode

- `darkMode: 'class'` in `tailwind.config.js`
- Toggle in SettingsPage writes `localStorage.setItem('darkMode', ...)` and calls `document.documentElement.classList.toggle('dark', next)`
- No-flash script in `index.html` `<head>`: `if(localStorage.getItem('darkMode')==='true')document.documentElement.classList.add('dark')`
- **Do not** use `@apply dark:` inside `@layer components` — it doesn't work in Tailwind v3 with class strategy. Use `.dark .selector {}` in `index.css` instead (already done for `.input`)
- Standard color mapping: `bg-white` → `dark:bg-gray-900`, `text-gray-900` → `dark:text-white`, `border-gray-200` → `dark:border-gray-700`, `text-gray-500` → `dark:text-gray-400`
- **Primary brand color is violet** (`violet-600` / `#7c3aed`) — no custom color override in `tailwind.config.js`, using Tailwind's built-in violet palette

## Key Components

| Component | Location | Notes |
|-----------|----------|-------|
| `BulkTagBar` | `src/components/ui/BulkTagBar.tsx` | Shared between GlassPage + SuppliesPage; floating bottom bar |
| `Lightbox` | `src/components/ui/Lightbox.tsx` | Used in GlassPage, PatternsPage, ProjectsPage |
| `CommandPalette` | `src/components/ui/CommandPalette.tsx` | Opened by ⌘K listener in Layout.tsx |
| `Layout` | `src/components/layout/Layout.tsx` | Contains ⌘K listener; `hidden lg:block` sidebar; `lg:hidden` mobile header |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | `open`/`onClose` props for mobile drawer |

## Common Gotchas

- **Edit before Read**: the Edit tool requires reading the file first in the same session
- **pdfjs-dist v5**: `page.render()` now requires `canvas: HTMLCanvasElement | null` as an explicit parameter — `page.render({ canvas, canvasContext: ctx, viewport })`
- **imagetracerjs index signature**: the local `TracerOptions` interface needs `[key: string]: unknown` to match the module's type; cast `opts[key]` back to `number` in JSX
- **Duplicate key spread** (TS2783): `{ field: default, ...obj }` is flagged if `obj` has the same key. Write it as `{ ...obj, field: obj.field ?? default }` instead
- **CSV rows type**: `(string | number)[]` won't satisfy `string[][]`. Wrap numeric fields with `String(value ?? '')`
- **String literal `||`** (TS2872): `get('col1' || 'col2')` is always-truthy. Use `+(get('col1') || get('col2')) || undefined` to check multiple CSV column names and coerce to number

## TypeScript Config

`tsconfig.app.json` has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Prefix intentionally-unused destructured params with `_` (e.g. `onDelete: _onDelete`) to satisfy the compiler without removing them from the prop type.
