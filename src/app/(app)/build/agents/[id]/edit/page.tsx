"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Save, Play, SendHorizonal, Loader2, Bot,
  CheckCircle2, Clock, XCircle, AlertCircle, FileText,
  Sparkles, Workflow, Code2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type FormField = {
  key: string
  label: string
  type: "string" | "enum" | "text" | "number"
  required?: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string
}

type AgentData = {
  id: string
  name: string
  slug: string
  description: string
  buildTier: string
  status: string
  agentGroup: string
  templateId: string | null
  workflowJson: string | null
  config?: Record<string, string>
  formSchema?: FormField[]
  yamlDefinition?: string
  updatedAt: string
}

type TestResult = {
  jobId: string
  status: string
  summaryMessage: string | null
  steps: { label: string; status: string }[]
  durationMs: number | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; message: string }> = {
  DRAFT: {
    label: "초안",
    color: "bg-gray-50 text-gray-600 border-gray-200",
    icon: FileText,
    message: "초안 상태입니다. 설정을 완료하고 승인을 요청하세요.",
  },
  PENDING_APPROVAL: {
    label: "승인 대기",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    message: "승인 대기 중입니다. 승인자의 검토를 기다려 주세요.",
  },
  PUBLISHED: {
    label: "게시됨",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    message: "승인되어 마켓플레이스에 게시되었습니다.",
  },
  REJECTED: {
    label: "반려됨",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
    message: "승인이 반려되었습니다. 수정 후 다시 제출하세요.",
  },
  ARCHIVED: {
    label: "보관됨",
    color: "bg-gray-50 text-gray-400 border-gray-200",
    icon: AlertCircle,
    message: "보관 처리된 Agent입니다.",
  },
}

const TIER_ICON: Record<string, React.ElementType> = {
  NOCODE: Sparkles,
  LOWCODE: Workflow,
  PROCODE: Code2,
}

const TIER_LABELS: Record<string, string> = {
  NOCODE: "노코드",
  LOWCODE: "로우코드",
  PROCODE: "프로코드",
}

