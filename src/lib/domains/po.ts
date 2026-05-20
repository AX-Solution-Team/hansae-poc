/* ------------------------------------------------------------------ */
/*  PO (Purchase Order) mock-data generator                            */
/*  36 line items per buyer, deterministic output.                     */
/* ------------------------------------------------------------------ */

export interface PoLineItem {
  po_number: string
  style_no: string
  description: string
  color: string
  size_s: number
  size_m: number
  size_l: number
  size_xl: number
  unit_price: number
  total_qty: number
  total_amount: number
  delivery_date: string
  factory: string
  status: string
}

/* ---------- buyer-specific pools ---------------------------------- */

interface BuyerPool {
  poPrefix: string
  stylePrefix: string
  descriptions: string[]
  colors: string[]
  priceRange: [number, number]
  factories: string[]
}

const BUYER_POOLS: Record<string, BuyerPool> = {
  TARGET: {
    poPrefix: 'TGT',
    stylePrefix: 'TG',
    descriptions: [
      'A New Day Slim Ankle Pant',
      'All in Motion Training Jogger',
      'Universal Thread High Rise Skinny',
      'Wild Fable Cargo Short',
      'Goodfellow Athletic Fit Chino',
      'Cat & Jack Boys Cargo Pant',
      'Ava & Viv Ponte Straight',
      'Prologue Pleated Trouser',
      'A New Day Wide Leg Crop',
    ],
    colors: ['Black', 'Navy', 'Khaki', 'Olive', 'Dark Wash', 'Heather Gray', 'Stone', 'Charcoal', 'Burgundy'],
    priceRange: [5.8, 14.5],
    factories: ['Hansae Vietnam (C.P.)', 'Hansae Vietnam (HAIVINA)', 'Hansae Indonesia', 'C&T Vina'],
  },
  ZARA: {
    poPrefix: 'ZRA',
    stylePrefix: 'ZR',
    descriptions: [
      'Fluid Wide-Leg Trouser',
      'High-Waist Paperbag Short',
      'Linen Blend Crop Pant',
      'Oversized Blazer Pant',
      'Satin Midi Skirt Pant',
      'Draped Culottes',
      'Structured Knit Jogger',
      'Relaxed Fit Cargo',
      'Asymmetric Wrap Pant',
    ],
    colors: ['Ecru', 'Black', 'Sage Green', 'Dusty Rose', 'Navy', 'Camel', 'Ivory', 'Charcoal', 'Terracotta'],
    priceRange: [9.2, 24.0],
    factories: ['Hansae Vietnam (C.P.)', 'Hansae Vietnam (HAIVINA)', 'Hansae Myanmar'],
  },
  WALMART: {
    poPrefix: 'WMT',
    stylePrefix: 'WM',
    descriptions: [
      'George Classic Flat Front',
      'Time and Tru Pull-On Jegging',
      'Wrangler Relaxed Fit Jean',
      'Athletic Works Track Pant',
      'Wonder Nation Kids Short',
      'No Boundaries Cargo Jogger',
      'Free Assembly Wide Leg',
      'George Stretch Dress Pant',
      'Time and Tru Bootcut',
    ],
    colors: ['Black', 'Khaki', 'Dark Wash', 'Medium Blue', 'Navy', 'Army Green', 'Charcoal', 'White', 'Stone'],
    priceRange: [3.5, 9.0],
    factories: ['Hansae Vietnam (C.P.)', 'C&T Vina', 'Hansae Indonesia', 'Hansae Vietnam (HAIVINA)'],
  },
  GAP: {
    poPrefix: 'GAP',
    stylePrefix: 'GP',
    descriptions: [
      'Modern Khaki Slim Pant',
      'Vintage Soft Jogger',
      'High Rise Barrel Jean',
      'GapFlex Essential Chino',
      'Lived-In Straight Pant',
      'Athletic Taper Fit Pant',
      'Original Fit Jean',
      'Straight Stretch Khaki',
      'Relaxed Cargo Pant',
    ],
    colors: ['True Khaki', 'Washed Black', 'Medium Indigo', 'British Khaki', 'Shadow', 'Coastal Blue', 'Natural', 'Dark Night', 'Olive'],
    priceRange: [6.5, 17.0],
    factories: ['Hansae Vietnam (C.P.)', 'Hansae Vietnam (HAIVINA)', 'Hansae Indonesia'],
  },
}

/* ---------- helpers ----------------------------------------------- */

function seededInt(seed: number, min: number, max: number): number {
  const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
  return Math.floor(min + (x % (max - min + 1)))
}

function seededFloat(seed: number, min: number, max: number): number {
  const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
  const ratio = (x % 10000) / 10000
  return Number((min + ratio * (max - min)).toFixed(2))
}

/* ---------- public API -------------------------------------------- */

export function getPoOrders(buyer: string): PoLineItem[] {
  const key = buyer.toUpperCase().replace(/\s+/g, '')
  const pool = BUYER_POOLS[key] ?? BUYER_POOLS.TARGET
  const TOTAL_LINES = 36
  const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'IN_PRODUCTION', 'IN_PRODUCTION', 'PENDING', 'SHIPPED']
  const results: PoLineItem[] = []

  for (let i = 0; i < TOTAL_LINES; i++) {
    const seed = i + key.length * 100
    const descIdx = i % pool.descriptions.length
    const colorIdx = (i + 2) % pool.colors.length
    const poSeq = String(240100 + Math.floor(i / 4)).padStart(6, '0')
    const styleSeq = String(2500 + i).padStart(4, '0')

    const sizeS = seededInt(seed, 200, 800)
    const sizeM = seededInt(seed + 1, 400, 1200)
    const sizeL = seededInt(seed + 2, 400, 1000)
    const sizeXL = seededInt(seed + 3, 150, 600)
    const totalQty = sizeS + sizeM + sizeL + sizeXL
    const unitPrice = seededFloat(seed + 4, pool.priceRange[0], pool.priceRange[1])

    const month = ((i % 6) + 4) // April to September 2025
    const day = seededInt(seed + 6, 1, 28)

    results.push({
      po_number: `${pool.poPrefix}-${poSeq}`,
      style_no: `${pool.stylePrefix}-${styleSeq}`,
      description: pool.descriptions[descIdx],
      color: pool.colors[colorIdx],
      size_s: sizeS,
      size_m: sizeM,
      size_l: sizeL,
      size_xl: sizeXL,
      unit_price: unitPrice,
      total_qty: totalQty,
      total_amount: Number((totalQty * unitPrice).toFixed(2)),
      delivery_date: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      factory: pool.factories[i % pool.factories.length],
      status: statuses[seededInt(seed + 7, 0, statuses.length - 1)],
    })
  }

  return results
}

/**
 * Extract buyer name from params or default to "Target".
 */
export function resolveBuyer(params: Record<string, unknown>): string {
  if (params.buyer && typeof params.buyer === 'string') return params.buyer
  if (params.brand && typeof params.brand === 'string') return params.brand
  if (params.message && typeof params.message === 'string') {
    const msg = (params.message as string).toLowerCase()
    if (msg.includes('zara') || msg.includes('자라')) return 'ZARA'
    if (msg.includes('walmart') || msg.includes('월마트')) return 'Walmart'
    if (msg.includes('gap') || msg.includes('갭')) return 'Gap'
    if (msg.includes('target') || msg.includes('타겟')) return 'Target'
  }
  return 'Target'
}
