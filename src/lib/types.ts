export type GlassType =
  | 'Cathedral'
  | 'Opalescent'
  | 'Textured'
  | 'Iridescent'
  | 'Streaky'
  | 'Seedy'
  | 'Glue Chip'
  | 'Beveled'
  | 'Jewel'
  | 'Mirror'
  | 'Bevel'
  | 'Bevel Cluster'
  | 'Other'

export type GlassStatus = 'In Stock' | 'Low' | 'Out of Stock'

export interface GlassPriceEntry {
  date: string
  costPerSheet: number
  supplier?: string
  notes?: string
}

export interface GlassItem {
  id: string
  name: string
  colorName: string
  colorCode?: string
  type: GlassType
  manufacturer?: string
  supplier?: string
  widthIn?: number
  heightIn?: number
  quantity?: string
  status: GlassStatus
  costPerSheet?: number
  priceHistory?: GlassPriceEntry[]
  notes?: string
  tags: string[]
  photos: string[]
  createdAt: string
  updatedAt: string
}

export type PatternStatus = 'Wish List' | 'In Stash' | 'In Progress' | 'Made'
export type PatternStyle =
  | 'Traditional'
  | 'Art Nouveau'
  | 'Geometric'
  | 'Nature'
  | 'Abstract'
  | 'Religious'
  | 'Floral'
  | 'Animal'
  | 'Landscape'
  | 'Other'
export type PatternDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export interface PatternGlassPlan {
  id: string
  pieceLabel: string
  glassId: string
  glassName: string
  notes?: string
}

export interface Pattern {
  id: string
  name: string
  designer?: string
  source?: string
  style?: PatternStyle
  difficulty?: PatternDifficulty
  widthIn?: number
  heightIn?: number
  pieceCount?: number
  status: PatternStatus
  notes?: string
  tags: string[]
  photos: string[]
  lineDrawings: string[]
  attachments: { name: string; data: string }[]
  glassPlan: PatternGlassPlan[]
  purchaseDate?: string
  purchasePrice?: number
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed'
export type ProjectType =
  | 'Panel'
  | 'Suncatcher'
  | 'Lamp'
  | 'Mosaic'
  | 'Repair'
  | 'Box'
  | 'Mirror Frame'
  | 'Other'

export interface ProjectGlassUsage {
  glassId: string
  glassName: string
  amount?: string    // text description e.g. "half sheet"
  multiplier?: number // cost multiplier, default 1
}

export interface ProjectSupplyUsage {
  supplyId: string
  supplyName: string
  amount?: string
  multiplier?: number
}

export interface ProjectJournalEntry {
  id: string
  date: string
  text: string
  photos: string[]
}

export interface Project {
  id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  patternId?: string
  patternName?: string
  coverPhoto?: string
  progressPhotos: string[]
  glassUsed: ProjectGlassUsage[]
  suppliesUsed: ProjectSupplyUsage[]
  description?: string
  nextStep?: string
  deadline?: string
  startDate?: string
  completedDate?: string
  estimatedCost?: number
  actualCost?: number
  commissionMarkup?: number     // markup percentage, e.g. 50 = 50% over cost
  commissionLaborRate?: number  // $/hr
  commissionLaborHours?: number // estimated hours
  recipient?: string
  tags: string[]
  journal: ProjectJournalEntry[]
  createdAt: string
  updatedAt: string
}

export type SupplyCategory =
  | 'Lead Came'
  | 'Copper Foil'
  | 'Solder'
  | 'Flux'
  | 'Patina'
  | 'Cutting Tools'
  | 'Grinder'
  | 'Safety'
  | 'Hanging Hardware'
  | 'Adhesive'
  | 'Cleaning'
  | 'Other'

export type SupplyStatus = 'In Stock' | 'Low' | 'Out of Stock'

export interface Supply {
  id: string
  name: string
  category: SupplyCategory
  brand?: string
  supplier?: string
  quantity?: string
  unit?: string
  status: SupplyStatus
  reorderThreshold?: string
  costPerUnit?: number
  notes?: string
  photos: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ShoppingItemType = 'Glass' | 'Supply' | 'Pattern' | 'Tool' | 'Other'

export interface ShoppingItem {
  id: string
  name: string
  type: ShoppingItemType
  supplier?: string
  url?: string
  quantity?: string
  estimatedCost?: number
  priority: 'Low' | 'Medium' | 'High'
  purchased: boolean
  notes?: string
  linkedId?: string
  createdAt: string
}

export type SupplierType = 'Online' | 'Local' | 'Both'
export type SupplierSpecialty = 'Glass' | 'Supplies' | 'Tools' | 'Patterns' | 'Equipment' | 'Other'

export interface Supplier {
  id: string
  name: string
  type: SupplierType
  website?: string
  email?: string
  phone?: string
  address?: string
  specialty: SupplierSpecialty[]
  notes?: string
  rating?: number // 1–5
  photos: string[]
  createdAt: string
  updatedAt: string
}
