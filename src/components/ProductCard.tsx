import type { Product } from '../db/db'
import { calcTubo, isLowStock } from '../db/productService'
import { formatPeso } from '../utils/currency'

interface Props {
  product: Product
  onEdit: (p: Product) => void
  onArchive: (p: Product) => void
}

export default function ProductCard({ product, onEdit, onArchive }: Props) {
  const low = isLowStock(product)
  const tubo = calcTubo(product)

  return (
    <div
      className={`bg-white border rounded-xl p-3 flex flex-col gap-2 relative ${
        low ? 'border-red-300 bg-red-50/50' : 'border-zinc-200'
      }`}
    >
      {low && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          Paubos na!
        </span>
      )}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-sm truncate pr-2">{product.name}</h3>
          <p className="text-xs text-zinc-500">{product.category}</p>
        </div>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${
            product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          Stock: {product.stock}
        </span>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm font-bold text-zinc-900">{formatPeso(product.price)}</p>
          <p className="text-xs text-zinc-500">
            Puhunan: {formatPeso(product.cost)} •{' '}
            <span className={tubo > 0 ? 'text-emerald-600 font-medium' : 'text-zinc-400'}>
              Tubo: {formatPeso(tubo)}
            </span>
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(product)}
            className="text-xs bg-white border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-50 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onArchive(product)}
            className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* stock bar */}
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${low ? 'bg-red-500' : 'bg-violet-500'}`}
          style={{ width: `${Math.min(100, Math.max(5, (product.stock / Math.max(20, product.lowStockThreshold * 4)) * 100))}%` }}
        />
      </div>
      <p className="text-[11px] text-zinc-400">Threshold: {product.lowStockThreshold} • Paubos kapag ≤ {product.lowStockThreshold}</p>
    </div>
  )
}
