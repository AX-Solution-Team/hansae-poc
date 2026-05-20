/* ------------------------------------------------------------------ */
/*  Job runner — creates, executes, and records job lifecycle          */
/* ------------------------------------------------------------------ */

import { prisma } from '@/lib/db'
import { resolveExecutor, ExecutorContext } from '@/lib/executors/registry'
import * as fs from 'fs'
import * as path from 'path'

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'job-files')

/**
 * Run a job end-to-end:
 * 1. Create Job record (QUEUED)
 * 2. Update to RUNNING
 * 3. Resolve executor and execute
 * 4. Create JobStep records
 * 5. Create JobOutputFile records (store files to disk)
 * 6. Update Job to COMPLETED
 * 7. Increment Agent.runCount (unless sandbox)
 * 8. On error → FAILED
 */
export async function runJob(opts: {
  agentId: string
  userId: string
  params: Record<string, unknown>
  isSandbox?: boolean
  chatSessionId?: string
  orchestratorRaw?: string
}): Promise<string> {
  // Step 1: Create Job record (QUEUED)
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
    // Step 2: Update to RUNNING
    const startedAt = new Date()
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt },
    })

    // Fetch agent details
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

    // Step 3: Resolve executor
    const executorFn = resolveExecutor(agent)

    // Collect steps during execution
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

    // Execute
    const result = await executorFn(ctx)

    // Step 4: Create JobStep records
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

    // Step 5: Create JobOutputFile records & persist files
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
    }

    for (const file of result.files) {
      const fileId = `${jobId}_${file.fileName}`
      const filePath = path.join(STORAGE_DIR, `${fileId}.bin`)

      fs.writeFileSync(filePath, file.buffer)

      await prisma.jobOutputFile.create({
        data: {
          jobId,
          fileName: file.fileName,
          blobUrl: `/api/jobs/${jobId}/files/${encodeURIComponent(file.fileName)}`,
          blobPathname: filePath,
          mimeType: file.mimeType,
          sizeBytes: file.buffer.length,
          previewJson: file.previewRows ? JSON.stringify(file.previewRows) : null,
        },
      })
    }

    // Step 6: Update Job to COMPLETED
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

    // Step 7: Update Agent.runCount (unless sandbox)
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
    // Step 8: On error → FAILED
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
