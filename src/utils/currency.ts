/**
 * Format number as Philippine Peso with 2 decimals
 * formatPeso(150) => "₱150.00"
 * formatPeso(150.5) => "₱150.50"
 */
export function formatPeso(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₱0.00'
  }
  return `₱${amount.toFixed(2)}`
}

/**
 * Parse peso string back to number (handles commas, ₱ sign)
 */
export function parsePeso(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[₱, ]/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Calculate tubo (profit) per item: price - cost
 */
export function calcTubo(price: number, cost: number): number {
  const p = typeof price === 'number' && !isNaN(price) ? price : 0
  const c = typeof cost === 'number' && !isNaN(cost) ? cost : 0
  return Math.round((p - c) * 100) / 100
}
