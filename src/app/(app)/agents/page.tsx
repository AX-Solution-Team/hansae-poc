"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { AgentGroupIcon, AGENT_GROUPS } from "@/components/shared/agent-group-icon"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Bot, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type GroupData = {
  group: string
  total: number
  runnable: number
}

export default function AgentCatalogPage() {
  const [groups, setGroups] = useState<GroupData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/agents/groups")
      const json = await res.json()
      if (json.data) setGroups(json.data.groups)
    } catch {
      toast.error("에이전트 그룹을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  const allGroupKeys = Object.keys(AGENT_GROUPS)

  return (
    <>
      <PageHeader
        title="에이전트 카탈로그"
        description="업무 영역별 AI Agent를 탐색하세요"
      >
        <Badge variant="outline" className="text-xs">
          {allGroupKeys.length}개 그룹
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <Skeleton className="w-14 h-14 rounded-xl mb-4" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {allGroupKeys.map((groupKey) => {
                const config = AGENT_GROUPS[groupKey]
                const data = groups.find((g) => g.group === groupKey)
                const total = data?.total ?? 0
                const runnable = data?.runnable ?? 0

                return (
                  <Link key={groupKey} href={`/agents/${groupKey}`}>
                    <Card
                      className={cn(
                        "border-0 shadow-sm cursor-pointer group relative overflow-hidden",
                        "hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                      )}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(to right, ${
                            ({
                              "bg-blue-50": "#3b82f6",
                              "bg-amber-50": "#f59e0b",
                              "bg-emerald-50": "#10b981",
                              "bg-purple-50": "#8b5cf6",
                              "bg-red-50": "#ef4444",
                              "bg-indigo-50": "#6366f1",
                              "bg-orange-50": "#f97316",
                            } as Record<string, string>)[config.bgColor] ?? "#6b7280"
                          }, transparent)`,
                        }}
                      />
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <AgentGroupIcon group={groupKey} size="lg" />
                          <ArrowRight
                            className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-200"
                          />
                        </div>

                        <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-hansae-navy transition-colors">
                          {config.label}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                          {config.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">
                              {total}개 등록
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Play className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">
                              {runnable}개 실행 가능
                            </span>
                          </div>
                        </div>

                        {/* Example prompt */}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2.5 text-xs text-gray-600 italic",
                            config.bgColor,
                            "bg-opacity-50"
                          )}
                        >
                          &ldquo;{config.examplePrompt}&rdquo;
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Empty state (unlikely but safe) */}
          {!loading && allGroupKeys.length === 0 && (
            <div className="flex flex-col items-center py-20">
              <Bot className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">등록된 에이전트 그룹이 없습니다</p>
            </div>
          )}
        </div>
      </PageContent>
    </>
  )
}
