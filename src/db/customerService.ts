import { db } from './db'

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function addUtangPayment(customerId: string, amount: number): Promise<void> {
  if (!customerId) throw new Error('Kulangan ng customer ID')
  if (isNaN(amount) || amount <= 0) throw new Error('Mali ang halaga ng bayad')
  const customer = await db.customers.get(customerId)
  if (!customer) throw new Error('Hindi nakita ang customer')
  if (amount > customer.balance + 0.001) throw new Error('Sobra sa utang')

  const rounded = Math.round(amount * 100) / 100
  const now = new Date()

  await db.transaction('rw', db.customers, db.payments, async () => {
    await db.payments.add({
      id: genId(),
      customerId,
      amount: rounded,
      createdAt: now,
    })
    await db.customers.update(customerId, {
      balance: Math.round((customer.balance - rounded) * 100) / 100,
      updatedAt: now,
    })
  })
}

export async function getCustomerSales(customerId: string) {
  return db.sales.where('customerId').equals(customerId).toArray()
}

export async function getCustomerPayments(customerId: string) {
  return db.payments.where('customerId').equals(customerId).toArray()
}
