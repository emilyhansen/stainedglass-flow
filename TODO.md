# StainedGlass Flow — TODO

Items are roughly prioritized within each section.

---

## High Value / Low Effort

- [ ] **Supplier → Shopping List linking** — On ShoppingList items, show which supplier to order from (link to SuppliersPage). Or on a SupplierCard, show a badge for items you have marked to buy.

- [ ] **`SupplierCard` / `SupplyCard` delete buttons** — Both components accept an `onDelete` prop but don't currently render a delete button in their card body (the prop is unused, suppressed with `_onDelete`). Add the hover-reveal delete button pattern (already used in GlassCard) to be consistent.

---

## Medium Effort

- [ ] **Pattern glass plan cost rollup** — PatternsPage already has `GlassPlanSection` (assign specific glass to pattern pieces). Add a cost summary below: sum up `glass.costPerSheet × estimated coverage` to show a total estimated material cost for the pattern.

- [ ] **Project stats** — In StatsPage, add average time-to-completion (for Completed projects with both `startDate` and `completedDate`), and a "most productive month" highlight.

- [ ] **Bulk operation error handling** — `handleBulkAddTag`, `handleBulkRemoveTag`, `handleBulkDelete`, `handleBulkSetStatus` in ProjectsPage, PatternsPage, GlassPage, and SuppliesPage lack try/catch. If any individual save/delete fails mid-loop, remaining items won't be processed and the user won't know. Wrap loops in try/catch and show a toast on failure.

---

## Backend / Data

- [ ] **Image Blob storage** — Images are stored as base64 data URLs (~33% larger than raw binary). IndexedDB supports native `Blob` storage which is more space-efficient. Requires bumping to DB version 3 in `db.ts`, updating `ImageUpload.tsx` to store Blobs, and updating all `<img src={...}>` rendering sites to use `URL.createObjectURL()`. Only worth doing if disk usage becomes a concern at scale.

- [ ] **Dexie.js** — Drop-in replacement for the `idb` library with a richer query API (compound indexes, live queries, better TypeScript types). Rewrite `db.ts` internals only; no page-level or UI changes needed.

- [ ] **SQLite WASM (PGlite or wa-sqlite)** — Replace IndexedDB with an in-browser SQLite/Postgres engine backed by the Origin Private File System (OPFS). Gains real SQL queries and joins. `db.ts` abstraction means function signatures stay the same — only internals change. Adds ~1–3 MB WASM bundle and requires `crossOriginIsolated` response headers on the dev/prod server.

- [ ] **Multi-device sync** — Would require a backend (Supabase or similar) and auth. The app's core value is being fully local and private — only pursue if sync across devices becomes a hard requirement.

---

## Lower Priority / Nice to Have

- [ ] **Scheduled auto-export** — Automatically export a JSON backup to a user-chosen folder on a schedule (e.g. daily, weekly). The folder-based backup via File System Access API already exists in `SettingsPage.tsx`; this would add a `setInterval` or `setTimeout` trigger on app load, respect a user-configurable interval stored in `localStorage`, and show a "Last backed up: X" timestamp in Settings. Requires the user to grant folder access once — the browser persists the handle via IndexedDB.

- [ ] **Mobile swipe-to-reveal delete** — Delete buttons are currently hover-only (desktop). Add swipe-left gesture on mobile to reveal a delete button on cards.

- [ ] **Keyboard navigation** — The ⌘K command palette already exists. Add arrow-key navigation within pages (e.g., j/k to move between cards when a card is focused).

- [ ] **Undo for deletes** — Show a brief toast ("Deleted — Undo") after a card delete, with a short timeout before the actual DB write is committed.

- [ ] **Gallery tagging / filtering** — `GalleryPage.tsx` currently shows all photos; add tag or status filters.