export default function AgentEditPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [submittingApproval, setSubmittingApproval] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showTestDialog, setShowTestDialog] = useState(false)

  // Editable state
  const [name, setName] = useState("")
  const [config, setConfig] = useState<Record<string, string>>({})
  const [workflowJson, setWorkflowJson] = useState("")
  const [yamlDefinition, setYamlDefinition] = useState("")
  const [description, setDescription] = useState("")

  const fetchAgent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${agentId}`)
      const json = await res.json()
      if (json.data) {
        const a = json.data
        setAgent(a)
        setName(a.name)
        setDescription(a.description || "")
        setConfig(a.config || {})
        setWorkflowJson(a.workflowJson || "")
        setYamlDefinition(a.yamlDefinition || "")
      }
    } catch {
      toast.error("에이전트를 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name, description }

      if (agent?.buildTier === "NOCODE") {
        body.config = config
      } else if (agent?.buildTier === "LOWCODE") {
        body.workflowJson = workflowJson
      } else if (agent?.buildTier === "PROCODE") {
        body.yamlDefinition = yamlDefinition
        body.description = description
      }

      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error?.message || "저장에 실패했습니다")
        return
      }

      toast.success("저장되었습니다")
      await fetchAgent()
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setShowTestDialog(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message || "테스트 실행에 실패했습니다")
        setShowTestDialog(false)
        return
      }

      setTestResult(json.data)
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
      setShowTestDialog(false)
    } finally {
      setTesting(false)
    }
  }

  const handleSubmitApproval = async () => {
    setSubmittingApproval(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message || "승인 요청에 실패했습니다")
        return
      }

      toast.success("승인 요청이 제출되었습니다")
      await fetchAgent()
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setSubmittingApproval(false)
    }
  }

  const canSubmitApproval = agent?.status === "DRAFT" || agent?.status === "REJECTED"
  const statusConfig = agent ? STATUS_CONFIG[agent.status] || STATUS_CONFIG.DRAFT : STATUS_CONFIG.DRAFT
  const StatusIcon = statusConfig.icon
  const TierIcon = agent ? TIER_ICON[agent.buildTier] || Bot : Bot

  if (loading) {
    return (
      <>
        <PageHeader title="에이전트 로딩 중..." />
        <PageContent>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </>
    )
  }

  if (!agent) {
    return (
      <>
        <PageHeader title="에이전트를 찾을 수 없습니다" />
        <PageContent>
          <div className="flex flex-col items-center py-20">
            <Bot className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">요청한 에이전트가 존재하지 않습니다</p>
            <Button variant="outline" onClick={() => router.push("/build")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              빌드 허브로 돌아가기
            </Button>
          </div>
        </PageContent>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Agent 편집" description={agent.name}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/build")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          빌드 허브
        </Button>
      </PageHeader>
      <PageContent>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Status banner */}
          <Card className={cn("border shadow-sm", statusConfig.color)}>
            <CardContent className="p-4 flex items-center gap-3">
              <StatusIcon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{statusConfig.message}</p>
              </div>
              <Badge variant="outline" className={cn("text-xs gap-1", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </CardContent>
          </Card>

          {/* Agent info card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-hansae-navy/10 flex items-center justify-center">
                  <TierIcon className="w-6 h-6 text-hansae-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{agent.name}</h2>
                    <Badge variant="outline" className="text-[10px]">
                      {TIER_LABELS[agent.buildTier] || agent.buildTier}
                    </Badge>
                  </div>
                  <code className="text-xs text-gray-400">{agent.slug}</code>
                </div>
              </div>

              {/* Name edit */}
              <div className="space-y-5">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                    Agent 이름
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-desc" className="text-sm font-medium text-gray-700">
                    설명
                  </Label>
                  <Textarea
                    id="edit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Agent의 역할과 기능을 설명하세요"
                    className="mt-1.5 min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier-specific editor */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TierIcon className="w-4 h-4" />
                {agent.buildTier === "NOCODE" && "템플릿 설정"}
                {agent.buildTier === "LOWCODE" && "워크플로 정의"}
                {agent.buildTier === "PROCODE" && "YAML 정의"}
              </h3>

              {/* NOCODE: form fields */}
              {agent.buildTier === "NOCODE" && agent.formSchema && (
                <div className="space-y-5">
                  {agent.formSchema.map((field) => (
                    <div key={field.key}>
                      <Label className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-hansae-red ml-0.5">*</span>
                        )}
                      </Label>
                      {field.type === "enum" && field.options ? (
                        <Select
                          value={config[field.key] || ""}
                          onValueChange={(v) => updateConfig(field.key, v ?? "")}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue
                              placeholder={field.placeholder || `${field.label} 선택`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={config[field.key] || ""}
                          onChange={(e) => updateConfig(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="mt-1.5"
                          type={field.type === "number" ? "number" : "text"}
                        />
                      )}
                    </div>
                  ))}

                  {(!agent.formSchema || agent.formSchema.length === 0) && (
                    <div className="text-center py-8 text-sm text-gray-400">
                      이 템플릿에는 추가 설정이 없습니다
                    </div>
                  )}
                </div>
              )}

              {/* NOCODE without formSchema */}
              {agent.buildTier === "NOCODE" && !agent.formSchema && (
                <div className="text-center py-8 text-sm text-gray-400">
                  템플릿 설정 정보를 불러올 수 없습니다
                </div>
              )}

              {/* LOWCODE: workflow JSON editor */}
              {agent.buildTier === "LOWCODE" && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    워크플로 JSON을 직접 편집할 수 있습니다. 향후 비주얼 에디터가 제공될 예정입니다.
                  </p>
                  <Textarea
                    value={workflowJson}
                    onChange={(e) => setWorkflowJson(e.target.value)}
                    placeholder='{"version":"1.0","nodes":[],"entryNodeId":""}'
                    className="font-mono text-xs min-h-[300px] bg-gray-50"
                  />
                </div>
              )}

              {/* PROCODE: yaml editor */}
              {agent.buildTier === "PROCODE" && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    YAML 정의 파일을 직접 편집하세요. executor 설정, 입출력 스키마 등을 포함합니다.
                  </p>
                  <Textarea
                    value={yamlDefinition}
                    onChange={(e) => setYamlDefinition(e.target.value)}
                    placeholder="name: my-agent&#10;executor: python3&#10;inputs:&#10;  - key: query&#10;    type: text"
                    className="font-mono text-xs min-h-[300px] bg-gray-50"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 hansae-gradient hover:opacity-90"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing}
                    className="gap-2"
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {testing ? "테스트 중..." : "테스트"}
                  </Button>
                </div>

                {canSubmitApproval && (
                  <Button
                    onClick={handleSubmitApproval}
                    disabled={submittingApproval}
                    variant="outline"
                    className="gap-2 border-hansae-navy text-hansae-navy hover:bg-hansae-navy hover:text-white"
                  >
                    {submittingApproval ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="w-4 h-4" />
                    )}
                    {submittingApproval ? "제출 중..." : "승인 요청"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test result dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                샌드박스 테스트 결과
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {testing ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-teams-purple mb-3" />
                  <p className="text-sm text-gray-500">테스트 실행 중...</p>
                </div>
              ) : testResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        testResult.status === "COMPLETED" && "bg-green-50 text-green-700 border-green-200",
                        testResult.status === "FAILED" && "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {testResult.status === "COMPLETED" ? "성공" : testResult.status === "FAILED" ? "실패" : testResult.status}
                    </Badge>
                    {testResult.durationMs && (
                      <span className="text-xs text-gray-400">
                        {(testResult.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>

                  {testResult.steps.length > 0 && (
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {testResult.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          {step.status === "done" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : step.status === "failed" ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                          <span className={cn(
                            "text-xs",
                            step.status === "done" && "text-gray-700",
                            step.status === "failed" && "text-red-600"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {testResult.summaryMessage && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                      {testResult.summaryMessage}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">결과 없음</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  )
}
