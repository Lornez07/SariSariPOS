import Dexie, { type Table } from 'dexie'

// --- Types ---

export interface Product {
  id: string
  name: string
  category: string
  price: number
  cost: number
  stock: number
  lowStockThreshold: number
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SaleItem {
  productId: string
  name: string
  price: number
  cost: number
  qty: number
  subtotal: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  totalRevenue: number
  totalProfit: number
  paymentType: 'cash' | 'utang'
  customerId?: string
  customerName?: string
  createdAt: Date
}

export interface Customer {
  id: string
  name: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  customerId: string
  amount: number
  createdAt: Date
}

// --- Dexie DB ---

class SariSariDB extends Dexie {
  products!: Table<Product, string>
  sales!: Table<Sale, string>
  customers!: Table<Customer, string>
  payments!: Table<Payment, string>

  constructor() {
    super('SariSariPOS')
    this.version(1).stores({
      products: 'id, name, category, isArchived',
      sales: 'id, createdAt, paymentType, customerId',
      customers: 'id, name',
      payments: 'id, customerId, createdAt',
    })
  }
}

export const db = new SariSariDB()

// Helper: verify DB is accessible (for fallback handling)
export async function checkDbHealth(): Promise<boolean> {
  try {
    await db.products.limit(1).toArray()
    return true
  } catch (e) {
    console.error('Dexie health check failed:', e)
    return false
  }
}
