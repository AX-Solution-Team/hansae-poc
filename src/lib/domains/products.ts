/* ------------------------------------------------------------------ */
/*  Product catalog mock-data generator                                */
/*  Deterministic — same brand + count always returns the same rows.   */
/* ------------------------------------------------------------------ */

export interface Product {
  style_no: string
  product_name: string
  category: string
  fabric_composition: string
  color: string
  size_range: string
  fob_price: number
  moq: number
  origin_country: string
  season: string
  trend_score: number
  image_url: string
  created_date: string
}

/* ---------- brand-specific pools ---------------------------------- */

interface BrandPool {
  prefix: string
  names: string[]
  categories: string[]
  fabrics: string[]
  colors: string[]
  priceRange: [number, number]
  moqRange: [number, number]
}

const BRAND_POOLS: Record<string, BrandPool> = {
  ZARA: {
    prefix: 'ZR',
    names: [
      'Fluid Wide-Leg Trouser',
      'Linen Blend Crop Pant',
      'High-Waist Paperbag Short',
      'Oversized Blazer Jacket',
      'Satin Midi Skirt',
      'Relaxed Fit Cargo Pant',
      'Structured Knit Top',
      'Draped Asymmetric Dress',
    ],
    categories: ['Trousers', 'Shorts', 'Outerwear', 'Skirts', 'Tops', 'Dresses', 'Pants', 'Jackets'],
    fabrics: [
      '100% Lyocell',
      '55% Linen 45% Cotton',
      '72% Polyester 28% Viscose',
      '100% Organic Cotton',
      '95% Polyester 5% Elastane',
      '60% Cotton 40% Modal',
      '80% Viscose 20% Polyamide',
      '100% Recycled Polyester',
    ],
    colors: ['Ecru', 'Black', 'Sage Green', 'Dusty Rose', 'Navy', 'Camel', 'Ivory', 'Charcoal'],
    priceRange: [8.5, 22.0],
    moqRange: [3000, 8000],
  },
  TARGET: {
    prefix: 'TG',
    names: [
      'All in Motion Jogger',
      'A New Day Chino Pant',
      'Universal Thread Relaxed Jean',
      'Wild Fable High-Rise Short',
      'Goodfellow Stretch Khaki',
      'Cat & Jack Kids Cargo',
      'Ava & Viv Plus Ponte Pant',
      'Prologue Tailored Trouser',
    ],
    categories: ['Joggers', 'Chinos', 'Jeans', 'Shorts', 'Khakis', 'Kids', 'Plus-Size', 'Workwear'],
    fabrics: [
      '98% Cotton 2% Spandex',
      '60% Cotton 40% Polyester',
      '100% Cotton Twill',
      '78% Polyester 22% Rayon',
      '97% Cotton 3% Elastane',
      '65% Polyester 35% Cotton',
      '88% Nylon 12% Spandex',
      '100% Cotton Denim',
    ],
    colors: ['Khaki', 'Navy', 'Black', 'Olive', 'Medium Wash', 'Dark Rinse', 'Heather Gray', 'Stone'],
    priceRange: [4.5, 12.0],
    moqRange: [5000, 15000],
  },
  WALMART: {
    prefix: 'WM',
    names: [
      'George Classic Flat Front',
      'Time and Tru Legging',
      'Wrangler Relaxed Fit Jean',
      'Athletic Works Track Pant',
      'Terra & Sky Plus Jegging',
      'Wonder Nation Kids Short',
      'No Boundaries Cargo Jogger',
      'Free Assembly Straight Pant',
    ],
    categories: ['Dress Pants', 'Leggings', 'Jeans', 'Track Pants', 'Plus-Size', 'Kids', 'Cargo', 'Casual'],
    fabrics: [
      '100% Polyester',
      '92% Cotton 8% Spandex',
      '100% Cotton Denim 14oz',
      '80% Polyester 20% Cotton',
      '74% Cotton 24% Polyester 2% Spandex',
      '100% Cotton Twill',
      '95% Cotton 5% Spandex',
      '65% Polyester 35% Rayon',
    ],
    colors: ['Black', 'Khaki', 'Dark Wash', 'Charcoal', 'Navy', 'Medium Blue', 'White', 'Army Green'],
    priceRange: [3.2, 8.5],
    moqRange: [10000, 30000],
  },
  GAP: {
    prefix: 'GP',
    names: [
      'Modern Khaki Slim',
      'Vintage Soft Jogger',
      'High Rise Barrel Jean',
      'GapFlex Essential Chino',
      'Lived-In Straight Pant',
      'Athletic Taper Fit',
      'Baby Gap Organic Pant',
      'Teen Original Fit Jean',
    ],
    categories: ['Khakis', 'Joggers', 'Jeans', 'Chinos', 'Casual', 'Athletic', 'Baby', 'Teen'],
    fabrics: [
      '98% Cotton 2% Elastane',
      '60% Cotton 40% Recycled Polyester',
      '100% Cotton Selvedge',
      '97% Cotton 3% Spandex Stretch',
      '70% Cotton 30% Lyocell',
      '85% Cotton 15% Modal',
      '100% Organic Cotton',
      '80% Cotton 20% Polyester',
    ],
    colors: ['True Khaki', 'Washed Black', 'Medium Indigo', 'British Khaki', 'Shadow', 'Coastal Blue', 'Natural', 'Dark Night'],
    priceRange: [6.0, 16.0],
    moqRange: [4000, 12000],
  },
}

