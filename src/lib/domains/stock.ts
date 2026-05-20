/* ------------------------------------------------------------------ */
/*  Stock price mock-data generator — KRX 105630 (한세실업)              */
/*  Deterministic daily OHLCV series.                                  */
/* ------------------------------------------------------------------ */

export interface StockDay {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change_pct: number
}

/* ---------- helpers ----------------------------------------------- */

function seededFloat(seed: number, min: number, max: number): number {
  const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
  const ratio = (x % 10000) / 10000
  return min + ratio * (max - min)
}

/**
 * Returns `days` trading days of stock data for 한세실업 (105630).
 * Base price ~22,000 KRW, with realistic daily fluctuation.
 */
export function getHansaeStockSeries(days: number = 30): StockDay[] {
  const results: StockDay[] = []
  const basePrice = 22000
  let prevClose = basePrice

  // Start from a deterministic date
  const startDate = new Date('2025-04-01')
  let tradingDay = 0
  let calendarDay = 0

  while (tradingDay < days) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + calendarDay)
    calendarDay++

    // Skip weekends
    const dow = currentDate.getDay()
    if (dow === 0 || dow === 6) continue

    const seed = tradingDay * 13 + 7

    // Daily change: -3% to +3%, with slight upward bias
    const changePct = seededFloat(seed, -3.0, 3.2)
    const changeRatio = 1 + changePct / 100

    const open = Math.round(prevClose * (1 + seededFloat(seed + 1, -0.5, 0.5) / 100))
    const close = Math.round(prevClose * changeRatio)

    // High is above max(open, close), low is below min(open, close)
    const baseHigh = Math.max(open, close)
    const baseLow = Math.min(open, close)
    const high = Math.round(baseHigh * (1 + seededFloat(seed + 2, 0, 1.2) / 100))
    const low = Math.round(baseLow * (1 - seededFloat(seed + 3, 0, 1.2) / 100))

    // Volume: 100k~500k shares
    const volume = Math.round(seededFloat(seed + 4, 100000, 500000) / 100) * 100

    const dateStr = currentDate.toISOString().slice(0, 10)

    results.push({
      date: dateStr,
      open,
      high,
      low,
      close,
      volume,
      change_pct: Number(changePct.toFixed(2)),
    })

    prevClose = close
    tradingDay++
  }

  return results
}
