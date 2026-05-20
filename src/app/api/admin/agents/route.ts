import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    await requireRole(cookieStore, 'ADMIN')

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, displayName: true, email: true } },
          team: { select: { id: true, name: true } },
          _count: {
            select: { jobs: true, favorites: true, versions: true },
          },
        },
      }),
      prisma.agent.count({ where }),
    ])

    const items = agents.map((a) => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
    }))

    return apiSuccess({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'ADMIN role required', 403)
    }
    console.error('Admin agents error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list agents', 500)
  }
}
