/* ------------------------------------------------------------------ */
/*  Executor registry                                                  */
/*  Each executor: runs steps with delays, produces Excel/files.       */
/* ------------------------------------------------------------------ */

import * as XLSX from 'xlsx'
import { getProducts } from '@/lib/domains/products'
import { getPoOrders, resolveBuyer as resolveBuyerFromParams } from '@/lib/domains/po'
import { getInspectionLots } from '@/lib/domains/inspection'
import { getHansaeStockSeries } from '@/lib/domains/stock'
import { getLinesheetRows } from '@/lib/domains/linesheet'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ExecutorContext = {
  agent: {
    id: string
    slug: string
    name: string
    executorKey: string | null
    buildTier: string
    workflowJson: string | null
  }
  params: Record<string, unknown>
  jobId: string
  onStep: (seq: number, label: string, status: string) => Promise<void>
}

export type ExecutorResult = {
  summaryMessage: string
  files: {
    fileName: string
    buffer: Buffer
    mimeType: string
    previewRows?: Record<string, unknown>[]
  }[]
}

export type ExecutorFn = (ctx: ExecutorContext) => Promise<ExecutorResult>

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function delay(min: number = 450, max: number = 700): Promise<void> {
  const ms = min + Math.floor(Math.random() * (max - min))
  return new Promise((r) => setTimeout(r, ms))
}

function toXlsxBuffer(sheetName: string, rows: Record<string, unknown>[]): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(buf)
}

/* ------------------------------------------------------------------ */
/*  Executors                                                          */
/* ------------------------------------------------------------------ */

