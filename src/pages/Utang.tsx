import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { formatPeso } from '../utils/currency'
import { addUtangPayment } from '../db/customerService'

export default function Utang() {
  const customersRaw = useLiveQuery(() => db.customers.toArray(), [])
  const customers = customersRaw ? [...customersRaw].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()) : undefined
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payError, setPayError] = useState('')
  const [paySuccess, setPaySuccess] = useState('')
  const [search, setSearch] = useState('')

  const sales = useLiveQuery(async () => {
    if (!selectedId) return [] as import('../db/db').Sale[]
    return db.sales.where('customerId').equals(selectedId).toArray()
  }, [selectedId])
  const payments = useLiveQuery(async () => {
    if (!selectedId) return [] as import('../db/db').Payment[]
    return db.payments.where('customerId').equals(selectedId).toArray()
  }, [selectedId])

  if (customers === undefined) return <div className="p-4 text-center text-zinc-500">Loading...</div>

  const totalUtang = customers.reduce((sum, c) => sum + c.balance, 0)
  const filtered = search.trim() ? customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : customers
  const selected = selectedId ? customers.find((c) => c.id === selectedId) : null

  const handlePay = async () => {
    setPayError('')
    setPaySuccess('')
    if (!selected) return
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) {
      setPayError('Mali ang halaga')
      return
    }
    if (amt > selected.balance + 0.001) {
      setPayError('Sobra sa utang')
      return
    }
    try {
      await addUtangPayment(selected.id, amt)
      setPaySuccess(`Nabayaran: ${formatPeso(amt)}`)
      setPayAmount('')
      setTimeout(() => setPaySuccess(''), 2500)
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Hindi nabayaran')
    }
  }

  // detail view
  if (selected) {
    const sortedSales = (sales || []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const sortedPayments = (payments || []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return (
      <div className="p-4 pb-20">
        <button onClick={() => { setSelectedId(null); setPayError(''); setPaySuccess(''); setPayAmount('') }} className="text-sm text-violet-600 font-medium mb-3">
          ← Bumalik sa listahan
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-xs text-amber-700">Si {selected.name}</p>
          <p className="text-2xl font-bold text-amber-700">{formatPeso(selected.balance)}</p>
          <p className="text-xs text-amber-600">Natitirang utang</p>
        </div>

        {payError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-2">{payError}</div>}
        {paySuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-lg mb-2">{paySuccess}</div>}

        <div className="bg-white border border-zinc-200 rounded-xl p-3 mb-4">
          <h3 className="font-semibold text-sm mb-2">Magbayad</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₱</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max={selected.balance}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-zinc-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button onClick={handlePay} disabled={!payAmount || parseFloat(payAmount) <= 0} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:bg-zinc-200 disabled:text-zinc-400">
              Bayad
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Hanggang {formatPeso(selected.balance)} lang Pwede</p>
          <div className="flex gap-2 mt-2">
            {[20, 50, 100].filter(v => v <= selected.balance).map(v => (
              <button key={v} onClick={() => setPayAmount(String(v))} className="text-xs bg-zinc-100 border px-3 py-1 rounded-full">₱{v}</button>
            ))}
            <button onClick={() => setPayAmount(String(selected.balance))} className="text-xs bg-violet-100 border border-violet-200 text-violet-700 px-3 py-1 rounded-full font-medium">Buo</button>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3 mb-3">
          <h3 className="font-semibold text-sm mb-2">Utang na Benta ({sortedSales.length})</h3>
          {sortedSales.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">Walang benta</p>
          ) : (
            <div className="space-y-2">
              {sortedSales.map((s) => (
                <div key={s.id} className="bg-zinc-50 rounded-lg px-3 py-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">{s.createdAt.toLocaleDateString('fil-PH')} {s.createdAt.toLocaleTimeString('fil-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-sm font-bold">{formatPeso(s.totalRevenue)}</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{s.items.map((it) => `${it.name} x${it.qty}`).join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3">
          <h3 className="font-semibold text-sm mb-2">Bayad History ({sortedPayments.length})</h3>
          {sortedPayments.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">Wala pang bayad</p>
          ) : (
            <div className="space-y-2">
              {sortedPayments.map((p) => (
                <div key={p.id} className="flex justify-between bg-emerald-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-zinc-600">{p.createdAt.toLocaleDateString('fil-PH')} {p.createdAt.toLocaleTimeString('fil-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sm font-bold text-emerald-700">-{formatPeso(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Utang</h1>
      <p className="text-zinc-500 text-sm mb-3">Listahan ng may utang</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-xs text-amber-700">Kabuuang Utang</p>
        <p className="text-2xl font-bold text-amber-700">{formatPeso(totalUtang)}</p>
        <p className="text-xs text-amber-600">{customers.length} customer{customers.length !== 1 ? 's' : ''} • I-tap para makita detalye</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Hanapin customer..."
        className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      {filtered.length === 0 ? (
        <div className="bg-zinc-50 border border-dashed rounded-xl p-8 text-center">
          <p className="text-zinc-600 font-medium">{customers.length === 0 ? 'Walang utang' : 'Walang nahanap'}</p>
          <p className="text-zinc-400 text-sm mt-1">{customers.length === 0 ? 'Lahat bayad na! 🎉' : 'Iba ang hanap'}</p>
          {customers.length === 0 && <p className="text-xs text-zinc-400 mt-2">Magbenta gamit "Utang" sa Benta tab</p>}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="text-left bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center hover:border-violet-300"
            >
              <div>
                <p className="font-semibold text-zinc-900">{c.name}</p>
                <p className="text-xs text-zinc-500">Huling update: {c.updatedAt.toLocaleDateString('fil-PH')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-700">{formatPeso(c.balance)}</p>
                <p className="text-xs text-violet-600 font-medium">Tignan →</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
