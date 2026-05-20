/* ------------------------------------------------------------------ */
/*  Agent run-policy engine                                            */
/* ------------------------------------------------------------------ */

type RunDecision =
  | { allowed: true; mode: 'execute' | 'redirect' | 'simulate' }
  | { allowed: false; code: string }

export function canRun(
  agent: {
    status: string
    publishedVersionId: string | null
    runtimeType: string
    demoRunnable: boolean
    dataClassification: string
  },
  user: { role: string },
): RunDecision {
  if (agent.status !== 'PUBLISHED')
    return { allowed: false, code: 'AGENT_NOT_RUNNABLE' }

  if (!agent.publishedVersionId)
    return { allowed: false, code: 'AGENT_NOT_RUNNABLE' }

  if (agent.runtimeType === 'STREAMLIT_HOST' || agent.runtimeType === 'BI_CONNECTOR')
    return { allowed: true, mode: 'redirect' }

  if (!agent.demoRunnable)
    return { allowed: false, code: 'AGENT_LOCKED' }

  if (
    agent.dataClassification === 'INTERNAL' ||
    agent.dataClassification === 'RESTRICTED'
  ) {
    if (user.role !== 'ADMIN')
      return { allowed: false, code: 'RUN_POLICY_DENIED' }
  }

  if (agent.runtimeType === 'WINDOWS_WORKER')
    return { allowed: true, mode: 'simulate' }

  return { allowed: true, mode: 'execute' }
}
