import { prisma } from '@/lib/db'
import { resolveExecutor, ExecutorContext } from '@/lib/executors/registry'

export async function runJob(opts: {
  agentId: string
  userId: string
  params: Record<string, unknown>
  isSandbox?: boolean
  chatSessionId?: string
  orchestratorRaw?: string
}): Promise<string> {
  const job = await prisma.job.create({
    data: {
      agentId: opts.agentId,
      userId: opts.userId,
      status: 'QUEUED',
      inputParams: JSON.stringify(opts.params),
      isSandbox: opts.isSandbox ?? false,
      chatSessionId: opts.chatSessionId ?? null,
      orchestratorRaw: opts.orchestratorRaw ?? null,
    },
  })

  const jobId = job.id

  try {
    const startedAt = new Date()
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt },
    })

    const agent = await prisma.agent.findUniqueOrThrow({
      where: { id: opts.agentId },
      select: {
        id: true,
        slug: true,
        name: true,
        executorKey: true,
        buildTier: true,
        workflowJson: true,
      },
    })

    const executorFn = resolveExecutor(agent)

    const steps: { seq: number; label: string; status: string; startedAt?: Date; endedAt?: Date }[] = []

    const onStep = async (seq: number, label: string, status: string) => {
      const existing = steps.find((s) => s.seq === seq)
      if (existing) {
        existing.status = status
        if (status === 'DONE' || status === 'ERROR') {
          existing.endedAt = new Date()
        }
      } else {
        steps.push({
          seq,
          label,
          status,
          startedAt: new Date(),
          endedAt: status === 'DONE' || status === 'ERROR' ? new Date() : undefined,
        })
      }
    }

    const ctx: ExecutorContext = {
      agent,
      params: opts.params,
      jobId,
      onStep,
    }

    const result = await executorFn(ctx)

    for (const step of steps) {
      await prisma.jobStep.create({
        data: {
          jobId,
          seq: step.seq,
          label: step.label,
          status: step.status,
          startedAt: step.startedAt,
          endedAt: step.endedAt,
        },
      })
    }

    for (const file of result.files) {
      await prisma.jobOutputFile.create({
        data: {
          jobId,
          fileName: file.fileName,
          blobUrl: `/api/files/preview/${jobId}/${encodeURIComponent(file.fileName)}`,
          blobPathname: '',
          mimeType: file.mimeType,
          sizeBytes: file.buffer.length,
          previewJson: file.previewRows ? JSON.stringify(file.previewRows) : null,
        },
      })
    }

    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        summaryMessage: result.summaryMessage,
        completedAt,
        durationMs,
      },
    })

    if (!opts.isSandbox) {
      await prisma.agent.update({
        where: { id: opts.agentId },
        data: {
          runCount: { increment: 1 },
          lastRunAt: completedAt,
        },
      })
    }

    return jobId
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage,
        completedAt: new Date(),
      },
    })
    throw err
  }
}
