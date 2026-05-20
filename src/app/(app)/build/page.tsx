"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Hammer, Sparkles, Code2, Workflow, Upload, FileCode2,
  ArrowRight, Bot, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Template = {
  id: string
  name: string
  description: string
  agentGroup: string
}

type MyAgent = {
  id: string
  name: string
  slug: string
  buildTier: string
  status: string
  updatedAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "초안", color: "bg-gray-50 text-gray-600 border-gray-200", icon: FileText },
  PENDING_APPROVAL: { label: "승인 대기", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  PUBLISHED: { label: "게시됨", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  REJECTED: { label: "반려됨", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  ARCHIVED: { label: "보관됨", color: "bg-gray-50 text-gray-400 border-gray-200", icon: AlertCircle },
}

const TIER_LABELS: Record<string, string> = {
  NOCODE: "노코드",
  LOWCODE: "로우코드",
  PROCODE: "프로코드",
}

export default function BuildHubPage() {
  const { user } = useAuthContext()
  const [templates, setTemplates] = useState<Template[]>([])
  const [myAgents, setMyAgents] = useState<MyAgent[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [uploadDragActive, setUploadDragActive] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchMyAgents()
  }, [])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch("/api/templates")
      const json = await res.json()
      if (json.data) setTemplates(json.data.items ?? json.data)
    } catch {
      toast.error("템플릿을 불러올 수 없습니다")
    } finally {
      setLoadingTemplates(false)
    }
  }

  const fetchMyAgents = async () => {
    setLoadingAgents(true)
    try {
      const res = await fetch("/api/agents/mine")
      const json = await res.json()
      if (json.data) setMyAgents(json.data.items ?? json.data)
    } catch {
      toast.error("내 에이전트를 불러올 수 없습니다")
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setUploadDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      toast.info(`${files.length}개 파일 선택됨 - 업로드 준비 중...`)
    }
  }

  return (
    <>
      <PageHeader
        title="빌드 허브"
        description="Agent를 만들고 관리하세요"
      >
        <Badge variant="outline" className="text-xs gap-1">
          <Hammer className="w-3 h-3" />
          {user?.role}
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Build tier tabs */}
          <Tabs defaultValue="nocode" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 h-11">
              <TabsTrigger value="nocode" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                노코드
              </TabsTrigger>
              <TabsTrigger value="lowcode" className="gap-1.5 text-xs">
                <Workflow className="w-3.5 h-3.5" />
                로우코드
              </TabsTrigger>
              <TabsTrigger value="procode" className="gap-1.5 text-xs">
                <Code2 className="w-3.5 h-3.5" />
                프로코드
              </TabsTrigger>
            </TabsList>

            {/* Nocode Tab */}
            <TabsContent value="nocode" className="mt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  템플릿으로 시작하기
                </h3>
                <p className="text-xs text-gray-500">
                  사전 구성된 템플릿을 선택하고 설정만 입력하면 바로 Agent가 생성됩니다.
                </p>
              </div>

              {loadingTemplates ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center py-12 bg-gray-50 rounded-xl">
                  <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">사용 가능한 템플릿이 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <Card
                      key={tpl.id}
                      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group"
                    >
                      <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-hansae-navy transition-colors">
                          {tpl.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                          {tpl.description}
                        </p>
                        <Link href={`/build/templates/${tpl.id}`}>
                          <Button className="w-full h-9 text-xs gap-1.5 hansae-gradient hover:opacity-90">
                            <Plus className="w-3.5 h-3.5" />
                            만들기
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Lowcode Tab */}
            <TabsContent value="lowcode" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                    <Workflow className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    워크플로 에디터
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                    드래그 앤 드롭 방식으로 노드를 연결하여 Agent 워크플로를 시각적으로 구성하세요.
                    입력 파싱, 데이터 변환, API 호출, 조건 분기 등의 노드를 지원합니다.
                  </p>
                  <Link href="/build/workflow-editor">
                    <Button className="h-10 px-6 gap-2 teams-gradient hover:opacity-90">
                      <Workflow className="w-4 h-4" />
                      워크플로 에디터로 시작
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Procode Tab */}
            <TabsContent value="procode" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Code2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        코드 직접 업로드
                      </h3>
                      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        YAML 정의 파일과 실행 코드(zip)를 직접 업로드하세요.
                        Python, Node.js 런타임을 지원하며, 커스텀 executor를 등록할 수 있습니다.
                      </p>

                      {/* Upload zone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          setUploadDragActive(true)
                        }}
                        onDragLeave={() => setUploadDragActive(false)}
                        onDrop={handleFileDrop}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                          uploadDragActive
                            ? "border-emerald-400 bg-emerald-50/50"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                        )}
                      >
                        <Upload className={cn(
                          "w-8 h-8 mx-auto mb-3 transition-colors",
                          uploadDragActive ? "text-emerald-500" : "text-gray-400"
                        )} />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          파일을 드래그하거나 클릭하여 업로드
                        </p>
                        <p className="text-xs text-gray-400">
                          .yaml 정의 파일 + .zip 코드 패키지
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <Badge variant="outline" className="text-[10px]">
                            <FileCode2 className="w-3 h-3 mr-1" />
                            .yaml
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            <FileCode2 className="w-3 h-3 mr-1" />
                            .zip
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button className="h-9 px-5 gap-2" disabled>
                          <Upload className="w-4 h-4" />
                          업로드
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* My agents section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">내 Agent</h2>
                <p className="text-xs text-gray-500 mt-0.5">내가 만든 Agent의 현황을 확인하세요</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {myAgents.length}개
              </Badge>
            </div>

            {loadingAgents ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-1.5" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : myAgents.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-1">아직 만든 Agent가 없습니다</p>
                  <p className="text-xs text-gray-400">위 탭에서 새 Agent를 만들어 보세요</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {myAgents.map((agent) => {
                      const sc = STATUS_CONFIG[agent.status] || STATUS_CONFIG.DRAFT
                      const StatusIcon = sc.icon
                      return (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-hansae-navy/10 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-hansae-navy" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {agent.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                                  {agent.slug}
                                </code>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {TIER_LABELS[agent.buildTier] || agent.buildTier}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] gap-1", sc.color)}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </Badge>
                            <span className="text-[10px] text-gray-400 w-24 text-right">
                              {new Date(agent.updatedAt).toLocaleDateString("ko-KR")}
                            </span>
                            <Link href={`/build/agents/${agent.id}/edit`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                편집
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContent>
    </>
  )
}
