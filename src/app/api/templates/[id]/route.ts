import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

const TYPE_MAP: Record<string, string> = {
  url: 'string', cron: 'string', file: 'string', select: 'enum',
  text: 'text', number: 'number', string: 'string', enum: 'enum',
}
function mapFieldType(t: string) { return TYPE_MAP[t] ?? 'string' }

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)
    const { id } = params

    const template = await prisma.template.findUnique({ where: { id } })
    if (!template) {
      return apiError('NOT_FOUND', 'Template not found', 404)
    }

    const parsed = JSON.parse(template.formSchema || '{}')
    const rawFields: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : parsed.fields ?? []
    const formSchema = rawFields.map((f) => ({
      key: f.name ?? f.key ?? '',
      label: f.label ?? '',
      type: mapFieldType(String(f.type ?? 'string')),
      required: !!f.required,
      placeholder: f.placeholder ?? undefined,
      options: Array.isArray(f.options) ? f.options : undefined,
      defaultValue: f.default ?? f.defaultValue ?? undefined,
    }))
    return apiSuccess({ ...template, formSchema })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Get template error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to get template', 500)
  }
}
