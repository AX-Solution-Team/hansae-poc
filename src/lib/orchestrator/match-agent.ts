/* ------------------------------------------------------------------ */
/*  Keyword-based orchestrator — matches user messages to agent slugs  */
/* ------------------------------------------------------------------ */

type MatchResult = { slug: string } | null

/**
 * Priority-ordered keyword matching engine.
 *
 * 1. slug or agentId in request → that Agent
 * 2. 리캡/recap + PO/오더 → po-order-recap
 * 3. pocn 또는 pdf+po → po-pocn
 * 4. 피벗/pivot → po-pivot
 * 5. ZARA/자라 + trousers/바지/신제품 → design-zara-trousers
 * 6. Target/타겟 + trousers/바지/신제품 → design-target-trousers
 * 7. Walmart/월마트 + trousers/바지 → design-walmart-trousers
 * 8. linesheet/라인시트 → design-linesheet
 * 9. alvanon/avatar/핏 → design-alvanon
 * 10. 검사/inspection/aql/ipqc → prod-inspection
 * 11. 주가/stock/105630/한세실업 → comm-stock-alert
 * 12. Target/타겟 + PO/오더 → po-order-recap
 * 13. po/오더/pdf (일반) → po-order-recap
 * 14. else → null (ORC_NO_MATCH)
 */
export function matchAgent(
  message: string,
  slug?: string,
  agentId?: string,
): MatchResult {
  // Rule 1: explicit slug or agentId
  if (slug) return { slug }
  if (agentId) return { slug: agentId }

  const msg = message.toLowerCase()

  // Rule 2: 리캡/recap + PO/오더
  if (
    (msg.includes('리캡') || msg.includes('recap')) &&
    (msg.includes('po') || msg.includes('오더') || msg.includes('order'))
  ) {
    return { slug: 'po-order-recap' }
  }

  // Rule 3: pocn or (pdf + po)
  if (msg.includes('pocn')) return { slug: 'po-pocn' }
  if (msg.includes('pdf') && msg.includes('po')) return { slug: 'po-pocn' }

  // Rule 4: 피벗/pivot
  if (msg.includes('피벗') || msg.includes('pivot')) {
    return { slug: 'po-pivot' }
  }

  // Rule 5: ZARA + trousers/바지/신제품
  if (
    (msg.includes('zara') || msg.includes('자라')) &&
    (msg.includes('trouser') || msg.includes('바지') || msg.includes('신제품') || msg.includes('pant'))
  ) {
    return { slug: 'design-zara-trousers' }
  }

  // Rule 6: Target + trousers/바지/신제품
  if (
    (msg.includes('target') || msg.includes('타겟')) &&
    (msg.includes('trouser') || msg.includes('바지') || msg.includes('신제품') || msg.includes('pant'))
  ) {
    return { slug: 'design-target-trousers' }
  }

  // Rule 7: Walmart + trousers/바지
  if (
    (msg.includes('walmart') || msg.includes('월마트')) &&
    (msg.includes('trouser') || msg.includes('바지') || msg.includes('신제품') || msg.includes('pant'))
  ) {
    return { slug: 'design-walmart-trousers' }
  }

  // Rule 8: linesheet/라인시트
  if (msg.includes('linesheet') || msg.includes('라인시트')) {
    return { slug: 'design-linesheet' }
  }

  // Rule 9: alvanon/avatar/핏
  if (msg.includes('alvanon') || msg.includes('avatar') || msg.includes('핏')) {
    return { slug: 'design-alvanon' }
  }

  // Rule 10: 검사/inspection/aql/ipqc
  if (
    msg.includes('검사') ||
    msg.includes('inspection') ||
    msg.includes('aql') ||
    msg.includes('ipqc')
  ) {
    return { slug: 'prod-inspection' }
  }

  // Rule 11: 주가/stock/105630/한세실업
  if (
    msg.includes('주가') ||
    msg.includes('stock') ||
    msg.includes('105630') ||
    msg.includes('한세실업')
  ) {
    return { slug: 'comm-stock-alert' }
  }

  // Rule 12: Target/타겟 + PO/오더
  if (
    (msg.includes('target') || msg.includes('타겟')) &&
    (msg.includes('po') || msg.includes('오더') || msg.includes('order'))
  ) {
    return { slug: 'po-order-recap' }
  }

  // Rule 13: po/오더/pdf (general)
  if (msg.includes('po') || msg.includes('오더') || msg.includes('pdf')) {
    return { slug: 'po-order-recap' }
  }

  // Rule 14: no match
  return null
}

/**
 * Extract buyer name from a message string or params.
 * Used by design-crawl and PO executors to tailor output.
 */
export function resolveBuyer(
  message: string,
  params?: Record<string, unknown>,
): string {
  // Check explicit params first
  if (params?.buyer && typeof params.buyer === 'string') return params.buyer
  if (params?.brand && typeof params.brand === 'string') return params.brand

  const msg = message.toLowerCase()

  if (msg.includes('zara') || msg.includes('자라')) return 'ZARA'
  if (msg.includes('walmart') || msg.includes('월마트')) return 'Walmart'
  if (msg.includes('gap') || msg.includes('갭')) return 'Gap'
  if (msg.includes('target') || msg.includes('타겟')) return 'Target'

  return 'Target'
}
