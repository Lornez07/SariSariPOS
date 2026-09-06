import { db, type Product } from './db'

export const CATEGORIES = [
  'Softdrinks',
  'Snacks',
  'Canned Goods',
  'Noodles',
  'Coffee',
  'Load',
  'Bigas',
  'Condiments',
  'Personal Care',
  'Other',
] as const

export type ValidationError = {
  field: string
  message: string
}

export function validateProduct(data: Partial<Product>): ValidationError | null {
  if (!data.name || data.name.trim().length === 0) {
    return { field: 'name', message: 'Lagyan ng pangalan ang produkto' }
  }
  if (data.name.trim().length > 50) {
    return { field: 'name', message: 'Masyadong mahaba (max 50 characters)' }
  }
  if (data.price === undefined || data.price === null || isNaN(data.price as number)) {
    return { field: 'price', message: 'Lagyan ng presyo' }
  }
  if ((data.price as number) < 0) {
    return { field: 'price', message: 'Hindi pwedeng negative ang presyo' }
  }
  if (data.cost !== undefined && data.cost !== null && isNaN(data.cost as number)) {
    return { field: 'cost', message: 'Mali ang puhunan' }
  }
  if ((data.cost as number) < 0) {
    return { field: 'cost', message: 'Hindi pwedeng negative ang puhunan' }
  }
  if (data.stock === undefined || data.stock === null || isNaN(data.stock as number)) {
    return { field: 'stock', message: 'Lagyan ng stock' }
  }
  if (!Number.isInteger(data.stock) || (data.stock as number) < 0) {
    return { field: 'stock', message: 'Stock ay dapat buong numero at hindi negative' }
  }
  if (
    data.lowStockThreshold !== undefined &&
    (isNaN(data.lowStockThreshold as number) ||
      !Number.isInteger(data.lowStockThreshold as number) ||
      (data.lowStockThreshold as number) < 0)
  ) {
    return { field: 'lowStockThreshold', message: 'Threshold ay dapat buong numero' }
  }
  return null
}

function genId(): string {
  // use crypto if available, fallback to uuid-like
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function addProduct(data: Omit<Product, 'id' | 'isArchived' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const err = validateProduct(data)
  if (err) throw new Error(err.message)

  const now = new Date()
  const product: Product = {
    id: genId(),
    name: data.name.trim(),
    category: data.category || 'Other',
    price: Math.round((data.price as number) * 100) / 100,
    cost: Math.round(((data.cost as number) || 0) * 100) / 100,
    stock: data.stock as number,
    lowStockThreshold: data.lowStockThreshold ?? 5,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  }

  try {
    await db.products.add(product)
    return product.id
  } catch (e) {
    console.error('addProduct failed', e)
    throw new Error('Hindi na-save ang produkto. Subukan ulit.')
  }
}

export async function updateProduct(id: string, changes: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
  const existing = await db.products.get(id)
  if (!existing) throw new Error('Hindi nakita ang produkto')

  const merged = { ...existing, ...changes }
  // only validate fields being changed + required ones
  const err = validateProduct(merged)
  if (err) throw new Error(err.message)

  const toUpdate: Partial<Product> = {}
  if (changes.name !== undefined) toUpdate.name = changes.name.trim()
  if (changes.category !== undefined) toUpdate.category = changes.category
  if (changes.price !== undefined) toUpdate.price = Math.round((changes.price as number) * 100) / 100
  if (changes.cost !== undefined) toUpdate.cost = Math.round((changes.cost as number) * 100) / 100
  if (changes.stock !== undefined) toUpdate.stock = changes.stock as number
  if (changes.lowStockThreshold !== undefined) toUpdate.lowStockThreshold = changes.lowStockThreshold as number
  if (changes.isArchived !== undefined) toUpdate.isArchived = changes.isArchived
  toUpdate.updatedAt = new Date()

  try {
    await db.products.update(id, toUpdate)
  } catch (e) {
    console.error('updateProduct failed', e)
    throw new Error('Hindi na-update ang produkto.')
  }
}

export async function archiveProduct(id: string): Promise<void> {
  const existing = await db.products.get(id)
  if (!existing) throw new Error('Hindi nakita ang produkto')
  await db.products.update(id, { isArchived: true, updatedAt: new Date() })
}

// For hard delete if truly needs (no sales history) - not used in v1 UI, but kept
export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id)
}

export async function getActiveProducts(): Promise<Product[]> {
  return db.products.filter((p) => !p.isArchived).toArray()
}

export async function getLowStockProducts(): Promise<Product[]> {
  const products = await getActiveProducts()
  return products.filter((p) => p.stock <= p.lowStockThreshold)
}

export function isLowStock(product: Product): boolean {
  return product.stock <= product.lowStockThreshold
}

export function calcTubo(product: Product): number {
  return Math.round((product.price - product.cost) * 100) / 100
}
