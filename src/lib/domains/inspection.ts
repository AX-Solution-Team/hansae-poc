/* ------------------------------------------------------------------ */
/*  Inspection (IPQC / AQL) mock-data generator                       */
/*  Deterministic lot data for garment inline inspection.              */
/* ------------------------------------------------------------------ */

export interface InspectionLot {
  lot_no: string
  line: string
  order_no: string
  style: string
  sample_size: number
  major_defects: number
  minor_defects: number
  critical_defects: number
  aql_result: 'PASS' | 'FAIL'
  inspector: string
  inspection_date: string
}

/* ---------- pools ------------------------------------------------- */

const LINES = ['Line A-1', 'Line A-2', 'Line B-1', 'Line B-2', 'Line C-1', 'Line C-2']
const STYLES = [
  'TG-2501 Slim Ankle Pant',
  'TG-2502 Training Jogger',
  'WM-2503 Flat Front Pant',
  'ZR-2504 Wide-Leg Trouser',
  'GP-2505 Modern Khaki',
  'TG-2506 Cargo Short',
  'WM-2507 Relaxed Fit Jean',
  'ZR-2508 Linen Blend Crop',
]

const INSPECTORS = [
  'Nguyen Van Minh',
  'Tran Thi Hoa',
  'Pham Duc Long',
  'Le Thi Mai',
  'Vo Thanh Tung',
  'Bui Ngoc Anh',
]

/* ---------- helpers ----------------------------------------------- */

function seededInt(seed: number, min: number, max: number): number {
  const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
  return Math.floor(min + (x % (max - min + 1)))
}

/**
 * AQL 2.5 Major check (General Inspection Level II).
 * For sample sizes 50-125, Ac=3/Re=4 is typical for AQL 2.5.
 */
function aqlCheck(sampleSize: number, major: number, critical: number): 'PASS' | 'FAIL' {
  // Critical: zero tolerance
  if (critical > 0) return 'FAIL'

  // AQL 2.5 accept number table (simplified for demo)
  let acceptNum: number
  if (sampleSize <= 50) acceptNum = 2
  else if (sampleSize <= 80) acceptNum = 3
  else if (sampleSize <= 125) acceptNum = 5
  else acceptNum = 7

  return major <= acceptNum ? 'PASS' : 'FAIL'
}

/* ---------- public API -------------------------------------------- */

export function getInspectionLots(count: number = 24): InspectionLot[] {
  const results: InspectionLot[] = []

  for (let i = 0; i < count; i++) {
    const seed = i * 7 + 42
    const lineIdx = i % LINES.length
    const styleIdx = i % STYLES.length
    const inspectorIdx = i % INSPECTORS.length
    const orderSeq = String(240100 + Math.floor(i / 3)).padStart(6, '0')
    const lotSeq = String(i + 1).padStart(3, '0')

    const sampleSize = [50, 80, 80, 125, 50, 80][seededInt(seed, 0, 5)]

    // Most lots pass — realistic distribution (~85% pass rate)
    const major = seededInt(seed + 1, 0, 6)
    const minor = seededInt(seed + 2, 0, 10)
    // ~8% chance of a critical defect
    const critical = seededInt(seed + 3, 0, 12) === 0 ? 1 : 0

    const day = ((i % 28) + 1)
    const month = ((i % 3) + 3) // March to May

    results.push({
      lot_no: `LOT-${lotSeq}`,
      line: LINES[lineIdx],
      order_no: `ORD-${orderSeq}`,
      style: STYLES[styleIdx],
      sample_size: sampleSize,
      major_defects: major,
      minor_defects: minor,
      critical_defects: critical,
      aql_result: aqlCheck(sampleSize, major, critical),
      inspector: INSPECTORS[inspectorIdx],
      inspection_date: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    })
  }

  return results
}
