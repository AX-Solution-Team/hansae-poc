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
    const q = searchParams.get('q') ?? ''
    const group = searchParams.get('group') ?? ''
    const tag = searchParams.get('tag') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { status: 'PUBLISHED' }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { slug: { contains: q } },
      ]
    }
    if (group) {
      where.agentGroup = group
    }
    if (tag) {
      where.tags = { contains: tag }
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, displayName: true } },
          team: { select: { id: true, name: true } },
          favorites: { where: { userId: user.id }, select: { id: true } },
        },
      }),
      prisma.agent.count({ where }),
    ])

    const items = agents.map(({ favorites, team, ...a }) => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
      inputsSchema: JSON.parse(a.inputsSchema || '[]'),
      outputsSchema: JSON.parse(a.outputsSchema || '[]'),
      isFavorite: favorites.length > 0,
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
    console.error('Marketplace list error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list marketplace agents', 500)
  }
}
