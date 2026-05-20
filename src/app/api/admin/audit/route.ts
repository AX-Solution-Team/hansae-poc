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
    const eventType = searchParams.get('eventType') ?? ''
    const userId = searchParams.get('userId') ?? ''
    const agentId = searchParams.get('agentId') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (eventType) where.eventType = eventType
    if (userId) where.userId = userId
    if (agentId) where.agentId = agentId

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    const items = logs.map((l) => ({
      ...l,
      payload: l.payload ? JSON.parse(l.payload) : null,
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
    console.error('Audit log error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list audit logs', 500)
  }
}
