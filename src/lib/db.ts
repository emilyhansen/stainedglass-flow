import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GlassItem, Pattern, Project, Supply, ShoppingItem, Supplier } from './types'

interface StashDB extends DBSchema {
  glass: { key: string; value: GlassItem; indexes: { 'by-status': string; 'by-type': string } }
  patterns: { key: string; value: Pattern; indexes: { 'by-status': string } }
  projects: { key: string; value: Project; indexes: { 'by-status': string } }
  supplies: { key: string; value: Supply; indexes: { 'by-category': string; 'by-status': string } }
  shopping: { key: string; value: ShoppingItem; indexes: { 'by-type': string } }
  suppliers: { key: string; value: Supplier; indexes: { 'by-type': string } }
}

let db: IDBPDatabase<StashDB>

export async function getDB() {
  if (!db) {
    db = await openDB<StashDB>('stained-glass-stash', 2, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          const glass = database.createObjectStore('glass', { keyPath: 'id' })
          glass.createIndex('by-status', 'status')
          glass.createIndex('by-type', 'type')

          const patterns = database.createObjectStore('patterns', { keyPath: 'id' })
          patterns.createIndex('by-status', 'status')

          const projects = database.createObjectStore('projects', { keyPath: 'id' })
          projects.createIndex('by-status', 'status')

          const supplies = database.createObjectStore('supplies', { keyPath: 'id' })
          supplies.createIndex('by-category', 'category')
          supplies.createIndex('by-status', 'status')

          const shopping = database.createObjectStore('shopping', { keyPath: 'id' })
          shopping.createIndex('by-type', 'type')
        }
        if (oldVersion < 2) {
          const suppliers = database.createObjectStore('suppliers', { keyPath: 'id' })
          suppliers.createIndex('by-type', 'type')
        }
      },
    })
  }
  return db
}

function now() {
  return new Date().toISOString()
}

// --- Glass ---
export async function getAllGlass(): Promise<GlassItem[]> {
  return (await getDB()).getAll('glass')
}
export async function saveGlass(item: GlassItem): Promise<void> {
  const db = await getDB()
  item.updatedAt = now()
  await db.put('glass', item)
}
export async function deleteGlass(id: string): Promise<void> {
  await (await getDB()).delete('glass', id)
}

// --- Patterns ---
export async function getAllPatterns(): Promise<Pattern[]> {
  return (await getDB()).getAll('patterns')
}
export async function savePattern(item: Pattern): Promise<void> {
  const db = await getDB()
  item.updatedAt = now()
  await db.put('patterns', item)
}
export async function deletePattern(id: string): Promise<void> {
  await (await getDB()).delete('patterns', id)
}

// --- Projects ---
export async function getAllProjects(): Promise<Project[]> {
  return (await getDB()).getAll('projects')
}
export async function saveProject(item: Project): Promise<void> {
  const db = await getDB()
  item.updatedAt = now()
  await db.put('projects', item)
}
export async function deleteProject(id: string): Promise<void> {
  await (await getDB()).delete('projects', id)
}

// --- Supplies ---
export async function getAllSupplies(): Promise<Supply[]> {
  return (await getDB()).getAll('supplies')
}
export async function saveSupply(item: Supply): Promise<void> {
  const db = await getDB()
  item.updatedAt = now()
  await db.put('supplies', item)
}
export async function deleteSupply(id: string): Promise<void> {
  await (await getDB()).delete('supplies', id)
}

// --- Shopping ---
export async function getAllShopping(): Promise<ShoppingItem[]> {
  return (await getDB()).getAll('shopping')
}
export async function saveShopping(item: ShoppingItem): Promise<void> {
  const db = await getDB()
  item.updatedAt = now()
  await db.put('shopping', item)
}
export async function deleteShopping(id: string): Promise<void> {
  await (await getDB()).delete('shopping', id)
}

// --- Suppliers ---
export async function getAllSuppliers(): Promise<Supplier[]> {
  return (await getDB()).getAll('suppliers')
}
export async function saveSupplier(item: Supplier): Promise<void> {
  const db = await getDB()
  item.updatedAt = now()
  await db.put('suppliers', item)
}
export async function deleteSupplier(id: string): Promise<void> {
  await (await getDB()).delete('suppliers', id)
}

// --- Export / Import ---
export async function exportAllData(): Promise<object> {
  const database = await getDB()
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    glass: await database.getAll('glass'),
    patterns: await database.getAll('patterns'),
    projects: await database.getAll('projects'),
    supplies: await database.getAll('supplies'),
    shopping: await database.getAll('shopping'),
    suppliers: await database.getAll('suppliers'),
  }
}

export async function importAllData(data: Record<string, unknown[]>): Promise<void> {
  const database = await getDB()
  const stores = ['glass', 'patterns', 'projects', 'supplies', 'shopping', 'suppliers'] as const

  // Validate: every record must have an `id` string (required keyPath)
  for (const store of stores) {
    const records = data[store] ?? []
    for (const record of records) {
      if (!record || typeof record !== 'object' || !('id' in record) || typeof (record as { id: unknown }).id !== 'string') {
        throw new Error(`Invalid record in "${store}": each item must have a string "id" field`)
      }
    }
  }

  // Use a single readwrite transaction across all stores for atomicity
  const tx = database.transaction([...stores], 'readwrite')
  for (const store of stores) {
    await tx.objectStore(store).clear()
    const records = (data[store] ?? []) as never[]
    for (const record of records) {
      await tx.objectStore(store).put(record)
    }
  }
  await tx.done

  // Reset the module-level db reference so next call re-opens
  db = undefined as unknown as IDBPDatabase<StashDB>
}
