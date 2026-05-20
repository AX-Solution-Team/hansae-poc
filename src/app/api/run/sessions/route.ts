import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)

    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    })

    const items = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      lastMessage: s.messages[0] ?? null,
      messageCount: s._count.messages,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    return apiSuccess({ items })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('List sessions error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list sessions', 500)
  }
}
