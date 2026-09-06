import { db, type Sale, type SaleItem, type Customer } from './db'

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export type CartItem = {
  productId: string
  name: string
  price: number
  cost: number
  qty: number
  stock: number // for validation, not stored
}

export async function createSale(
  items: CartItem[],
  paymentType: 'cash' | 'utang',
  customerName?: string
): Promise<Sale> {
  if (!items || items.length === 0) throw new Error('Walang laman ang cart')
  if (paymentType === 'utang' && (!customerName || !customerName.trim())) {
    throw new Error('Lagyan ng pangalan ng customer para sa utang')
  }

  // Normalize customer name
  const trimmedCustomer = customerName?.trim()

  // Build SaleItems with subtotal
  const saleItems: SaleItem[] = items.map((ci) => ({
    productId: ci.productId,
    name: ci.name,
    price: Math.round(ci.price * 100) / 100,
    cost: Math.round(ci.cost * 100) / 100,
    qty: ci.qty,
    subtotal: Math.round(ci.price * ci.qty * 100) / 100,
  }))

  const totalRevenue = Math.round(saleItems.reduce((sum, si) => sum + si.subtotal, 0) * 100) / 100
  const totalProfit = Math.round(saleItems.reduce((sum, si) => sum + (si.price - si.cost) * si.qty, 0) * 100) / 100

  const saleId = genId()
  const now = new Date()

  // Atomic transaction: products + sales + customers
  await db.transaction('rw', db.products, db.sales, db.customers, async () => {
    // 1. Validate and deduct stock inside transaction
    for (const ci of items) {
      const prod = await db.products.get(ci.productId)
      if (!prod) throw new Error(`Hindi nakita: ${ci.name}`)
      if (prod.isArchived) throw new Error(`Archived na: ${ci.name}`)
      if (prod.stock < ci.qty) {
        throw new Error(`Kulang sa stock: ${ci.name} (stock: ${prod.stock}, hinihingi: ${ci.qty})`)
      }
    }
    // Deduct
    for (const ci of items) {
      const prod = await db.products.get(ci.productId)
      if (!prod) throw new Error(`Hindi nakita: ${ci.name}`)
      await db.products.update(ci.productId, {
        stock: prod.stock - ci.qty,
        updatedAt: now,
      })
    }

    // 2. Handle utang customer
    let customerId: string | undefined = undefined
    if (paymentType === 'utang' && trimmedCustomer) {
      // find existing by case-insensitive name
      const existing = await db.customers.filter((c) => c.name.toLowerCase() === trimmedCustomer.toLowerCase()).first()
      if (existing) {
        customerId = existing.id
        await db.customers.update(existing.id, {
          balance: Math.round((existing.balance + totalRevenue) * 100) / 100,
          updatedAt: now,
        })
      } else {
        customerId = genId()
        const newCustomer: Customer = {
          id: customerId,
          name: trimmedCustomer,
          balance: totalRevenue,
          createdAt: now,
          updatedAt: now,
        }
        await db.customers.add(newCustomer)
      }
    }

    // 3. Insert sale
    const sale: Sale = {
      id: saleId,
      items: saleItems,
      totalRevenue,
      totalProfit,
      paymentType,
      customerId,
      customerName: paymentType === 'utang' ? trimmedCustomer : undefined,
      createdAt: now,
    }
    await db.sales.add(sale)
  })

  // Return the created sale (fetch it)
  const created = await db.sales.get(saleId)
  if (!created) throw new Error('Hindi na-save ang benta')
  return created
}

export async function getSalesByDate(date: Date): Promise<Sale[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return db.sales.where('createdAt').between(start, end, true, true).toArray()
}

export async function getAllSales(limit = 100): Promise<Sale[]> {
  return db.sales.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function getDailyTotals(date: Date): Promise<{ revenue: number; profit: number; utangTotal: number; count: number }> {
  const sales = await getSalesByDate(date)
  const revenue = Math.round(sales.reduce((s, sale) => s + sale.totalRevenue, 0) * 100) / 100
  const profit = Math.round(sales.reduce((s, sale) => s + sale.totalProfit, 0) * 100) / 100
  const utangTotal = Math.round(sales.filter((s) => s.paymentType === 'utang').reduce((s, sale) => s + sale.totalRevenue, 0) * 100) / 100
  return { revenue, profit, utangTotal, count: sales.length }
}

export async function getTotalUtang(): Promise<number> {
  const customers = await db.customers.toArray()
  return Math.round(customers.reduce((sum, c) => sum + c.balance, 0) * 100) / 100
}