const designCrawlBrand: ExecutorFn = async (ctx) => {
  const brand =
    (ctx.params.buyer as string) ||
    (ctx.params.brand as string) ||
    'Target'

  await ctx.onStep(1, '바이어 사이트 크롤링', 'RUNNING')
  await delay()
  await ctx.onStep(1, '바이어 사이트 크롤링', 'DONE')

  await ctx.onStep(2, '제품 속성 정제', 'RUNNING')
  await delay()
  await ctx.onStep(2, '제품 속성 정제', 'DONE')

  await ctx.onStep(3, '주간 트렌드 집계', 'RUNNING')
  await delay()
  await ctx.onStep(3, '주간 트렌드 집계', 'DONE')

  await ctx.onStep(4, '엑셀 생성', 'RUNNING')
  const products = getProducts(brand, 32)
  const buffer = toXlsxBuffer('Trend_Products', products as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, '엑셀 생성', 'DONE')

  return {
    summaryMessage: `${brand} 트렌드 크롤링 완료 — ${products.length}개 제품 수집, 엑셀 파일 생성됨`,
    files: [
      {
        fileName: `${brand.toLowerCase()}_trend_products.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: products.slice(0, 5) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const designAlvanonMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, 'Alvanon 체형 데이터 로드', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'Alvanon 체형 데이터 로드', 'DONE')

  await ctx.onStep(2, '6사이즈 핏 분석', 'RUNNING')
  await delay()
  const fitData = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size, i) => ({
    size,
    chest_cm: 82 + i * 4,
    waist_cm: 64 + i * 4,
    hip_cm: 88 + i * 4,
    inseam_cm: 76 + Math.floor(i / 2),
    rise_cm: 24 + Math.floor(i * 0.8),
    fit_score: Number((95 - i * 1.5 + Math.sin(i) * 2).toFixed(1)),
    grade_rule_delta: `+${i * 4}cm`,
    avatar_id: `ALV-${String(1001 + i)}`,
  }))
  await ctx.onStep(2, '6사이즈 핏 분석', 'DONE')

  await ctx.onStep(3, '핏 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('Fit_Analysis', fitData as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(3, '핏 리포트 생성', 'DONE')

  return {
    summaryMessage: `Alvanon 핏 분석 완료 — 6사이즈 (XS~XXL) 체형 매칭 리포트 생성`,
    files: [
      {
        fileName: 'alvanon_fit_analysis.xlsx',
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: fitData.slice(0, 3) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const designLinesheet: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '스타일 카탈로그 조회', 'RUNNING')
  await delay()
  await ctx.onStep(1, '스타일 카탈로그 조회', 'DONE')

  await ctx.onStep(2, '라인시트 포맷 생성', 'RUNNING')
  const rows = getLinesheetRows(28)
  await delay()
  await ctx.onStep(2, '라인시트 포맷 생성', 'DONE')

  await ctx.onStep(3, '엑셀 출력', 'RUNNING')
  const buffer = toXlsxBuffer('Linesheet', rows as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(3, '엑셀 출력', 'DONE')

  return {
    summaryMessage: `라인시트 생성 완료 — ${rows.length}개 스타일, 가격/MOQ/리드타임 포함`,
    files: [
      {
        fileName: 'hansae_linesheet_ss25.xlsx',
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: rows.slice(0, 5) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const poOrderRecap: ExecutorFn = async (ctx) => {
  const buyer = resolveBuyerFromParams(ctx.params)

  await ctx.onStep(1, '바이어 PO PDF 수신', 'RUNNING')
  await delay()
  await ctx.onStep(1, '바이어 PO PDF 수신', 'DONE')

  await ctx.onStep(2, '라인별 추출', 'RUNNING')
  const lines = getPoOrders(buyer)
  await delay()
  await ctx.onStep(2, '라인별 추출', 'DONE')

  await ctx.onStep(3, '오더리캡 집계', 'RUNNING')
  await delay()
  const totalQty = lines.reduce((sum, l) => sum + l.total_qty, 0)
  const totalAmount = lines.reduce((sum, l) => sum + l.total_amount, 0)
  const summaryRows = [
    {
      buyer,
      total_po_lines: lines.length,
      total_qty: totalQty,
      total_amount: Number(totalAmount.toFixed(2)),
      avg_unit_price: Number((totalAmount / totalQty).toFixed(2)),
      factories: Array.from(new Set(lines.map((l) => l.factory))).join(', '),
    },
  ]
  await ctx.onStep(3, '오더리캡 집계', 'DONE')

  await ctx.onStep(4, 'Excel 생성', 'RUNNING')
  const wb = XLSX.utils.book_new()
  const wsLines = XLSX.utils.json_to_sheet(lines as unknown as Record<string, unknown>[])
  XLSX.utils.book_append_sheet(wb, wsLines, 'PO_Lines')
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows as unknown as Record<string, unknown>[])
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const buffer = Buffer.from(buf)
  await delay()
  await ctx.onStep(4, 'Excel 생성', 'DONE')

  return {
    summaryMessage: `${buyer} PO 오더리캡 완료 — ${lines.length}건, 총 ${totalQty.toLocaleString()}pcs, $${totalAmount.toLocaleString()}`,
    files: [
      {
        fileName: `${buyer.toLowerCase()}_order_recap.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: lines.slice(0, 5) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const poPocn: ExecutorFn = async (ctx) => {
  const buyer = resolveBuyerFromParams(ctx.params)

  await ctx.onStep(1, 'POCN 문서 파싱', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'POCN 문서 파싱', 'DONE')

  await ctx.onStep(2, 'POCN 라인 비교', 'RUNNING')
  await delay()
  const pocnLines = Array.from({ length: 24 }, (_, i) => {
    const seed = i * 17 + 5
    const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
    const changeType = i % 5 === 0 ? 'QTY_INCREASE' : i % 7 === 0 ? 'QTY_DECREASE' : i % 3 === 0 ? 'COLOR_CHANGE' : 'DELIVERY_CHANGE'
    const decision = i % 8 === 0 ? 'PARTIAL' : 'ACCEPT'

    return {
      pocn_no: `POCN-${String(2025001 + i)}`,
      po_number: `${buyer.substring(0, 3).toUpperCase()}-${String(240100 + Math.floor(i / 2)).padStart(6, '0')}`,
      style_no: `${buyer.substring(0, 2).toUpperCase()}-${String(2500 + i).padStart(4, '0')}`,
      change_type: changeType,
      original_value: changeType === 'QTY_INCREASE' || changeType === 'QTY_DECREASE'
        ? String(Math.round((x % 3000) + 1000))
        : changeType === 'COLOR_CHANGE' ? 'Navy' : '2025-06-15',
      new_value: changeType === 'QTY_INCREASE'
        ? String(Math.round((x % 3000) + 2000))
        : changeType === 'QTY_DECREASE'
          ? String(Math.round((x % 1000) + 500))
          : changeType === 'COLOR_CHANGE' ? 'Charcoal' : '2025-07-01',
      decision,
      remark: decision === 'PARTIAL' ? '일부 수량만 수용 가능 (자재 확보 이슈)' : '',
    }
  })
  await ctx.onStep(2, 'POCN 라인 비교', 'DONE')

  await ctx.onStep(3, 'POCN 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('POCN_Lines', pocnLines as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(3, 'POCN 리포트 생성', 'DONE')

  const accepted = pocnLines.filter((l) => l.decision === 'ACCEPT').length
  const partial = pocnLines.filter((l) => l.decision === 'PARTIAL').length

  return {
    summaryMessage: `POCN 처리 완료 — ${pocnLines.length}건 중 ACCEPT ${accepted}건, PARTIAL ${partial}건`,
    files: [
      {
        fileName: `${buyer.toLowerCase()}_pocn_report.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: pocnLines.slice(0, 5) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const poPivot: ExecutorFn = async (ctx) => {
  const buyer = resolveBuyerFromParams(ctx.params)

  await ctx.onStep(1, 'PO 데이터 로드', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'PO 데이터 로드', 'DONE')

  await ctx.onStep(2, 'Style×Week 피벗 생성', 'RUNNING')
  await delay()
  const styles = [`${buyer.substring(0, 2).toUpperCase()}-2501`, `${buyer.substring(0, 2).toUpperCase()}-2502`, `${buyer.substring(0, 2).toUpperCase()}-2503`, `${buyer.substring(0, 2).toUpperCase()}-2504`, `${buyer.substring(0, 2).toUpperCase()}-2505`]
  const weeks = ['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21']
  const pivotRows = styles.map((style, si) =>
    Object.fromEntries([
      ['style_no', style],
      ...weeks.map((w, wi) => {
        const seed = si * 100 + wi
        const x = Math.abs(Math.sin(seed * 9301 + 49297) * 233280)
        return [w, Math.round((x % 3000) + 500)]
      }),
      ['total', 0], // placeholder
    ]),
  )
  // Calculate totals
  pivotRows.forEach((row) => {
    row.total = weeks.reduce((sum, w) => sum + (row[w] as number), 0)
  })
  await ctx.onStep(2, 'Style×Week 피벗 생성', 'DONE')

  await ctx.onStep(3, '피벗 엑셀 출력', 'RUNNING')
  const buffer = toXlsxBuffer('PO_Pivot', pivotRows)
  await delay()
  await ctx.onStep(3, '피벗 엑셀 출력', 'DONE')

  return {
    summaryMessage: `${buyer} PO 피벗 테이블 생성 — ${styles.length} styles × ${weeks.length} weeks`,
    files: [
      {
        fileName: `${buyer.toLowerCase()}_po_pivot.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: pivotRows.slice(0, 3),
      },
    ],
  }
}

const commStockAlertMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, 'KRX 105630 시세 조회', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'KRX 105630 시세 조회', 'DONE')

  await ctx.onStep(2, '30일 추이 분석', 'RUNNING')
  const series = getHansaeStockSeries(30)
  await delay()
  await ctx.onStep(2, '30일 추이 분석', 'DONE')

  await ctx.onStep(3, '리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('Stock_105630', series as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(3, '리포트 생성', 'DONE')

  const latest = series[series.length - 1]
  const first = series[0]
  const periodChange = (((latest.close - first.close) / first.close) * 100).toFixed(2)

  return {
    summaryMessage: `한세실업(105630) 30일 시세 — 최종 ${latest.close.toLocaleString()}원, 기간수익률 ${periodChange}%`,
    files: [
      {
        fileName: 'hansae_105630_stock.xlsx',
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: series.slice(-5) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const prodInspection: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, 'Inline IPQC 샘플링', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'Inline IPQC 샘플링', 'DONE')

  await ctx.onStep(2, 'AQL 2.5 Major 산출', 'RUNNING')
  const lots = getInspectionLots(24)
  await delay()
  await ctx.onStep(2, 'AQL 2.5 Major 산출', 'DONE')

  await ctx.onStep(3, 'Critical 0 검증', 'RUNNING')
  await delay()
  const criticalCount = lots.filter((l) => l.critical_defects > 0).length
  await ctx.onStep(3, 'Critical 0 검증', 'DONE')

  await ctx.onStep(4, 'Report 생성', 'RUNNING')
  const passCount = lots.filter((l) => l.aql_result === 'PASS').length
  const failCount = lots.filter((l) => l.aql_result === 'FAIL').length

  const wb = XLSX.utils.book_new()
  const wsLots = XLSX.utils.json_to_sheet(lots as unknown as Record<string, unknown>[])
  XLSX.utils.book_append_sheet(wb, wsLots, 'Inspection_Lots')
  const wsSummary = XLSX.utils.json_to_sheet([
    {
      total_lots: lots.length,
      pass: passCount,
      fail: failCount,
      pass_rate: `${((passCount / lots.length) * 100).toFixed(1)}%`,
      critical_alerts: criticalCount,
      aql_level: '2.5 Major / 0 Critical',
    },
  ])
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const buffer = Buffer.from(buf)
  await delay()
  await ctx.onStep(4, 'Report 생성', 'DONE')

  return {
    summaryMessage: `IPQC 검사 완료 — ${lots.length}개 LOT 중 PASS ${passCount}, FAIL ${failCount} (합격률 ${((passCount / lots.length) * 100).toFixed(1)}%), Critical 경고 ${criticalCount}건`,
    files: [
      {
        fileName: 'ipqc_inspection_report.xlsx',
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previewRows: lots.slice(0, 5) as unknown as Record<string, unknown>[],
      },
    ],
  }
}

const notifyThresholdMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '임계값 평가', 'RUNNING')
  await delay()
  await ctx.onStep(1, '임계값 평가', 'DONE')

  await ctx.onStep(2, '알림 발송', 'RUNNING')
  await delay()
  await ctx.onStep(2, '알림 발송', 'DONE')

  return {
    summaryMessage: '임계값 기반 알림이 정상적으로 발송되었습니다. (Teams / Email)',
    files: [],
  }
}

const lowcodeInterpreter: ExecutorFn = async (ctx) => {
  let nodes: { id: string; label: string }[] = []
  try {
    const wf = JSON.parse(ctx.agent.workflowJson || '{"nodes":[]}')
    nodes = wf.nodes || []
  } catch {
    nodes = [{ id: '1', label: 'Default Node' }]
  }

  for (let i = 0; i < nodes.length; i++) {
    await ctx.onStep(i + 1, nodes[i].label || `Node ${nodes[i].id}`, 'RUNNING')
    await delay()
    await ctx.onStep(i + 1, nodes[i].label || `Node ${nodes[i].id}`, 'DONE')
  }

  return {
    summaryMessage: `로우코드 워크플로우 실행 완료 — ${nodes.length}개 노드 처리됨`,
    files: [],
  }
}

const fabricCostMock: ExecutorFn = async (ctx) => {
  const fabricType = (ctx.params.fabricType as string) || 'Single Jersey'
  const gsm = Number(ctx.params.gsm) || 180

  await ctx.onStep(1, '원단 스펙 분석', 'RUNNING')
  await delay()
  await ctx.onStep(1, '원단 스펙 분석', 'DONE')

  await ctx.onStep(2, '원사 시세 조회 (Cotton Index)', 'RUNNING')
  await delay()
  await ctx.onStep(2, '원사 시세 조회 (Cotton Index)', 'DONE')

  await ctx.onStep(3, '공임 계산 (편직/염색/가공)', 'RUNNING')
  await delay()
  const yarnBase = gsm > 200 ? 2.85 : gsm > 160 ? 2.45 : 2.10
  const origins = ['Vietnam', 'Cambodia', 'Indonesia']
  const costRows = origins.flatMap((origin) => {
    const factor = origin === 'Vietnam' ? 1.0 : origin === 'Cambodia' ? 0.92 : 1.05
    return [
      { origin, fabricType, gsm, item: 'Yarn Cost', cost: Number((yarnBase * factor).toFixed(2)) },
      { origin, fabricType, gsm, item: 'Knitting', cost: Number((0.65 * factor).toFixed(2)) },
      { origin, fabricType, gsm, item: 'Dyeing/Finishing', cost: Number((1.10 * factor).toFixed(2)) },
      { origin, fabricType, gsm, item: 'Inspection/Packing', cost: Number((0.18 * factor).toFixed(2)) },
      { origin, fabricType, gsm, item: 'Loss (5%)', cost: Number((yarnBase * factor * 0.05).toFixed(2)) },
    ]
  })
  await ctx.onStep(3, '공임 계산 (편직/염색/가공)', 'DONE')

  await ctx.onStep(4, '소싱처별 비교 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('Fabric_Cost', costRows as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, '소싱처별 비교 리포트 생성', 'DONE')

  const vnTotal = costRows.filter(r => r.origin === 'Vietnam').reduce((s, r) => s + r.cost, 0)
  return {
    summaryMessage: `원단 단가 산출 완료 — ${fabricType} ${gsm}GSM 기준 예상 단가 $${vnTotal.toFixed(2)}/yd (베트남), 3개국 비교 리포트 생성됨`,
    files: [{
      fileName: 'fabric_cost_estimate.xlsx',
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      previewRows: costRows.slice(0, 5) as unknown as Record<string, unknown>[],
    }],
  }
}

const techpackBomMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '문서 스캐닝 (12페이지)', 'RUNNING')
  await delay(600, 900)
  await ctx.onStep(1, '문서 스캐닝 (12페이지)', 'DONE')

  await ctx.onStep(2, '멀티모달 AI 분석', 'RUNNING')
  await delay(800, 1200)
  const bomItems = [
    { category: 'Shell Fabric', item: '100% Cotton Jersey', spec: '180GSM, 60"', supplier: 'Texhong Vietnam', unitCost: 3.20, confidence: 99.1 },
    { category: 'Lining', item: '100% Polyester Taffeta', spec: '58GSM, 58"', supplier: 'Youngone', unitCost: 1.15, confidence: 97.8 },
    { category: 'Zipper', item: 'YKK 5# Nylon Reverse', spec: '22cm', supplier: 'YKK Vietnam', unitCost: 0.45, confidence: 98.5 },
    { category: 'Thread', item: '60/3 Spun Polyester', spec: 'Color-matched', supplier: 'Coats', unitCost: 0.08, confidence: 96.2 },
    { category: 'Label', item: 'Woven Main + Care', spec: '30x60mm', supplier: 'Paxar', unitCost: 0.12, confidence: 99.5 },
    { category: 'Button', item: '4-Hole Poly Button', spec: '20L, Navy', supplier: 'HK Button', unitCost: 0.03, confidence: 95.0 },
    { category: 'Packaging', item: 'Polybag + Carton', spec: '12"x16"', supplier: 'Local', unitCost: 0.22, confidence: 98.0 },
    { category: 'Interlining', item: 'Woven Fusible', spec: '90GSM', supplier: 'Freudenberg', unitCost: 0.35, confidence: 97.3 },
  ]
  await ctx.onStep(2, '멀티모달 AI 분석', 'DONE')

  await ctx.onStep(3, 'BOM 데이터 추출 및 검증', 'RUNNING')
  await delay()
  await ctx.onStep(3, 'BOM 데이터 추출 및 검증', 'DONE')

  await ctx.onStep(4, 'BOM 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('TechPack_BOM', bomItems as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, 'BOM 리포트 생성', 'DONE')

  const avgConf = (bomItems.reduce((s, b) => s + b.confidence, 0) / bomItems.length).toFixed(1)
  return {
    summaryMessage: `Tech Pack BOM 추출 완료 — ${bomItems.length}개 항목, 평균 Confidence ${avgConf}%, 총 BOM 원가 $${bomItems.reduce((s, b) => s + b.unitCost, 0).toFixed(2)}`,
    files: [{
      fileName: 'techpack_bom_extracted.xlsx',
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      previewRows: bomItems.slice(0, 5) as unknown as Record<string, unknown>[],
    }],
  }
}

const buyerEmailMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '이메일 수신 및 분석', 'RUNNING')
  await delay()
  await ctx.onStep(1, '이메일 수신 및 분석', 'DONE')

  await ctx.onStep(2, '요청사항 분류 (NLP)', 'RUNNING')
  await delay()
  await ctx.onStep(2, '요청사항 분류 (NLP)', 'DONE')

  await ctx.onStep(3, 'ERP 데이터 조회', 'RUNNING')
  await delay()
  const emailAnalysis = [
    { emailId: 'EM-001', from: 'Target Buyer', subject: 'Shipment Delay PO #829103', category: 'Delivery Inquiry', priority: 'HIGH', erpMatch: 'PO-829103 / ETD 2026-05-25', draftStatus: 'Generated' },
    { emailId: 'EM-002', from: 'Gap Sourcing', subject: 'Sample Approval TS-102', category: 'Sample Request', priority: 'MEDIUM', erpMatch: 'SAMPLE-TS102 / Pending QC', draftStatus: 'Generated' },
    { emailId: 'EM-003', from: 'Walmart Global', subject: 'QBR Invitation', category: 'Meeting Request', priority: 'LOW', erpMatch: 'N/A', draftStatus: 'Generated' },
  ]
  await ctx.onStep(3, 'ERP 데이터 조회', 'DONE')

  await ctx.onStep(4, '답변 초안 생성', 'RUNNING')
  const buffer = toXlsxBuffer('Email_Drafts', emailAnalysis as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, '답변 초안 생성', 'DONE')

  return {
    summaryMessage: `이메일 처리 완료 — ${emailAnalysis.length}건 분석, AI 답변 초안 ${emailAnalysis.length}건 생성 (HIGH 1건, MEDIUM 1건, LOW 1건)`,
    files: [{
      fileName: 'email_draft_response.xlsx',
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      previewRows: emailAnalysis as unknown as Record<string, unknown>[],
    }],
  }
}

const lineOptimizerMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '생산라인 실시간 데이터 수집', 'RUNNING')
  await delay()
  await ctx.onStep(1, '생산라인 실시간 데이터 수집', 'DONE')

  await ctx.onStep(2, '가동률 분석 및 병목 탐지', 'RUNNING')
  await delay(600, 1000)
  const lines = [
    { line: 'A-01', product: 'T-Shirt', target: 1200, actual: 1020, efficiency: 85, bottleneck: 'None', recommendation: '정상 가동' },
    { line: 'A-02', product: 'Polo', target: 800, actual: 360, efficiency: 45, bottleneck: 'Sewing Step 3', recommendation: 'B-02 유휴 인력 2명 재배치' },
    { line: 'B-01', product: 'Jacket', target: 500, actual: 460, efficiency: 92, bottleneck: 'None', recommendation: '정상 가동' },
    { line: 'B-02', product: 'Pants', target: 1000, actual: 780, efficiency: 78, bottleneck: 'None', recommendation: '유휴 인력 A-02 지원 가능' },
    { line: 'C-01', product: 'Dress', target: 600, actual: 540, efficiency: 90, bottleneck: 'None', recommendation: '정상 가동' },
    { line: 'C-02', product: 'Shorts', target: 900, actual: 720, efficiency: 80, bottleneck: 'Cutting', recommendation: '커팅기 1대 추가 투입 권장' },
  ]
  await ctx.onStep(2, '가동률 분석 및 병목 탐지', 'DONE')

  await ctx.onStep(3, 'AI 최적화 시뮬레이션', 'RUNNING')
  await delay(500, 800)
  await ctx.onStep(3, 'AI 최적화 시뮬레이션', 'DONE')

  await ctx.onStep(4, '최적 배치 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('Line_Optimization', lines as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, '최적 배치 리포트 생성', 'DONE')

  const avgEff = (lines.reduce((s, l) => s + l.efficiency, 0) / lines.length).toFixed(1)
  const bottleneckCount = lines.filter(l => l.bottleneck !== 'None').length
  return {
    summaryMessage: `생산 최적화 분석 완료 — ${lines.length}개 라인, 평균 가동률 ${avgEff}%, 병목 ${bottleneckCount}건 탐지, 재배치 시뮬레이션 완료`,
    files: [{
      fileName: 'production_optimization.xlsx',
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      previewRows: lines.slice(0, 5) as unknown as Record<string, unknown>[],
    }],
  }
}

const qcVisionMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '카메라 영상 수집 (4채널)', 'RUNNING')
  await delay()
  await ctx.onStep(1, '카메라 영상 수집 (4채널)', 'DONE')

  await ctx.onStep(2, 'Vision AI 불량 탐지', 'RUNNING')
  await delay(700, 1100)
  const defects = [
    { id: 'DEF-001', time: '14:30:05', camera: 'CAM-01', type: 'Stain', confidence: 99.2, severity: 'Major', lotId: 'LOT-2026-0520-A', action: 'Line Stop' },
    { id: 'DEF-002', time: '14:32:18', camera: 'CAM-02', type: 'Seam Puckering', confidence: 96.5, severity: 'Minor', lotId: 'LOT-2026-0520-A', action: 'Flag' },
    { id: 'DEF-003', time: '14:35:41', camera: 'CAM-01', type: 'Hole', confidence: 98.8, severity: 'Critical', lotId: 'LOT-2026-0520-B', action: 'Reject' },
    { id: 'DEF-004', time: '14:40:12', camera: 'CAM-03', type: 'Shading', confidence: 94.1, severity: 'Minor', lotId: 'LOT-2026-0520-B', action: 'Flag' },
    { id: 'DEF-005', time: '14:42:55', camera: 'CAM-01', type: 'Stain', confidence: 97.6, severity: 'Major', lotId: 'LOT-2026-0520-C', action: 'Line Stop' },
    { id: 'DEF-006', time: '14:45:30', camera: 'CAM-04', type: 'Open Seam', confidence: 95.3, severity: 'Major', lotId: 'LOT-2026-0520-C', action: 'Rework' },
  ]
  await ctx.onStep(2, 'Vision AI 불량 탐지', 'DONE')

  await ctx.onStep(3, '불량 유형 분류 및 패턴 분석', 'RUNNING')
  await delay()
  await ctx.onStep(3, '불량 유형 분류 및 패턴 분석', 'DONE')

  await ctx.onStep(4, 'QC 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('QC_Defects', defects as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, 'QC 리포트 생성', 'DONE')

  return {
    summaryMessage: `QC Vision 분석 완료 — 검사 4,281건 중 불량 ${defects.length}건 탐지 (불량률 0.14%), Critical 1건 즉시 조치 필요`,
    files: [{
      fileName: 'qc_defect_report.xlsx',
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      previewRows: defects as unknown as Record<string, unknown>[],
    }],
  }
}

