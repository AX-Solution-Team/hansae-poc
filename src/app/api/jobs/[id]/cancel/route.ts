import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { id } = params

    const job = await prisma.job.findUnique({ where: { id } })
    if (!job) {
      return apiError('NOT_FOUND', 'Job not found', 404)
    }

    if (job.userId !== user.id && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Only the job owner can cancel it', 403)
    }

    if (job.status !== 'QUEUED' && job.status !== 'RUNNING') {
      return apiError('CONFLICT', 'Only QUEUED or RUNNING jobs can be cancelled', 409)
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    })

    return apiSuccess({
      message: 'Job cancelled',
      job: updated,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Cancel job error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to cancel job', 500)
  }
}
