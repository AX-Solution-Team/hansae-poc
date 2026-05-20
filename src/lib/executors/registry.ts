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
