import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

function bumpVersion(currentVersion: string, bumpType: string = 'patch'): string {
  const parts = currentVersion.split('.').map(Number)
  if (parts.length !== 3) return '0.1.0'

  switch (bumpType) {
    case 'major':
      return `${parts[0] + 1}.0.0`
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`
    case 'patch':
    default:
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { id } = params

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    if (agent.ownerId !== user.id && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Only the owner can create new versions', 403)
    }

    const body = await request.json().catch(() => ({}))
    const bumpType = body.bumpType ?? 'patch'
    const changelog = body.changelog ?? ''

    const latestVersion = agent.versions[0]
    const currentVersionStr = latestVersion?.version ?? '0.0.0'
    const newVersionStr = bumpVersion(currentVersionStr, bumpType)

    const version = await prisma.agentVersion.create({
      data: {
        agentId: id,
        version: newVersionStr,
        changelog,
        status: 'DRAFT',
      },
    })

    return apiSuccess({
      message: `Version ${newVersionStr} created`,
      version,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Create version error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to create version', 500)
  }
}
