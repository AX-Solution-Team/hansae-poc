import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)
    const { id } = params

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, slug: true, name: true } },
        user: { select: { id: true, displayName: true } },
        steps: { orderBy: { seq: 'asc' } },
        outputFiles: true,
      },
    })

    if (!job) {
      return apiError('NOT_FOUND', 'Job not found', 404)
    }

    return apiSuccess({
      ...job,
      outputFiles: job.outputFiles.map((f) => ({
        ...f,
        previewRows: f.previewJson ? JSON.parse(f.previewJson) : null,
        previewJson: undefined,
      })),
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Job detail error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to get job', 500)
  }
}
