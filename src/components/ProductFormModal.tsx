import { useEffect, useState } from 'react'
import { CATEGORIES } from '../db/productService'
import type { Product } from '../db/db'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Product, 'id' | 'isArchived' | 'createdAt' | 'updatedAt'>) => Promise<void>
  initial?: Product | null
  title?: string
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initial, title }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Other')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setName(initial.name)
        setCategory(initial.category)
        setPrice(String(initial.price))
        setCost(String(initial.cost))
        setStock(String(initial.stock))
        setThreshold(String(initial.lowStockThreshold))
      } else {
        setName('')
        setCategory('Other')
        setPrice('')
        setCost('')
        setStock('')
        setThreshold('5')
      }
      setError('')
      setSaving(false)
    }
  }, [isOpen, initial])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Lagyan ng pangalan ang produkto')
      return
    }
    if (name.trim().length > 50) {
      setError('Masyadong mahaba (max 50)')
      return
    }
    const pPrice = parseFloat(price)
    const pCost = parseFloat(cost || '0')
    const pStock = parseInt(stock, 10)
    const pThresh = parseInt(threshold || '5', 10)

    if (isNaN(pPrice) || pPrice < 0) {
      setError('Mali ang presyo')
      return
    }
    if (isNaN(pCost) || pCost < 0) {
      setError('Mali ang puhunan')
      return
    }
    if (isNaN(pStock) || pStock < 0 || !Number.isInteger(pStock)) {
      setError('Stock ay dapat buong numero')
      return
    }
    if (isNaN(pThresh) || pThresh < 0 || !Number.isInteger(pThresh)) {
      setError('Threshold ay dapat buong numero')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        category,
        price: pPrice,
        cost: pCost,
        stock: pStock,
        lowStockThreshold: pThresh,
      } as Omit<Product, 'id' | 'isArchived' | 'createdAt' | 'updatedAt'>)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hindi na-save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-auto p-5"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-zinc-900">{title || (initial ? 'Edit Produkto' : 'Dagdag Paninda')}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600">Pangalan *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coke Mismo"
              maxLength={50}
              className="w-full mt-1 border border-zinc-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <p className="text-[11px] text-zinc-400 mt-1">{name.length}/50</p>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 border border-zinc-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600">Presyo (benta) *</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₱</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="15.00"
                  className="w-full border border-zinc-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Puhunan (cost)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₱</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="12.00"
                  className="w-full border border-zinc-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Tubo: ₱{((parseFloat(price) || 0) - (parseFloat(cost) || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600">Stock *</label>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="24"
                className="w-full mt-1 border border-zinc-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Paubos threshold</label>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="5"
                className="w-full mt-1 border border-zinc-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Alert kapag ≤ {threshold || 5}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : initial ? 'I-save' : 'Idagdag'}
          </button>
          <button type="button" onClick={onClose} className="w-full bg-zinc-100 text-zinc-700 py-3 rounded-xl font-medium">
            Kansela
          </button>
        </div>
      </form>
    </div>
  )
}
