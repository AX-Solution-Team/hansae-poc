import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)

    const { searchParams } = request.nextUrl
    const mine = searchParams.get('mine') === 'true'
    const status = searchParams.get('status') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (mine) {
      where.userId = user.id
    }
    if (status) {
      where.status = status
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          agent: { select: { id: true, slug: true, name: true } },
          user: { select: { id: true, displayName: true } },
          _count: { select: { steps: true, outputFiles: true } },
        },
      }),
      prisma.job.count({ where }),
    ])

    return apiSuccess({
      items: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('List jobs error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list jobs', 500)
  }
}
