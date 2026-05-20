import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)

    const [groupCounts, runnableCounts] = await Promise.all([
      prisma.agent.groupBy({
        by: ['agentGroup'],
        where: { status: 'PUBLISHED' },
        _count: { id: true },
      }),
      prisma.agent.groupBy({
        by: ['agentGroup'],
        where: { status: 'PUBLISHED', demoRunnable: true },
        _count: { id: true },
      }),
    ])

    const runnableMap = new Map(runnableCounts.map((r) => [r.agentGroup, r._count.id]))
    const groups = groupCounts.map((g) => ({
      group: g.agentGroup,
      total: g._count.id,
      runnable: runnableMap.get(g.agentGroup) ?? 0,
    }))

    return apiSuccess({ groups })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Agent groups error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list groups', 500)
  }
}
