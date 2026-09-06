import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Product } from '../db/db'
import { addProduct, archiveProduct, updateProduct, isLowStock, CATEGORIES } from '../db/productService'
import ProductCard from '../components/ProductCard'
import ProductFormModal from '../components/ProductFormModal'

export default function Paninda() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const products = useLiveQuery(() => db.products.filter((p) => !p.isArchived).toArray(), [])

  const filtered = useMemo(() => {
    if (!products) return []
    let list = products as Product[]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'All') {
      list = list.filter((p) => p.category === categoryFilter)
    }
    if (showLowOnly) {
      list = list.filter((p) => isLowStock(p))
    }
    // sort: low stock first, then by name
    return [...list].sort((a, b) => {
      const aLow = isLowStock(a) ? 0 : 1
      const bLow = isLowStock(b) ? 0 : 1
      if (aLow !== bLow) return aLow - bLow
      return a.name.localeCompare(b.name)
    })
  }, [products, search, categoryFilter, showLowOnly])

  const lowCount = useMemo(() => {
    if (!products) return 0
    return (products as Product[]).filter((p) => isLowStock(p)).length
  }, [products])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleAdd = async (data: Omit<Product, 'id' | 'isArchived' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addProduct(data)
      showToast('Naidagdag ang produkto!')
    } catch (e) {
      throw e
    }
  }

  const handleUpdate = async (data: Omit<Product, 'id' | 'isArchived' | 'createdAt' | 'updatedAt'>) => {
    if (!editing) return
    try {
      await updateProduct(editing.id, data)
      showToast('Na-update ang produkto!')
      setEditing(null)
    } catch (e) {
      throw e
    }
  }

  const handleArchive = async (p: Product) => {
    const ok = window.confirm(`I-delete si "${p.name}"? Hindi na makikita sa POS pero mananatili sa history.`)
    if (!ok) return
    try {
      await archiveProduct(p.id)
      showToast('Na-delete ang produkto')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error sa pag-delete')
    }
  }

  const handleEdit = (p: Product) => {
    setEditing(p)
    setShowModal(true)
  }

  const handleAddSample = async () => {
    const samples = [
      { name: 'Coke Mismo', category: 'Softdrinks', price: 15, cost: 12, stock: 24, lowStockThreshold: 5 },
      { name: 'Pancit Canton', category: 'Noodles', price: 14, cost: 10, stock: 30, lowStockThreshold: 5 },
      { name: 'Kopiko Brown', category: 'Coffee', price: 10, cost: 7, stock: 50, lowStockThreshold: 10 },
    ]
    try {
      for (const s of samples) {
        await addProduct(s as Omit<Product, 'id' | 'isArchived' | 'createdAt' | 'updatedAt'>)
      }
      showToast('Naidagdag ang 3 sample products!')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error sa samples')
    }
  }

  if (products === undefined) {
    return <div className="p-4 text-center text-zinc-500">Loading...</div>
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold text-zinc-900">Paninda</h1>
        <button
          onClick={() => {
            setEditing(null)
            setShowModal(true)
          }}
          className="bg-violet-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow"
        >
          + Dagdag
        </button>
      </div>

      {lowCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 flex justify-between items-center">
          <span className="text-sm font-medium text-red-700">⚠️ {lowCount} items paubos na!</span>
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`text-xs px-3 py-1 rounded-full font-medium ${showLowOnly ? 'bg-red-500 text-white' : 'bg-white border text-red-600'}`}
          >
            {showLowOnly ? 'Lahat' : 'Tignan'}
          </button>
        </div>
      )}

      {/* search + filters */}
      <div className="space-y-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hanapin produkto..."
          className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border font-medium ${categoryFilter === 'All' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-zinc-600 border-zinc-300'}`}
          >
            Lahat
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border font-medium ${categoryFilter === c ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-zinc-600 border-zinc-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} className="rounded" />
          <span className="text-zinc-700">Paubos lang</span>
        </label>
      </div>

      {/* content */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-50 border border-dashed rounded-xl p-8 text-center">
          {products.length === 0 ? (
            <>
              <p className="text-zinc-600 font-medium">Wala pang paninda</p>
              <p className="text-zinc-400 text-sm mt-1">Magdagdag ng unang produkto</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setEditing(null)
                    setShowModal(true)
                  }}
                  className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold"
                >
                  + Magdagdag ng Produkto
                </button>
                <button onClick={handleAddSample} className="w-full bg-white border border-zinc-300 py-3 rounded-xl font-medium text-sm">
                  Magdagdag ng 3 sample products
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-zinc-600">Walang nahanap</p>
              <p className="text-zinc-400 text-sm mt-1">Iba ang search o filter</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-xs text-zinc-500">{filtered.length} produkto</p>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={handleEdit} onArchive={handleArchive} />
          ))}
        </div>
      )}

      {/* modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditing(null)
        }}
        onSubmit={editing ? handleUpdate : handleAdd}
        initial={editing}
        title={editing ? 'Edit Produkto' : 'Dagdag Paninda'}
      />

      {/* toast */}
      {toast && (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
