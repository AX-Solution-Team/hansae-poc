/* ------------------------------------------------------------------ */
/*  Shared TypeScript types for the Hansae prototype                   */
/* ------------------------------------------------------------------ */

/* ---------- Agent schema fields ----------------------------------- */

export interface InputField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'textarea'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  defaultValue?: string
}

export interface OutputField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'file' | 'table' | 'chart'
  format?: string
}

/* ---------- Agent summaries / detail ------------------------------ */

export interface AgentSummary {
  id: string
  slug: string
  name: string
  description: string
  agentGroup: string
  buildTier: string
  runtimeType: string
  dataClassification: string
  status: string
  demoRunnable: boolean
  tags: string[]
  department?: string | null
  runCount: number
  lastRunAt: string | null
  owner: { id: string; displayName: string }
  isFavorite?: boolean
}

export interface AgentDetail extends AgentSummary {
  inputsSchema: InputField[]
  outputsSchema: OutputField[]
  templateId: string | null
  workflowJson: string | null
  executorKey: string | null
  asIsSummary: string | null
  toBeSummary: string | null
  workflowMd: string | null
  lockedReason: string | null
  publishedVersionId: string | null
  forkedFromId: string | null
  teamId: string
  createdAt: string
  updatedAt: string
  versions?: AgentVersionSummary[]
}

export interface AgentVersionSummary {
  id: string
  version: string
  changelog: string | null
  status: string
  createdAt: string
}

/* ---------- API envelope ------------------------------------------ */

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: { field?: string; message: string }[]
  }
}

/* ---------- Job --------------------------------------------------- */

export interface JobSummary {
  id: string
  agentId: string
  agentName: string
  agentSlug: string
  status: string        // QUEUED | RUNNING | COMPLETED | FAILED
  inputParams: Record<string, unknown>
  summaryMessage: string | null
  errorMessage: string | null
  durationMs: number | null
  isSandbox: boolean
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  steps: JobStepSummary[]
  outputFiles: JobOutputFileSummary[]
}

export interface JobStepSummary {
  id: string
  seq: number
  label: string
  status: string      // PENDING | RUNNING | DONE | ERROR
  startedAt: string | null
  endedAt: string | null
}

export interface JobOutputFileSummary {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  blobUrl: string
  previewJson: Record<string, unknown>[] | null
}

/* ---------- Chat -------------------------------------------------- */

export interface ChatMessageType {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    agentSlug?: string
    jobId?: string
    orchestratorResult?: Record<string, unknown>
    files?: { fileName: string; url: string }[]
  } | null
  createdAt: string
}

/* ---------- Workflow definition (LOWCODE tier) -------------------- */

export interface WorkflowNode {
  id: string
  type: 'input' | 'transform' | 'api-call' | 'condition' | 'output'
  label: string
  config: Record<string, unknown>
  next?: string | { true: string; false: string }
}

export interface WorkflowDefinition {
  version: '1.0'
  nodes: WorkflowNode[]
  entryNodeId: string
}
