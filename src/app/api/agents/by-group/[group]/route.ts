import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: { group: string } },
) {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)
    const { group } = params

    const agents = await prisma.agent.findMany({
      where: { agentGroup: group, status: 'PUBLISHED' },
      orderBy: { name: 'asc' },
      include: {
        owner: { select: { id: true, displayName: true } },
        team: { select: { id: true, name: true } },
      },
    })

    const items = agents.map((a) => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
    }))

    return apiSuccess({ items })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Agents by group error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list agents by group', 500)
  }
}
