import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { runJob } from '@/lib/job-runner'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { id } = params

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    if (agent.ownerId !== user.id && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Only the owner can test this agent', 403)
    }

    const body = await request.json().catch(() => ({}))
    const inputParams = body.params ?? {}

    const jobId = await runJob({
      agentId: id,
      userId: user.id,
      params: inputParams,
      isSandbox: true,
    })

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        steps: { orderBy: { seq: 'asc' } },
        outputFiles: true,
      },
    })

    return apiSuccess({
      jobId: job?.id,
      status: job?.status,
      summaryMessage: job?.summaryMessage ?? null,
      steps: (job?.steps ?? []).map((s) => ({ label: s.label, status: s.status })),
      durationMs: job?.durationMs ?? null,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Test agent error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to test agent', 500)
  }
}
