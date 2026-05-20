"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SecurityBadge } from "@/components/shared/security-badge"
import { AgentGroupIcon } from "@/components/shared/agent-group-icon"
import { PageContent } from "@/components/layout/app-shell"
import {
  ArrowLeft, Play, GitFork,
  BarChart3, Lock, Building2, ArrowRightLeft, Workflow,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type AgentDetail = {
  id: string
  slug: string
  name: string
  description: string
  agentGroup: string
  buildTier: string
  runtimeType: string
  dataClassification: string
  tags: string[]
  demoRunnable: boolean
  lockedReason: string | null
  runCount: number
  lastRunAt: string | null
  owner: { displayName: string }
  department: string | null
  asIsSummary: string | null
  toBeSummary: string | null
  workflowMd: string | null
  inputsSchema: { name: string; label: string; type: string; required: boolean }[]
  outputsSchema: { name: string; type: string }[]
  versions: { version: string; createdAt: string; status: string }[]
  isFavorite: boolean
}

export default function MarketplaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.slug) return
    fetch(`/api/marketplace/${params.slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setAgent(json.data)
      })
      .catch(() => toast.error("Agent를 불러올 수 없습니다"))
      .finally(() => setLoading(false))
  }, [params.slug])

  const handleFork = async () => {
    if (!agent) return
    try {
      const res = await fetch(`/api/agents/${agent.id}/fork`, { method: "POST" })
      const json = await res.json()
      if (res.ok) {
        toast.success("Agent가 복제되었습니다")
        router.push(`/build/agents/${json.data.agent.id}/edit`)
      } else {
        toast.error(json.error?.message || "복제에 실패했습니다")
      }
    } catch {
      toast.error("오류가 발생했습니다")
    }
  }

  if (loading) {
    return (
      <PageContent>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </PageContent>
    )
  }

  if (!agent) {
    return (
      <PageContent>
        <div className="text-center py-20">
          <p className="text-gray-500">Agent를 찾을 수 없습니다</p>
        </div>
      </PageContent>
    )
  }

  const workflowSteps = agent.workflowMd?.split("\n").filter(Boolean) || []

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          마켓플레이스로 돌아가기
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <AgentGroupIcon group={agent.agentGroup} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                <SecurityBadge classification={agent.dataClassification} size="md" />
              </div>
              <p className="text-sm text-gray-600 max-w-xl">{agent.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span>담당: {agent.department || agent.owner.displayName}</span>
                <span>빌드: {agent.buildTier}</span>
                <span>실행 {agent.runCount}회</span>
                {agent.lastRunAt && (
                  <span>마지막 실행: {new Date(agent.lastRunAt).toLocaleDateString("ko-KR")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFork} className="gap-1.5">
              <GitFork className="w-4 h-4" />
              복제
            </Button>
            {agent.demoRunnable ? (
              <Link href={`/apps/${agent.slug}`}>
                <Button className="gap-1.5 bg-hansae-navy hover:bg-hansae-navy-light">
                  <Play className="w-4 h-4" /> 실행하기
                </Button>
              </Link>
            ) : (
              <Button disabled className="gap-1.5">
                <Lock className="w-4 h-4" />
                {agent.lockedReason || "실행 불가"}
              </Button>
            )}
          </div>
        </div>

        {agent.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {agent.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <PageContent>
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="workflow" className="space-y-6">
            <TabsList>
              <TabsTrigger value="workflow">워크플로</TabsTrigger>
              <TabsTrigger value="schema">입출력 스키마</TabsTrigger>
              <TabsTrigger value="versions">버전 이력</TabsTrigger>
            </TabsList>

            <TabsContent value="workflow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* As-Is / To-Be */}
                {agent.asIsSummary && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        As-Is (현재)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {agent.asIsSummary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {agent.toBeSummary && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-green-50 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        To-Be (플랫폼)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {agent.toBeSummary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Workflow steps */}
                {workflowSteps.length > 0 && (
                  <Card className="border-0 shadow-sm md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center">
                          <Workflow className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        현업 워크플로
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {workflowSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-hansae-navy/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-hansae-navy">
                                {i + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Department */}
                {agent.department && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        담당 부서
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium text-gray-700">{agent.department}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Stats */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      실행 통계
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{agent.runCount}</p>
                        <p className="text-xs text-gray-500">총 실행 횟수</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {agent.lastRunAt
                            ? new Date(agent.lastRunAt).toLocaleDateString("ko-KR")
                            : "—"}
                        </p>
                        <p className="text-xs text-gray-500">마지막 실행</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schema">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">입력 (Inputs)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agent.inputsSchema.length === 0 ? (
                      <p className="text-sm text-gray-500">입력 파라미터 없음</p>
                    ) : (
                      <div className="space-y-3">
                        {agent.inputsSchema.map((field) => (
                          <div key={field.name} className="flex items-start justify-between p-3 rounded-lg bg-gray-50">
                            <div>
                              <p className="text-sm font-medium">{field.label}</p>
                              <p className="text-xs text-gray-500">{field.name}: {field.type}</p>
                            </div>
                            {field.required && (
                              <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">필수</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">출력 (Outputs)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agent.outputsSchema.length === 0 ? (
                      <p className="text-sm text-gray-500">출력 정의 없음</p>
                    ) : (
                      <div className="space-y-3">
                        {agent.outputsSchema.map((field) => (
                          <div key={field.name} className="p-3 rounded-lg bg-gray-50">
                            <p className="text-sm font-medium">{field.name}</p>
                            <p className="text-xs text-gray-500">type: {field.type}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="versions">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {agent.versions.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                        버전 이력이 없습니다
                      </div>
                    ) : (
                      agent.versions.map((v) => (
                        <div key={v.version} className="flex items-center justify-between px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              v{v.version}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(v.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              v.status === "PUBLISHED" && "bg-green-50 text-green-700",
                              v.status === "DRAFT" && "bg-gray-50 text-gray-600"
                            )}
                            variant="outline"
                          >
                            {v.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </>
  )
}
