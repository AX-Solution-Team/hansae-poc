"use client"

import { useState, useEffect } from "react"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { AgentGroupIcon, AGENT_GROUPS } from "@/components/shared/agent-group-icon"
import {
  LayoutGrid, Archive, Bot, CheckCircle2, Pause, XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type AgentEntry = {
  id: string
  name: string
  slug: string
  status: string
  agentGroup: string
  buildTier: string
  demoRunnable: boolean
  updatedAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PUBLISHED: { label: "게시됨", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  DRAFT:     { label: "초안", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Pause },
  ARCHIVED:  { label: "보관됨", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Archive },
  REJECTED:  { label: "반려", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  PENDING_REVIEW: { label: "검토 대기", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Pause },
}

const TIER_LABELS: Record<string, string> = {
  NOCODE: "No-Code",
  LOWCODE: "Low-Code",
  PROCODE: "Pro-Code",
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export default function AdminAgentsPage() {
  useAuthContext()
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [archiveTarget, setArchiveTarget] = useState<AgentEntry | null>(null)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/agents")
      const json = await res.json()
      if (json.data) {
        setAgents(json.data.items || json.data)
      }
    } catch {
      toast.error("에이전트 목록을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      const res = await fetch(`/api/admin/agents/${archiveTarget.id}/archive`, {
        method: "POST",
      })
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === archiveTarget.id ? { ...a, status: "ARCHIVED" } : a
          )
        )
        toast.success(`${archiveTarget.name} 에이전트가 보관되었습니다`)
      } else {
        const json = await res.json()
        toast.error(json.error?.message || "보관에 실패했습니다")
      }
    } catch {
      toast.error("보관 처리 중 오류가 발생했습니다")
    } finally {
      setArchiving(false)
      setArchiveTarget(null)
    }
  }

  return (
    <>
      <PageHeader title="에이전트 관리" description="전체 에이전트 현황 및 상태를 관리합니다">
        <Badge variant="outline" className="text-xs gap-1">
          <LayoutGrid className="w-3 h-3" />
          {agents.length}개
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="pl-4">에이전트</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>그룹</TableHead>
                  <TableHead>빌드 티어</TableHead>
                  <TableHead>데모 가능</TableHead>
                  <TableHead>수정일</TableHead>
                  <TableHead className="text-right pr-4">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j} className={j === 0 ? "pl-4" : ""}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Bot className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500">등록된 에이전트가 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => {
                    const sc = STATUS_CONFIG[agent.status] || STATUS_CONFIG.DRAFT
                    const Icon = sc.icon
                    const groupConfig = AGENT_GROUPS[agent.agentGroup]
                    return (
                      <TableRow key={agent.id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <AgentGroupIcon group={agent.agentGroup} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {agent.name}
                              </p>
                              <p className="text-[10px] text-gray-400">{agent.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("gap-1 text-[10px] font-medium border", sc.color)}
                          >
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {groupConfig?.label || agent.agentGroup}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {TIER_LABELS[agent.buildTier] || agent.buildTier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {agent.demoRunnable ? (
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                              가능
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200">
                              불가
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(agent.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          {agent.status === "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-gray-500 hover:text-red-600"
                              onClick={() => setArchiveTarget(agent)}
                            >
                              <Archive className="w-3.5 h-3.5" />
                              보관
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={!!archiveTarget} onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>에이전트 보관 확인</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{archiveTarget?.name}</strong> 에이전트를 보관 처리하시겠습니까?
                보관된 에이전트는 마켓플레이스에서 노출되지 않으며 실행할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archiving}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
                disabled={archiving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {archiving ? "처리 중..." : "보관 처리"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContent>
    </>
  )
}
