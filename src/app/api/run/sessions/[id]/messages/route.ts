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
    const user = await requireAuth(cookieStore)
    const { id } = params

    const session = await prisma.chatSession.findUnique({
      where: { id },
    })

    if (!session) {
      return apiError('NOT_FOUND', 'Session not found', 404)
    }

    if (session.userId !== user.id) {
      return apiError('FORBIDDEN', 'Access denied', 403)
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    })

    const items = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
      createdAt: m.createdAt,
    }))

    return apiSuccess({ items, session: { id: session.id, title: session.title } })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Session messages error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to get messages', 500)
  }
}
