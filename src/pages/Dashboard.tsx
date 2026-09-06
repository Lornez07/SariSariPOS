import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { formatPeso } from '../utils/currency'
import { isLowStock } from '../db/productService'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export default function Dashboard() {
  const today = new Date()
  const sales = useLiveQuery(() => db.sales.toArray(), [])
  const products = useLiveQuery(() => db.products.filter((p) => !p.isArchived).toArray(), [])
  const customers = useLiveQuery(() => db.customers.toArray(), [])

  if (sales === undefined || products === undefined || customers === undefined) {
    return <div className="p-4 text-center text-zinc-500">Loading...</div>
  }

  const start = startOfDay(today)
  const end = endOfDay(today)
  const todaySales = sales.filter((s) => s.createdAt >= start && s.createdAt <= end)

  const revenueToday = todaySales.reduce((sum, s) => sum + s.totalRevenue, 0)
  const profitToday = todaySales.reduce((sum, s) => sum + s.totalProfit, 0)
  const utangToday = todaySales.filter((s) => s.paymentType === 'utang').reduce((sum, s) => sum + s.totalRevenue, 0)
  const countToday = todaySales.length

  const totalUtang = customers.reduce((sum, c) => sum + c.balance, 0)
  const lowStock = products.filter((p) => isLowStock(p))

  // 7-day history - clearer labels: Ngayon (Set 7) etc with full date + weekday
  const days: { label: string; sublabel: string; date: Date; revenue: number; profit: number; utang: number; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const s = startOfDay(d)
    const e = endOfDay(d)
    const daySales = sales.filter((sale) => sale.createdAt >= s && sale.createdAt <= e)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) // e.g., Sep 07
    const weekday = d.toLocaleDateString('fil-PH', { weekday: 'short' }) // e.g., Lun, Mar
    days.push({
      label: i === 0 ? `Ngayon — ${dateStr}` : i === 1 ? `Kahapon — ${dateStr}` : dateStr,
      sublabel: i <= 1 ? `${weekday} • ${d.toLocaleDateString('fil-PH', { month: 'long', day: 'numeric' })}` : `${weekday} • ${d.toLocaleDateString('fil-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      date: d,
      revenue: daySales.reduce((sum, sale) => sum + sale.totalRevenue, 0),
      profit: daySales.reduce((sum, sale) => sum + sale.totalProfit, 0),
      utang: daySales.filter((sale) => sale.paymentType === 'utang').reduce((sum, sale) => sum + sale.totalRevenue, 0),
      count: daySales.length,
    })
  }

  const handleExport = async () => {
    try {
      const allProducts = await db.products.toArray()
      const allSales = await db.sales.toArray()
      const allCustomers = await db.customers.toArray()
      const allPayments = await db.payments.toArray()

      const csvRows: string[] = []
      csvRows.push('=== PRODUCTS ===')
      csvRows.push('id,name,category,price,cost,stock,threshold,archived')
      for (const p of allProducts) {
        csvRows.push(`"${p.id}","${p.name.replace(/"/g, '""')}","${p.category}",${p.price},${p.cost},${p.stock},${p.lowStockThreshold},${p.isArchived}`)
      }
      csvRows.push('')
      csvRows.push('=== SALES ===')
      csvRows.push('id,createdAt,paymentType,customerName,totalRevenue,totalProfit,items')
      for (const s of allSales) {
        const itemsStr = s.items.map((it) => `${it.name} x${it.qty}`).join('; ').replace(/"/g, '""')
        csvRows.push(`"${s.id}","${s.createdAt.toISOString()}",${s.paymentType},"${(s.customerName || '').replace(/"/g, '""')}",${s.totalRevenue},${s.totalProfit},"${itemsStr}"`)
      }
      csvRows.push('')
      csvRows.push('=== CUSTOMERS (UTANG) ===')
      csvRows.push('id,name,balance')
      for (const c of allCustomers) {
        csvRows.push(`"${c.id}","${c.name.replace(/"/g, '""')}",${c.balance}`)
      }
      csvRows.push('')
      csvRows.push('=== PAYMENTS ===')
      csvRows.push('id,customerId,amount,createdAt')
      for (const p of allPayments) {
        csvRows.push(`"${p.id}","${p.customerId}",${p.amount},"${p.createdAt.toISOString()}"`)
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sari-sari-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Hindi na-export')
    }
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="text-zinc-500 text-sm mb-4">Benta ngayong araw at tubo • {today.toLocaleDateString('fil-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

      {/* today cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Benta Ngayon</p>
          <p className="text-xl font-bold text-zinc-900">{formatPeso(revenueToday)}</p>
          <p className="text-[11px] text-zinc-400">{countToday} transaksyon</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-700">Tubo Ngayon</p>
          <p className="text-xl font-bold text-emerald-700">{formatPeso(profitToday)}</p>
          <p className="text-[11px] text-emerald-600">Kita mo ngayon</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-700">Utang Ngayon</p>
          <p className="text-xl font-bold text-amber-700">{formatPeso(utangToday)}</p>
          <p className="text-[11px] text-amber-600">Ngayong araw</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Kabuuang Utang</p>
          <p className="text-xl font-bold text-amber-600">{formatPeso(totalUtang)}</p>
          <p className="text-[11px] text-zinc-400">Lahat ng may utang</p>
        </div>
      </div>

      {/* low stock */}
      <div className={`rounded-xl p-3 mb-4 border ${lowStock.length > 0 ? 'bg-red-50 border-red-200' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className={`text-sm font-medium ${lowStock.length > 0 ? 'text-red-700' : 'text-zinc-600'}`}>
              {lowStock.length > 0 ? `⚠️ ${lowStock.length} items paubos na!` : '✅ Walang paubos'}
            </p>
            {lowStock.length > 0 && <p className="text-xs text-red-600 truncate">{lowStock.map((p) => `${p.name} (${p.stock})`).join(', ')}</p>}
          </div>
          {lowStock.length > 0 && (
            <a href="/paninda" className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded-full font-medium whitespace-nowrap">
              Tignan
            </a>
          )}
        </div>
      </div>

      {/* 7-day history */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-sm mb-3">Huling 7 Araw</h3>
        <div className="space-y-2">
          {days.map((d) => (
            <div key={d.label} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-900">{d.label}</p>
                <p className="text-xs text-zinc-500">
                  {d.sublabel} • {d.count} benta {d.utang > 0 ? `• Utang ${formatPeso(d.utang)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-zinc-900">{formatPeso(d.revenue)}</p>
                <p className="text-xs text-emerald-600">Tubo {formatPeso(d.profit)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* export */}
      <button onClick={handleExport} className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
        <span>⬇️</span> Export CSV (backup)
      </button>
      <p className="text-[11px] text-center text-zinc-400 mt-2">I-save ang data bilang CSV para hindi mawala</p>
    </div>
  )
}
