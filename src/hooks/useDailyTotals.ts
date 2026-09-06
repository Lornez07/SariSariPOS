import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export function useDailyTotals(date: Date = new Date()) {
  return useLiveQuery(async () => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const sales = await db.sales.where('createdAt').between(start, end, true, true).toArray()
    const revenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0)
    const profit = sales.reduce((sum, s) => sum + s.totalProfit, 0)
    const utangTotal = sales.filter((s) => s.paymentType === 'utang').reduce((sum, s) => sum + s.totalRevenue, 0)

    return {
      revenue,
      profit,
      utangTotal,
      count: sales.length,
    }
  }, [date.toDateString()])
}