/* ---------- deterministic seed helper ----------------------------- */

function seededValue(seed: number, min: number, max: number): number {
  // Simple LCG-style deterministic number
  const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
  return min + (x % (max - min + 1))
}

function seededFloat(seed: number, min: number, max: number, decimals: number = 2): number {
  const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
  const ratio = (x % 10000) / 10000
  return Number((min + ratio * (max - min)).toFixed(decimals))
}

/* ---------- public API -------------------------------------------- */

export function getProducts(brand: string, count: number): Product[] {
  const key = brand.toUpperCase().replace(/\s+/g, '')
  const pool = BRAND_POOLS[key] ?? BRAND_POOLS.TARGET
  const baseCount = pool.names.length // 8

  const results: Product[] = []
  const seasons = ['SS25', 'FW25', 'SS26', 'FW26']
  const sizeRanges = ['XS-XL', 'S-XXL', 'S-XL', '2T-5T', 'XS-3XL', 'S-2XL']
  const countries = ['Vietnam', 'Vietnam', 'Vietnam', 'Indonesia', 'Myanmar', 'Vietnam']

  for (let i = 0; i < count; i++) {
    const baseIdx = i % baseCount
    const variant = Math.floor(i / baseCount) + 1
    const seed = i + brand.length * 1000

    const styleSeq = String(2500 + i).padStart(4, '0')
    const styleNo = `${pool.prefix}-${styleSeq}`

    const name = variant === 1
      ? pool.names[baseIdx]
      : `${pool.names[baseIdx]} V${variant}`

    results.push({
      style_no: styleNo,
      product_name: name,
      category: pool.categories[baseIdx % pool.categories.length],
      fabric_composition: pool.fabrics[baseIdx % pool.fabrics.length],
      color: pool.colors[(baseIdx + variant) % pool.colors.length],
      size_range: sizeRanges[seededValue(seed, 0, sizeRanges.length - 1)],
      fob_price: seededFloat(seed + 1, pool.priceRange[0], pool.priceRange[1]),
      moq: Math.round(seededValue(seed + 2, pool.moqRange[0], pool.moqRange[1]) / 100) * 100,
      origin_country: countries[seededValue(seed + 3, 0, countries.length - 1)],
      season: seasons[seededValue(seed + 4, 0, seasons.length - 1)],
      trend_score: seededFloat(seed + 5, 60, 99, 1),
      image_url: `/images/products/${styleNo.toLowerCase()}.jpg`,
      created_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    })
  }

  return results
}
