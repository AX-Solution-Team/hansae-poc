import { cookies } from 'next/headers'
import { requireAuth, roleLevel } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)

    // Published agent count
    const publishedCount = await prisma.agent.count({
      where: { status: 'PUBLISHED' },
    })

    // Pending approvals (only for APPROVER+)
    let pendingApprovals = 0
    if (roleLevel(user.role) >= roleLevel('APPROVER')) {
      pendingApprovals = await prisma.approvalRequest.count({
        where: {
          decision: 'PENDING',
          agent: { teamId: user.teamId },
        },
      })
    }

    // Recent jobs (last 5)
    const recentJobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        agent: { select: { id: true, slug: true, name: true } },
      },
    })

    return apiSuccess({
      publishedCount,
      pendingApprovals,
      recentJobs,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Dashboard error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to load dashboard', 500)
  }
}
