"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2
} from "lucide-react"
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

type TemplateDetail = {
  id: string
  name: string
  description: string
  agentGroup: string
  formSchema: FormField[]
}

export default function NocodeWizardPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [config, setConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  const fetchTemplate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/templates/${templateId}`)
      const json = await res.json()
      if (json.data) {
        const tpl = json.data
        setTemplate(tpl)
        // Initialize defaults
        const defaults: Record<string, string> = {}
        if (tpl.formSchema) {
          tpl.formSchema.forEach((field: FormField) => {
            if (field.defaultValue) defaults[field.key] = field.defaultValue
          })
        }
        setConfig(defaults)
      }
    } catch {
      toast.error("템플릿을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!agentName.trim()) {
      toast.error("Agent 이름을 입력해주세요")
      return
    }

    // Validate required fields
    if (template?.formSchema) {
      for (const field of template.formSchema) {
        if (field.required && !config[field.key]?.trim()) {
          toast.error(`${field.label} 필드를 입력해주세요`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildTier: "NOCODE",
          templateId,
          name: agentName.trim(),
          config,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message || "Agent 생성에 실패했습니다")
        return
      }

      toast.success("Agent가 성공적으로 생성되었습니다")
      const newAgentId = json.data?.id || json.data?.agent?.id
      if (newAgentId) {
        router.push(`/build/agents/${newAgentId}/edit`)
      } else {
        router.push("/build")
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="템플릿 로딩 중..." />
        <PageContent>
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <Skeleton className="h-8 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-6" />
                <div className="space-y-5">
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

  if (!template) {
    return (
      <>
        <PageHeader title="템플릿을 찾을 수 없습니다" />
        <PageContent>
          <div className="flex flex-col items-center py-20">
            <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">요청한 템플릿이 존재하지 않습니다</p>
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
      <PageHeader
        title="노코드 Agent 만들기"
        description={template.name}
      >
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
        <div className="max-w-2xl mx-auto">
          {/* Template info */}
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{template.name}</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Agent 설정</h3>

              <div className="space-y-5">
                {/* Required: Agent name */}
                <div>
                  <Label htmlFor="agent-name" className="text-sm font-medium text-gray-700">
                    Agent 이름 <span className="text-hansae-red">*</span>
                  </Label>
                  <Input
                    id="agent-name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="예: Target PO 오더리캡 Agent"
                    className="mt-1.5"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Agent를 식별하는 고유한 이름을 입력하세요
                  </p>
                </div>

                {/* Dynamic fields from formSchema */}
                {template.formSchema?.map((field) => (
                  <div key={field.key}>
                    <Label
                      htmlFor={field.key}
                      className="text-sm font-medium text-gray-700"
                    >
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
                    ) : field.type === "number" ? (
                      <Input
                        id={field.key}
                        type="number"
                        value={config[field.key] || ""}
                        onChange={(e) => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1.5"
                      />
                    ) : (
                      <Input
                        id={field.key}
                        value={config[field.key] || ""}
                        onChange={(e) => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1.5"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => router.push("/build")}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !agentName.trim()}
                  className="gap-2 hansae-gradient hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Agent 생성
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  )
}
