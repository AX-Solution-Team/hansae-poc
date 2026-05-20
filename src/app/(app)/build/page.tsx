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
  Hammer, Sparkles, Code2, Workflow, Upload,
  ArrowRight, ArrowLeft, Bot, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, Plus, Send, Link2, Terminal, Wand2,
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

type ViewMode = "hub" | "studio" | "developer"

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

const MOCK_KB_FILES = [
  { name: "2026_Exchange_Rate.xlsx", updatedAt: "2시간 전", size: "12.4KB" },
  { name: "Gap_Buyer_Template_v2.xlsx", updatedAt: "어제", size: "45.8KB" },
]

const MOCK_CHAT = [
  { role: "bot", content: "안녕하세요! 수정한 로직으로 테스트를 시작합니다. PO 파일을 업로드해 주세요." },
  { role: "user", content: "신규 PO 3건 업로드할게. Gap 양식으로 변환해줘." },
  { role: "bot", content: "네, Gap 양식에 맞춰 분석을 완료했습니다.\n[결과] Gap_OrderRecap_0519.xlsx" },
]

const LEGACY_TOOLS = [
  { name: "Target PO 오더리캡 v1.0", tech: "pdfplumber, openpyxl", status: "connected" },
  { name: "ZARA 트렌드 크롤러", tech: "Selenium, BS4", status: "connected" },
  { name: "재고 분석 대시보드", tech: "Pandas, Plotly", status: "waiting" },
]

const CODE_LINES = [
  { type: "keyword", text: "import" },
  { type: "plain", text: " hansae_sdk " },
  { type: "keyword", text: "as" },
  { type: "plain", text: " hs" },
  { type: "break" },
  { type: "keyword", text: "from" },
  { type: "plain", text: " legacy_tools " },
  { type: "keyword", text: "import" },
  { type: "plain", text: " po_parser" },
  { type: "break" },
  { type: "break" },
  { type: "comment", text: "# 1. 기존 Python 로직 로드 (pdfplumber 기반)" },
  { type: "break" },
  { type: "keyword", text: "def" },
  { type: "function", text: " process_po" },
  { type: "plain", text: "(pdf_file):" },
  { type: "break" },
  { type: "plain", text: "    raw_data = po_parser." },
  { type: "function", text: "extract" },
  { type: "plain", text: "(pdf_file)" },
  { type: "break" },
  { type: "break" },
  { type: "comment", text: "    # 2. LLM을 통한 지능형 검증 단계 추가" },
  { type: "break" },
  { type: "plain", text: "    agent = hs." },
  { type: "function", text: "Agent" },
  { type: "plain", text: "(model=" },
  { type: "string", text: '"gpt-4o"' },
  { type: "plain", text: ")" },
  { type: "break" },
  { type: "plain", text: "    refined_data = agent." },
  { type: "function", text: "reason" },
  { type: "plain", text: "(" },
  { type: "break" },
  { type: "plain", text: "        prompt=" },
  { type: "string", text: '"추출된 데이터 중 바이어 특이사항을 분석해줘"' },
  { type: "plain", text: "," },
  { type: "break" },
  { type: "plain", text: "        context=raw_data" },
  { type: "break" },
  { type: "plain", text: "    )" },
  { type: "break" },
  { type: "break" },
  { type: "keyword", text: "    return" },
  { type: "plain", text: " refined_data" },
]

const CODE_COLOR_MAP: Record<string, string> = {
  keyword: "text-[#569CD6]",
  string: "text-[#CE9178]",
  comment: "text-[#6A9955]",
  function: "text-[#DCDCAA]",
  plain: "text-[#D4D4D4]",
}