const logisticsMock: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, '선적 데이터 수집 (AIS/BL)', 'RUNNING')
  await delay()
  await ctx.onStep(1, '선적 데이터 수집 (AIS/BL)', 'DONE')

  await ctx.onStep(2, '실시간 위치 추적', 'RUNNING')
  await delay()
  const shipments = [
    { shipmentId: 'SHP-2026-0519-A', origin: 'HCM', dest: 'Long Beach', vessel: 'EVER GIVEN', departure: '2026-05-10', eta: '2026-06-05', status: 'On Track', progress: 62, cartons: 2400, cbm: 86.4 },
    { shipmentId: 'SHP-2026-0518-B', origin: 'Haiphong', dest: 'Savannah', vessel: 'MSC BELLA', departure: '2026-05-08', eta: '2026-06-15', status: 'Delayed +3d', progress: 48, cartons: 1800, cbm: 64.8 },
    { shipmentId: 'SHP-2026-0517-C', origin: 'Chittagong', dest: 'Rotterdam', vessel: 'MAERSK SELETAR', departure: '2026-05-05', eta: '2026-06-02', status: 'On Track', progress: 78, cartons: 3200, cbm: 115.2 },
    { shipmentId: 'SHP-2026-0520-D', origin: 'Phnom Penh', dest: 'Los Angeles', vessel: 'CMA CGM MARCO POLO', departure: '2026-05-12', eta: '2026-06-08', status: 'On Track', progress: 55, cartons: 1500, cbm: 54.0 },
  ]
  await ctx.onStep(2, '실시간 위치 추적', 'DONE')

  await ctx.onStep(3, '기상/항만 데이터 분석', 'RUNNING')
  await delay()
  await ctx.onStep(3, '기상/항만 데이터 분석', 'DONE')

  await ctx.onStep(4, '최적 경로 리포트 생성', 'RUNNING')
  const buffer = toXlsxBuffer('Logistics_Tracking', shipments as unknown as Record<string, unknown>[])
  await delay()
  await ctx.onStep(4, '최적 경로 리포트 생성', 'DONE')

  const onTrack = shipments.filter(s => s.status === 'On Track').length
  return {
    summaryMessage: `물류 추적 완료 — ${shipments.length}건 선적 중 ${onTrack}건 정상, ${shipments.length - onTrack}건 지연. 총 ${shipments.reduce((s, sh) => s + sh.cartons, 0).toLocaleString()} cartons`,
    files: [{
      fileName: 'logistics_optimization.xlsx',
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      previewRows: shipments as unknown as Record<string, unknown>[],
    }],
  }
}

