import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const user = await requireRole(cookieStore, 'CREATOR')

    const body = await request.json()
    const {
      name,
      slug,
      description,
      agentGroup,
      buildTier,
      runtimeType,
      dataClassification,
      templateId,
      workflowJson,
      executorKey,
      tags,
      inputsSchema,
      outputsSchema,
      department,
      asIsSummary,
      toBeSummary,
      workflowMd,
      demoRunnable,
    } = body

    // NOCODE requires templateId
    if (buildTier === 'NOCODE' && !templateId) {
      return apiError('VALIDATION_ERROR', 'NOCODE agents require a templateId', 400)
    }

    // Resolve executorKey and auto-fill fields for NOCODE from template
    let resolvedExecutorKey = executorKey ?? null
    let resolvedSlug = slug
    let resolvedDescription = description
    let resolvedAgentGroup = agentGroup
    let resolvedRuntimeType = runtimeType
    let resolvedDataClassification = dataClassification

    if (buildTier === 'NOCODE' && templateId) {
      const template = await prisma.template.findUnique({ where: { id: templateId } })
      if (!template) {
        return apiError('NOT_FOUND', 'Template not found', 404)
      }
      resolvedExecutorKey = resolvedExecutorKey || template.defaultExecutorKey
      if (!resolvedSlug) {
        resolvedSlug = name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      }
      if (!resolvedDescription) resolvedDescription = template.description
      if (!resolvedAgentGroup) {
        const prefix = (template.defaultExecutorKey ?? '').split('-')[0]?.toUpperCase()
        const groupMap: Record<string, string> = { DESIGN: 'DESIGN', PO: 'PO_PROCESSING', PROD: 'PRODUCTION', COMM: 'COMMUNICATION' }
        resolvedAgentGroup = groupMap[prefix] ?? 'COMMUNICATION'
      }
      if (!resolvedRuntimeType) resolvedRuntimeType = template.runtimeType
      if (!resolvedDataClassification) resolvedDataClassification = template.dataClassification
    }

    if (!name || !resolvedSlug || !resolvedDescription || !resolvedAgentGroup || !buildTier || !resolvedRuntimeType || !resolvedDataClassification) {
      return apiError('VALIDATION_ERROR', 'Missing required fields: name, slug, description, agentGroup, buildTier, runtimeType, dataClassification', 400)
    }

    // Check slug uniqueness
    const existing = await prisma.agent.findUnique({ where: { slug: resolvedSlug } })
    if (existing) {
      return apiError('CONFLICT', 'An agent with this slug already exists', 409)
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        slug: resolvedSlug,
        description: resolvedDescription,
        agentGroup: resolvedAgentGroup,
        buildTier,
        runtimeType: resolvedRuntimeType,
        dataClassification: resolvedDataClassification,
        status: 'DRAFT',
        templateId: templateId ?? null,
        workflowJson: workflowJson ? JSON.stringify(workflowJson) : null,
        executorKey: resolvedExecutorKey,
        tags: JSON.stringify(tags ?? []),
        inputsSchema: JSON.stringify(inputsSchema ?? []),
        outputsSchema: JSON.stringify(outputsSchema ?? []),
        department: department ?? null,
        asIsSummary: asIsSummary ?? null,
        toBeSummary: toBeSummary ?? null,
        workflowMd: workflowMd ?? null,
        demoRunnable: demoRunnable ?? false,
        ownerId: user.id,
        teamId: user.teamId,
      },
    })

    // Create initial version
    await prisma.agentVersion.create({
      data: {
        agentId: agent.id,
        version: '0.1.0',
        changelog: 'Initial draft',
        status: 'DRAFT',
      },
    })

    return apiSuccess(agent)
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'Insufficient permissions. CREATOR role required.', 403)
    }
    console.error('Create agent error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to create agent', 500)
  }
}