export default function BuildHubPage() {
  const { user } = useAuthContext()
  const [viewMode, setViewMode] = useState<ViewMode>("hub")
  const [activeTab, setActiveTab] = useState("nocode")
  const [templates, setTemplates] = useState<Template[]>([])
  const [myAgents, setMyAgents] = useState<MyAgent[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingAgents, setLoadingAgents] = useState(true)

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

  if (viewMode === "studio") {
    return <StudioView onBack={() => setViewMode("hub")} />
  }
  if (viewMode === "developer") {
    return <DeveloperView onBack={() => setViewMode("hub")} />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2 h-11">
              <TabsTrigger value="nocode" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                노코드
              </TabsTrigger>
              <TabsTrigger value="procode" className="gap-1.5 text-xs">
                <Code2 className="w-3.5 h-3.5" />
                프로코드
              </TabsTrigger>
            </TabsList>

            {/* Nocode Tab */}
            <TabsContent value="nocode" className="mt-6">
              <Card
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-6 bg-gradient-to-r from-purple-50/50 to-indigo-50/50"
                onClick={() => setViewMode("studio")}
              >
                <CardContent className="p-5 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Wand2 className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-0.5">자연어로 Agent 빌드</h4>
                    <p className="text-xs text-gray-500">프롬프트와 지식 데이터만으로 Agent를 만들고 즉시 테스트하세요</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>

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
              <Card
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setViewMode("developer")}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Code2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Python 기반 전문 Agent 개발
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                        기존 Python 자동화 툴을 플랫폼에 이식하고 LLM을 결합합니다.
                        코드 에디터, SDK 연동, 레거시 툴 온보딩 도구를 제공합니다.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button className="h-10 px-6 gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <Terminal className="w-4 h-4" />
                          개발자 도구 열기
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-gray-400">Python 3.11 | Hansae SDK v1.2</span>
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

function StudioView({ onBack }: { onBack: () => void }) {
  const [systemPrompt, setSystemPrompt] = useState(
`# Role
너는 한세실업의 영업 지원 AI Agent야. PDF PO를 분석하여 표준 오더리캡을 생성해.

# Logic
1. 업로드된 PDF에서 Style, Color, Qty 정보를 추출해.
2. 결과물은 'Gap_Template.xlsx' 양식에 맞춰서 매핑해줘.
3. 금액은 원화(KRW)로 환산하여 표기해.`
  )
  const [testMessage, setTestMessage] = useState("")
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT)

  const handleSend = () => {
    if (!testMessage.trim()) return
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: testMessage },
      { role: "bot", content: "테스트 응답: 입력하신 내용을 분석하고 있습니다. 잠시만 기다려주세요..." },
    ])
    setTestMessage("")
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" /> 빌드 허브
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Agent 커스텀 Studio</h1>
              <p className="text-xs text-gray-500">프롬프트 수정과 데이터 업로드로 Agent를 최적화하세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v1.2.4 (Draft)</Badge>
            <Button className="bg-hansae-navy hover:bg-hansae-navy-light gap-1.5">
              배포하기
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto border-r border-gray-200 bg-white p-6 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">System Instructions</h2>
              <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI 추천 적용됨
              </span>
            </div>
            <div className="relative">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-[220px] p-4 rounded-lg border border-gray-200 bg-gray-50 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-hansae-navy/20 focus:border-hansae-navy"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                Tokens: {systemPrompt.length} / 128,000
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Knowledge Base (RAG)</h2>
            <div className="space-y-2">
              {MOCK_KB_FILES.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">최종 업데이트: {file.updatedAt} · {file.size}</p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]" variant="outline">
                    <Link2 className="w-3 h-3 mr-1" /> Connected
                  </Badge>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
              <Upload className="w-4 h-4" />
              새로운 지식 데이터 추가 (PDF, Excel, Docx)
            </button>
          </div>
        </div>

        <div className="w-[440px] flex flex-col bg-gray-50 flex-shrink-0">
          <div className="px-5 py-4 border-b border-gray-200 bg-white">
            <h2 className="text-sm font-bold text-gray-900">Preview & Test</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">수정 사항이 즉시 반영됩니다</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
                  msg.role === "bot"
                    ? "bg-white border border-gray-200 text-gray-800 mr-auto"
                    : "bg-hansae-navy text-white ml-auto"
                )}
              >
                {msg.content.includes("[결과]") ? (
                  <div>
                    <p className="mb-1">네, Gap 양식에 맞춰 분석을 완료했습니다.</p>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 border border-red-100">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-600">Gap_OrderRecap_0519.xlsx</span>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="테스트 메시지 입력..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-hansae-navy/20"
              />
              <Button
                size="sm"
                onClick={handleSend}
                className="bg-hansae-navy hover:bg-hansae-navy-light h-10 w-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
              <span>Studio Sandbox: Active</span>
              <span>Model: GPT-4o | Tokens: 1,240 / 128,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeveloperView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" /> 빌드 허브
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Python 기반 전문 Agent 개발</h1>
              <p className="text-xs text-gray-500">기존 Python 자동화 툴을 플랫폼에 이식하고 LLM을 결합합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Dev Mode</span>
            <Button className="bg-hansae-navy hover:bg-hansae-navy-light gap-1.5">
              Deploy Agent
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-[#1E1E1E] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
            <span className="text-xs text-[#D4D4D4] font-mono">main.py (Hansae Agent SDK)</span>
            <span className="text-xs text-[#6A9955] font-mono">UTF-8</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-sm leading-relaxed">
            {CODE_LINES.map((token, i) =>
              token.type === "break" ? (
                <br key={i} />
              ) : (
                <span key={i} className={CODE_COLOR_MAP[token.type] || "text-[#D4D4D4]"}>
                  {token.text}
                </span>
              )
            )}
          </div>
          <div className="mx-5 mb-4 p-3 rounded bg-[#252526] border border-[#333]">
            <p className="text-xs font-mono text-[#10B981]">&gt; SDK Build Success. Ready to Deploy.</p>
          </div>
        </div>

        <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col overflow-y-auto p-5 gap-4 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-200">
            Legacy Tools Onboarding
          </h2>

          {LEGACY_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className={cn(
                "p-4 rounded-lg border border-gray-200 bg-gray-50",
                tool.status === "waiting" && "opacity-50"
              )}
            >
              <p className="text-sm font-bold text-gray-900">{tool.name}</p>
              {tool.status === "connected" ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-semibold">Connected</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Waiting for SDK Integration...</p>
              )}
              <p className="text-[10px] text-gray-400 mt-2">Tech: {tool.tech}</p>
            </div>
          ))}

          <div className="mt-auto p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-hansae-navy flex items-center justify-center flex-shrink-0">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                기존 <strong>20개 툴</strong> 중 12개가 플랫폼 SDK 이식이 완료되었습니다. 전사 배포를 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Dev Environment: Python 3.11 | Hansae SDK v1.2
        </div>
        <span>Deployment Target: Hansae Cloud Agent Runtime</span>
      </div>
    </div>
  )
}
