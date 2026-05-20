/* ------------------------------------------------------------------ */
/*  Linesheet mock-data generator                                      */
/*  Deterministic style catalog for buyer presentations.               */
/* ------------------------------------------------------------------ */

export interface LinesheetRow {
  style_no: string
  description: string
  fabric: string
  color_options: string
  size_range: string
  wholesale_price: number
  msrp: number
  moq: number
  lead_time: string
  season: string
}

/* ---------- pools ------------------------------------------------- */

const DESCRIPTIONS = [
  'Classic Straight Leg Trouser',
  'Slim Fit Stretch Chino',
  'Relaxed Cargo Jogger',
  'High-Waist Wide Leg Pant',
  'Tapered Athletic Fit Pant',
  'Pull-On Ponte Skinny',
  'Utility Crop Pant',
  'Linen Blend Palazzo',
  'Slim Ankle Dress Pant',
  'Woven Pleat Front Trouser',
  'Performance Golf Pant',
  'Comfort Stretch Jegging',
  'Cargo Pocket Short',
  'Bermuda Walking Short',
  'Paperbag Waist Pant',
  'Bootcut Classic Pant',
  'Drawstring Linen Short',
  'Ponte Kick Flare Trouser',
  'Tech Stretch Travel Pant',
  'Relaxed Straight Jean',
  'Balloon Leg Trouser',
  'Cropped Culotte Pant',
  'Slim Fit Dress Chino',
  'Active Knit Jogger',
  'Belted Paperbag Short',
  'Flared Leg Trouser',
  'French Terry Sweatpant',
  'Tailored Cigarette Pant',
]

const FABRICS = [
  '98% Cotton 2% Elastane Twill',
  '100% Organic Cotton Canvas',
  '65% Polyester 35% Cotton Poplin',
  '55% Linen 45% Rayon',
  '92% Nylon 8% Spandex Woven',
  '80% Cotton 20% Recycled Polyester',
  '72% Polyester 24% Rayon 4% Spandex',
  '100% Lyocell Twill',
  '97% Cotton 3% Spandex Denim',
  '60% Cotton 40% Modal Jersey',
  '88% Polyester 12% Elastane Ponte',
  'French Terry 80% Cotton 20% Polyester',
]

const COLOR_OPTIONS_POOL = [
  'Black, Navy, Khaki',
  'Black, Charcoal, Olive, Stone',
  'Dark Wash, Medium Wash, Light Wash',
  'Black, White, Heather Gray',
  'Navy, Burgundy, Forest Green',
  'Ecru, Sage, Dusty Rose',
  'Black, Navy, Khaki, Olive',
  'Charcoal, Camel, Ivory',
]

const SEASONS = ['SS25', 'SS25', 'FW25', 'FW25', 'SS26']
const LEAD_TIMES = ['90 days', '120 days', '75 days', '100 days', '60 days']
const SIZE_RANGES = ['XS-XL', 'S-XXL', 'S-XL', '0-14', '2-18', 'XS-3XL']

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

export function getLinesheetRows(count: number = 28): LinesheetRow[] {
  const results: LinesheetRow[] = []

  for (let i = 0; i < count; i++) {
    const seed = i * 11 + 23
    const styleSeq = String(5001 + i).padStart(4, '0')

    const wholesalePrice = seededFloat(seed, 12.0, 35.0)
    const msrpMultiplier = seededFloat(seed + 1, 2.2, 3.5)
    const msrp = Number((wholesalePrice * msrpMultiplier).toFixed(2))
    const moq = Math.round(seededInt(seed + 2, 1000, 8000) / 500) * 500

    results.push({
      style_no: `HS-${styleSeq}`,
      description: DESCRIPTIONS[i % DESCRIPTIONS.length],
      fabric: FABRICS[seededInt(seed + 3, 0, FABRICS.length - 1)],
      color_options: COLOR_OPTIONS_POOL[seededInt(seed + 4, 0, COLOR_OPTIONS_POOL.length - 1)],
      size_range: SIZE_RANGES[seededInt(seed + 5, 0, SIZE_RANGES.length - 1)],
      wholesale_price: wholesalePrice,
      msrp,
      moq,
      lead_time: LEAD_TIMES[seededInt(seed + 6, 0, LEAD_TIMES.length - 1)],
      season: SEASONS[seededInt(seed + 7, 0, SEASONS.length - 1)],
    })
  }

  return results
}
