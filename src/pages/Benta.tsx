import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Product } from '../db/db'
import { createSale, type CartItem } from '../db/saleService'
import { formatPeso } from '../utils/currency'

export default function Benta() {
  const products = useLiveQuery(() => db.products.filter((p) => !p.isArchived).toArray(), [])
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentType, setPaymentType] = useState<'cash' | 'utang'>('cash')
  const [customerName, setCustomerName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!products) return []
    let list = products as Product[]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, search])

  const total = useMemo(() => cart.reduce((sum, ci) => sum + ci.price * ci.qty, 0), [cart])
  const totalQty = useMemo(() => cart.reduce((sum, ci) => sum + ci.qty, 0), [cart])

  const addToCart = (p: Product) => {
    setError('')
    setSuccess('')
    const existing = cart.find((c) => c.productId === p.id)
    if (existing) {
      if (existing.qty + 1 > p.stock) {
        setError(`Kulang sa stock: ${p.name} (stock: ${p.stock})`)
        return
      }
      setCart(cart.map((c) => (c.productId === p.id ? { ...c, qty: c.qty + 1 } : c)))
    } else {
      if (p.stock < 1) {
        setError(`Wala ng stock: ${p.name}`)
        return
      }
      setCart([...cart, { productId: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1, stock: p.stock }])
    }
  }

  const updateQty = (productId: string, delta: number) => {
    setError('')
    const item = cart.find((c) => c.productId === productId)
    if (!item) return
    const prod = (products as Product[] | undefined)?.find((p) => p.id === productId)
    const newQty = item.qty + delta
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.productId !== productId))
      return
    }
    if (prod && newQty > prod.stock) {
      setError(`Kulang sa stock: ${prod.name} (stock: ${prod.stock})`)
      return
    }
    setCart(cart.map((c) => (c.productId === productId ? { ...c, qty: newQty } : c)))
  }

  const removeItem = (productId: string) => {
    setCart(cart.filter((c) => c.productId !== productId))
  }

  const handleBenta = async () => {
    setError('')
    setSuccess('')
    if (cart.length === 0) {
      setError('Walang laman ang cart')
      return
    }
    if (paymentType === 'utang' && !customerName.trim()) {
      setError('Lagyan ng pangalan ng customer para sa utang')
      return
    }
    setSaving(true)
    try {
      await createSale(cart, paymentType, customerName.trim() || undefined)
      setSuccess(paymentType === 'utang' ? `Na-utang kay ${customerName.trim()}: ${formatPeso(total)}` : `Benta na-save: ${formatPeso(total)}`)
      setCart([])
      setCustomerName('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hindi na-save ang benta')
    } finally {
      setSaving(false)
    }
  }

  if (products === undefined) return <div className="p-4 text-center text-zinc-500">Loading...</div>

  return (
    <div className="p-4 pb-32">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Benta</h1>
      <p className="text-zinc-500 text-sm mb-3">Pindutin ang produkto para idagdag sa cart</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-lg mb-3">{success}</div>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Hanapin paninda..."
        className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      {/* product grid */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-50 border border-dashed rounded-xl p-8 text-center">
          <p className="text-zinc-500">Walang paninda</p>
          <p className="text-zinc-400 text-sm">Magdagdag muna sa Paninda tab</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {filtered.map((p) => {
            const inCart = cart.find((c) => c.productId === p.id)?.qty || 0
            const low = p.stock <= p.lowStockThreshold
            const outOfStock = p.stock === 0
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className={`text-left bg-white border rounded-xl p-3 flex flex-col gap-1 relative hover:border-violet-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${low ? 'border-amber-200 bg-amber-50/30' : 'border-zinc-200'}`}
              >
                {inCart > 0 && <span className="absolute -top-2 -right-2 bg-violet-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{inCart}</span>}
                <span className="font-medium text-sm text-zinc-900 truncate pr-1">{p.name}</span>
                <span className="text-xs text-zinc-500">{p.category}</span>
                <span className="text-sm font-bold text-zinc-900">{formatPeso(p.price)}</span>
                <span className={`text-[11px] ${outOfStock ? 'text-red-600' : low ? 'text-amber-600' : 'text-zinc-400'}`}>
                  Stock: {p.stock} {low && !outOfStock ? '• Paubos' : ''} {outOfStock ? '• Ubos' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* cart */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3">
        <h3 className="font-semibold text-sm mb-2">Cart ({totalQty} items)</h3>
        {cart.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Walang laman ang cart — pindutin ang produkto sa taas</p>
        ) : (
          <div className="space-y-2">
            {cart.map((ci) => (
              <div key={ci.productId} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ci.name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatPeso(ci.price)} × {ci.qty} = {formatPeso(ci.price * ci.qty)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => updateQty(ci.productId, -1)} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-sm font-bold">
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{ci.qty}</span>
                  <button
                    onClick={() => updateQty(ci.productId, 1)}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-sm font-bold disabled:opacity-30"
                    disabled={(products as Product[]).find((p) => p.id === ci.productId)?.stock !== undefined && ci.qty >= ((products as Product[]).find((p) => p.id === ci.productId)?.stock || 0)}
                  >
                    +
                  </button>
                  <button onClick={() => removeItem(ci.productId)} className="ml-1 text-xs text-red-600 px-2">
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* payment toggle */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setPaymentType('cash')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border ${paymentType === 'cash' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-zinc-600 border-zinc-300'}`}
          >
            Cash
          </button>
          <button
            onClick={() => setPaymentType('utang')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border ${paymentType === 'utang' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-zinc-600 border-zinc-300'}`}
          >
            Utang
          </button>
        </div>

        {paymentType === 'utang' && (
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Pangalan ng customer (e.g. Aling Nena)"
            className="w-full mt-2 border border-amber-300 bg-amber-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            maxLength={30}
          />
        )}

        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-zinc-600">Kabuuang bayad:</span>
          <span className="text-xl font-bold text-zinc-900">{formatPeso(total)}</span>
        </div>
      </div>

      {/* sticky benta button */}
      <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-zinc-200 p-3 max-w-[480px] mx-auto">
        <button
          onClick={handleBenta}
          disabled={cart.length === 0 || saving}
          className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold text-base disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
        >
          {saving ? 'Saving...' : cart.length === 0 ? 'Benta ₱0.00' : `Benta ${formatPeso(total)} ${paymentType === 'utang' ? '• Utang' : '• Cash'}`}
        </button>
        {paymentType === 'utang' && cart.length > 0 && <p className="text-[11px] text-center text-amber-600 mt-1">Maidagdag sa listahan ni {customerName || '(lagyan ng pangalan)'}</p>}
      </div>
    </div>
  )
}