const streamlitRedirect: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, 'Streamlit 앱 연결 확인', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'Streamlit 앱 연결 확인', 'DONE')

  return {
    summaryMessage: `Streamlit 앱으로 리다이렉트합니다. (${ctx.agent.name})`,
    files: [],
  }
}

const biRedirect: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, 'BI 대시보드 연결 확인', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'BI 대시보드 연결 확인', 'DONE')

  return {
    summaryMessage: `BI 대시보드로 리다이렉트합니다. (${ctx.agent.name})`,
    files: [],
  }
}

const windowsWorkerSim: ExecutorFn = async (ctx) => {
  await ctx.onStep(1, 'Worker 큐 등록', 'RUNNING')
  await delay()
  await ctx.onStep(1, 'Worker 큐 등록', 'DONE')

  await ctx.onStep(2, 'RPA 스크립트 전송', 'RUNNING')
  await delay()
  await ctx.onStep(2, 'RPA 스크립트 전송', 'DONE')

  await ctx.onStep(3, '실행 대기 (시뮬레이션)', 'RUNNING')
  await delay()
  await ctx.onStep(3, '실행 대기 (시뮬레이션)', 'DONE')

  await ctx.onStep(4, '결과 수신', 'RUNNING')
  await delay()
  await ctx.onStep(4, '결과 수신', 'DONE')

  return {
    summaryMessage: `Windows Worker 시뮬레이션 완료 — RPA 스크립트 실행 결과가 정상 수신되었습니다.`,
    files: [],
  }
}

