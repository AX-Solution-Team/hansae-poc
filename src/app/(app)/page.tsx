"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bot, Play, Store, Hammer, Clock, CheckCircle2,
  XCircle, ArrowRight, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

const ROLE_LEVELS: Record<string, number> = {
  USER: 0,
  CREATOR: 1,
  APPROVER: 2,
  ADMIN: 3,
}

type DashboardData = {
  publishedCount: number
  pendingApprovals: number
  recentJobs: {
    id: string
    agentName: string
    status: string
    durationMs: number | null
    createdAt: string
  }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: "완료", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
  RUNNING: { label: "실행 중", color: "text-blue-600 bg-blue-50", icon: Clock },
  FAILED: { label: "실패", color: "text-red-600 bg-red-50", icon: XCircle },
  QUEUED: { label: "대기", color: "text-gray-600 bg-gray-50", icon: Clock },
  CANCELLED: { label: "취소", color: "text-gray-400 bg-gray-50", icon: XCircle },
}

const QUICK_LINKS = [
  { href: "/run", label: "실행하기", desc: "채팅으로 Agent 실행", icon: Play, color: "bg-teams-purple text-white" },
  { href: "/marketplace", label: "마켓플레이스", desc: "Agent 검색 및 탐색", icon: Store, color: "bg-hansae-navy text-white" },
  { href: "/agents", label: "에이전트 카탈로그", desc: "등록된 Agent 둘러보기", icon: Bot, color: "bg-emerald-600 text-white" },
  { href: "/build", label: "빌드", desc: "새 Agent 만들기", icon: Hammer, color: "bg-hansae-red text-white", minRole: "CREATOR" },
]

export default function HomePage() {
  const { user } = useAuthContext()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => setData(json.data))
      .catch(() => {})
  }, [])

  if (!user) return null

  const isApproverOrAbove = user.role === "APPROVER" || user.role === "ADMIN"
  const filteredLinks = QUICK_LINKS.filter((link) => !link.minRole || ROLE_LEVELS[user.role] >= ROLE_LEVELS[link.minRole])

  return (
    <>
      <PageHeader
        title={`안녕하세요, ${user.displayName}님`}
        description="한세 AI Agent Platform에 오신 것을 환영합니다"
      />
      <PageContent>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats */}
          <div className={cn("grid grid-cols-1 gap-4", isApproverOrAbove ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">등록된 Agent</p>
                    <p className="text-3xl font-bold text-hansae-navy mt-1">
                      {data?.publishedCount ?? "—"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-hansae-navy/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-hansae-navy" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isApproverOrAbove && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">승인 대기</p>
                      <p className="text-3xl font-bold text-amber-600 mt-1">
                        {data?.pendingApprovals ?? "—"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">최근 실행</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">
                      {data?.recentJobs?.length ?? "—"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">빠른 시작</h2>
            <div className={cn("grid grid-cols-1 gap-4", filteredLinks.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
              {filteredLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link key={link.href} href={link.href}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-4">
                          {link.label}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent jobs */}
          {data?.recentJobs && data.recentJobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500">최근 실행 이력</h2>
                <Link href="/run/jobs">
                  <Button variant="ghost" size="sm" className="text-xs">
                    전체보기 <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {data.recentJobs.map((job) => {
                      const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.QUEUED
                      const StatusIcon = sc.icon
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between px-6 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc.color}`}>
                              <StatusIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {job.agentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(job.createdAt).toLocaleString("ko-KR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {job.durationMs && (
                              <span className="text-xs text-gray-400">
                                {(job.durationMs / 1000).toFixed(1)}s
                              </span>
                            )}
                            <Badge variant="outline" className={sc.color}>
                              {sc.label}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PageContent>
    </>
  )
}
