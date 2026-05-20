"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { AgentGroupIcon, AGENT_GROUPS } from "@/components/shared/agent-group-icon"
import { SecurityBadge } from "@/components/shared/security-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft, Play, Lock, Bot } from "lucide-react"
import { toast } from "sonner"

type AgentRow = {
  id: string
  slug: string
  name: string
  description: string
  dataClassification: string
  demoRunnable: boolean
  lockedReason: string | null
  runCount: number
  status: string
  owner: { displayName: string }
}

export default function AgentGroupPage() {
  const params = useParams()
  const router = useRouter()
  const group = params.group as string
  const config = AGENT_GROUPS[group]

  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!group) return
    fetchAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/by-group/${group}`)
      const json = await res.json()
      if (json.data) setAgents(json.data.items ?? json.data)
    } catch {
      toast.error("에이전트 목록을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  if (!config) {
    return (
      <>
        <PageHeader title="알 수 없는 그룹" />
        <PageContent>
          <div className="flex flex-col items-center py-20">
            <Bot className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">존재하지 않는 에이전트 그룹입니다</p>
            <Button variant="outline" onClick={() => router.push("/agents")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              카탈로그로 돌아가기
            </Button>
          </div>
        </PageContent>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.description}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/agents")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          카탈로그
        </Button>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto">
          {/* Group header card */}
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-6 flex items-center gap-5">
              <AgentGroupIcon group={group} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{config.label}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
              </div>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {agents.length}개 Agent
              </Badge>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <Bot className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">이 그룹에 등록된 에이전트가 없습니다</p>
            </div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="font-semibold text-gray-700">Agent 이름</TableHead>
                      <TableHead className="font-semibold text-gray-700">슬러그</TableHead>
                      <TableHead className="font-semibold text-gray-700">데이터 등급</TableHead>
                      <TableHead className="font-semibold text-gray-700">상태</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">실행 횟수</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow
                        key={agent.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{agent.name}</p>
                            {agent.description && (
                              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-xs">
                                {agent.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {agent.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <SecurityBadge classification={agent.dataClassification} />
                        </TableCell>
                        <TableCell>
                          {agent.demoRunnable ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" variant="outline">
                              <Play className="w-3 h-3 mr-1" />
                              실행 가능
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]" variant="outline">
                              <Lock className="w-3 h-3 mr-1" />
                              잠금
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-600 font-medium tabular-nums">
                            {agent.runCount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {agent.demoRunnable ? (
                            <Link href={`/run?slug=${agent.slug}`}>
                              <Button size="sm" className="h-8 gap-1.5 text-xs hansae-gradient hover:opacity-90">
                                <Play className="w-3.5 h-3.5" />
                                실행
                              </Button>
                            </Link>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="h-8 gap-1.5 text-xs"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  잠금
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {agent.lockedReason || "현재 실행할 수 없습니다"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>
    </>
  )
}