/* ------------------------------------------------------------------ */
/*  Registry map                                                       */
/* ------------------------------------------------------------------ */

const EXECUTOR_REGISTRY: Record<string, ExecutorFn> = {
  'design-crawl-brand': designCrawlBrand,
  'design-alvanon-mock': designAlvanonMock,
  'design-linesheet': designLinesheet,
  'po-order-recap': poOrderRecap,
  'po-pocn': poPocn,
  'po-pivot': poPivot,
  'po-pdf-to-excel-sample': poOrderRecap, // alias
  'comm-stock-alert-mock': commStockAlertMock,
  'prod-inspection': prodInspection,
  'notify-threshold-mock': notifyThresholdMock,
  'fabric-cost-mock': fabricCostMock,
  'techpack-bom-mock': techpackBomMock,
  'buyer-email-mock': buyerEmailMock,
  'line-optimizer-mock': lineOptimizerMock,
  'qc-vision-mock': qcVisionMock,
  'logistics-mock': logisticsMock,
  'lowcode-interpreter': lowcodeInterpreter,
  'streamlit-redirect': streamlitRedirect,
  'bi-redirect': biRedirect,
  'windows-worker-sim': windowsWorkerSim,
}

/* ------------------------------------------------------------------ */
/*  Resolver                                                           */
/* ------------------------------------------------------------------ */

export function resolveExecutor(agent: {
  executorKey: string | null
  buildTier: string
  workflowJson: string | null
}): ExecutorFn {
  // 1. LOWCODE tier with workflowJson → lowcode-interpreter
  if (agent.buildTier === 'LOWCODE' && agent.workflowJson) {
    return EXECUTOR_REGISTRY['lowcode-interpreter']
  }

  // 2. Explicit executorKey
  if (agent.executorKey && EXECUTOR_REGISTRY[agent.executorKey]) {
    return EXECUTOR_REGISTRY[agent.executorKey]
  }

  // 3. Fallback
  return EXECUTOR_REGISTRY['po-order-recap']
}

export { EXECUTOR_REGISTRY }
