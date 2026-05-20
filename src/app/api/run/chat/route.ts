import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchAgent, resolveBuyer } from '@/lib/orchestrator/match-agent'
import { canRun } from '@/lib/policy'
import { runJob } from '@/lib/job-runner'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)

    const body = await request.json()
    const { message, slug, sessionId, params: inputParams } = body

    if (!message && !slug) {
      return apiError('VALIDATION_ERROR', 'Either message or slug is required', 400)
    }

    // Step 1: Match agent
    const match = matchAgent(message ?? '', slug)

    // Step 2: If no match, return ORC_NO_MATCH with candidates
    if (!match) {
      const candidates = await prisma.agent.findMany({
        where: { status: 'PUBLISHED', demoRunnable: true },
        orderBy: { runCount: 'desc' },
        take: 6,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          agentGroup: true,
          tags: true,
        },
      })

      return apiSuccess({
        matched: false,
        code: 'ORC_NO_MATCH',
        reply: '적합한 에이전트를 찾지 못했습니다. 아래 에이전트를 시도해 보세요.',
        candidates: candidates.map((c) => ({
          slug: c.slug,
          name: c.name,
        })),
      })
    }

    // Step 3: Find agent by slug
    const agent = await prisma.agent.findUnique({
      where: { slug: match.slug },
      include: {
        publishedVersion: true,
      },
    })

    if (!agent) {
      return apiError('NOT_FOUND', `Agent "${match.slug}" not found`, 404)
    }

    // Step 4: Check canRun policy
    const decision = canRun(agent, user)
    if (!decision.allowed) {
      return apiSuccess({
        matched: true,
        agent: { id: agent.id, slug: agent.slug, name: agent.name },
        code: decision.code,
        reply:
          decision.code === 'AGENT_NOT_RUNNABLE'
            ? '이 에이전트는 아직 실행할 수 없습니다 (미출시 또는 버전 미지정).'
            : decision.code === 'AGENT_LOCKED'
              ? '이 에이전트는 데모 실행이 잠겨 있습니다.'
              : '실행 정책에 의해 차단되었습니다.',
      })
    }

    // Step 5: Create or reuse ChatSession
    let chatSession
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } })
      if (!chatSession || chatSession.userId !== user.id) {
        chatSession = null
      }
    }
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: message ? message.slice(0, 80) : agent.name,
        },
      })
    }

    // Step 6: Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'user',
        content: message ?? `Run agent: ${agent.slug}`,
        metadata: JSON.stringify({ slug: agent.slug }),
      },
    })

    // Resolve buyer for params
    const buyer = resolveBuyer(message ?? '', inputParams)
    const mergedParams = { ...inputParams, buyer }

    // Step 7: Run the job
    let jobId: string
    let jobStatus = 'COMPLETED'
    let errorMessage: string | null = null

    // Handle redirect mode
    if (decision.mode === 'redirect') {
      // For redirect agents (Streamlit, BI), create a minimal job
      jobId = await runJob({
        agentId: agent.id,
        userId: user.id,
        params: mergedParams,
        chatSessionId: chatSession.id,
        orchestratorRaw: message,
      })
    } else {
      try {
        jobId = await runJob({
          agentId: agent.id,
          userId: user.id,
          params: mergedParams,
          chatSessionId: chatSession.id,
          orchestratorRaw: message,
        })
      } catch (err) {
        // Job failed but was created - get the id from the error
        const failedJob = await prisma.job.findFirst({
          where: {
            agentId: agent.id,
            userId: user.id,
            chatSessionId: chatSession.id,
            status: 'FAILED',
          },
          orderBy: { createdAt: 'desc' },
        })
        jobId = failedJob?.id ?? ''
        jobStatus = 'FAILED'
        errorMessage = err instanceof Error ? err.message : String(err)
      }
    }

    // Step 8: Get full job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        steps: { orderBy: { seq: 'asc' } },
        outputFiles: true,
      },
    })

    // Step 9: Save assistant message
    const assistantContent = job?.summaryMessage ?? errorMessage ?? 'Job completed.'
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'assistant',
        content: assistantContent,
        metadata: JSON.stringify({
          jobId,
          agentSlug: agent.slug,
          status: job?.status ?? jobStatus,
        }),
      },
    })

    // Step 10: alternateBrands logic
    let alternateBrands: { slug: string; name: string; agentGroup: string }[] = []
    if (agent.slug.startsWith('design-') && agent.slug.includes('-trousers')) {
      const alternates = await prisma.agent.findMany({
        where: {
          slug: { contains: '-trousers' },
          status: 'PUBLISHED',
          id: { not: agent.id },
        },
        select: { slug: true, name: true, agentGroup: true },
      })
      alternateBrands = alternates
    }

    return apiSuccess({
      matched: true,
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
      },
      sessionId: chatSession.id,
      jobId,
      reply: job?.summaryMessage ?? errorMessage ?? 'Job completed.',
      job: {
        status: job?.status ?? jobStatus,
        steps: (job?.steps ?? []).map((s) => ({ label: s.label, status: s.status.toLowerCase() })),
        summaryMessage: job?.summaryMessage ?? null,
      },
      outputFiles: (job?.outputFiles ?? []).map((f) => ({
        id: f.id,
        fileName: f.fileName,
        downloadUrl: f.blobUrl,
        previewRows: f.previewJson ? JSON.parse(f.previewJson) : null,
      })),
      alternateBrands,
      mode: decision.mode,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Run chat error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to run agent', 500)
  }
}
