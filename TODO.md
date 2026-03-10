# Glass Stash — TODO

Items are roughly prioritized within each section.

---

## High Value / Low Effort

- [ ] **Supply usage history** — Mirror glass usage history. Load projects on mount in SuppliesPage, build `supplyUsageMap: Record<supplyId, projectName[]>`, show "Used in N projects" on supply cards and in the supply edit modal.

- [ ] **Pattern difficulty filter** — A `difficulty` field already exists on `Pattern` but there's no filter chip on PatternsPage. Add a row of filter buttons (Beginner / Intermediate / Advanced / Expert / All) above the pattern grid.

- [ ] **Glass restock shortcut** — From a low-stock alert on the Dashboard, add a one-click "Add to Shopping List" button so you don't have to navigate to Shopping and type the name manually.

---

## Medium Effort

- [ ] **Supplier → Shopping List linking** — On ShoppingList items, show which supplier to order from (link to SuppliersPage). Or on a SupplierCard, show a badge for items you have marked to buy.

- [ ] **Pattern glass plan cost rollup** — PatternsPage already has `GlassPlanSection` (assign specific glass to pattern pieces). Add a cost summary below: sum up `glass.costPerSheet × estimated coverage` to show a total estimated material cost for the pattern.

- [ ] **Project stats** — In StatsPage, add average time-to-completion (for Completed projects with both `startDate` and `completedDate`), and a "most productive month" highlight.

- [ ] **Batch delete** — Extend the existing `BulkTagBar` component (already used in GlassPage and SuppliesPage) to support a bulk delete action with a `ConfirmDialog`.

- [ ] **Print view** — A `@media print` stylesheet for the ProjectsPage cost summary, so you can print a materials breakdown for a commission job.

---

## Backend / Data

- [ ] **Supabase migration** — `src/lib/db.ts` is already abstracted as a clean CRUD layer. Swapping to Supabase means replacing `getAllGlass()`, `saveGlass()`, etc. with Supabase queries — no page-level changes needed. Add auth at the Layout level.

- [ ] **Cloud image storage** — Images are currently stored as base64 data URLs in IndexedDB, which bloats the DB size. Migrate to Supabase Storage or Cloudinary URLs once the backend exists.

- [ ] **Multi-device sync** — Follows naturally from Supabase migration.

---

## Lower Priority / Nice to Have

- [ ] **Deadline notifications** — Use the browser Notifications API to show a reminder when a project deadline is within N days. Trigger the check on app load (with user permission).

- [ ] **Mobile swipe-to-reveal delete** — Delete buttons are currently hover-only (desktop). Add swipe-left gesture on mobile to reveal a delete button on cards.

- [ ] **iCloud / Google Drive backup** — Extend the Settings export to optionally save the JSON file directly to Google Drive (via the Picker API) or a similar cloud storage.

- [ ] **Keyboard navigation** — The ⌘K command palette already exists. Add arrow-key navigation within pages (e.g., j/k to move between cards when a card is focused).

- [ ] **Undo for deletes** — Show a brief toast ("Deleted — Undo") after a card delete, with a short timeout before the actual DB write is committed.

---

## Known Issues / Tech Debt

- [ ] **MEMORY.md project path** — `~/.claude/projects/.../memory/MEMORY.md` still references the old path `/Users/emily.hansen/src/github/stash`. The real path is `/Users/emily.hansen/src/github-personal/stainedglass-stash`. Update if Claude sessions are starting with the wrong working directory.

- [ ] **`SupplierCard` / `SupplyCard` delete buttons** — Both components accept an `onDelete` prop but don't currently render a delete button in their card body (the prop is unused, suppressed with `_onDelete`). Add the hover-reveal delete button pattern (already used in GlassCard) to be consistent.

- [ ] **`GalleryPage`** — Route exists at `/gallery` but it's not clear what this page shows. Verify it's wired up and useful, or remove the route.
