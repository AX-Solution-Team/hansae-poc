import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)

    const templates = await prisma.template.findMany({
      orderBy: { name: 'asc' },
    })

    const items = templates.map((t) => {
      const parsed = JSON.parse(t.formSchema || '{}')
      return {
        ...t,
        formSchema: Array.isArray(parsed) ? parsed : parsed.fields ?? [],
      }
    })

    return apiSuccess({ items })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('List templates error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list templates', 500)
  }
}
