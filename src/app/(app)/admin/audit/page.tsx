"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Download, ChevronLeft, ChevronRight, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type AuditEntry = {
  id: string
  eventType: string
  userId: string
  user: { displayName: string; email: string }
  agentId: string | null
  jobId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

const EVENT_BADGES: Record<string, { label: string; color: string }> = {
  JOB_STARTED:     { label: "실행 시작", color: "bg-blue-50 text-blue-700 border-blue-200" },
  JOB_COMPLETED:   { label: "실행 완료", color: "bg-green-50 text-green-700 border-green-200" },
  JOB_FAILED:      { label: "실행 실패", color: "bg-red-50 text-red-700 border-red-200" },
  FILE_DOWNLOAD:   { label: "파일 다운로드", color: "bg-purple-50 text-purple-700 border-purple-200" },
  AGENT_PUBLISHED: { label: "에이전트 게시", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  AGENT_ARCHIVED:  { label: "에이전트 보관", color: "bg-gray-100 text-gray-600 border-gray-200" },
  LOGIN:           { label: "로그인", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  LOGOUT:          { label: "로그아웃", color: "bg-gray-50 text-gray-600 border-gray-200" },
  APPROVAL_GRANTED:{ label: "승인", color: "bg-green-50 text-green-700 border-green-200" },
  APPROVAL_DENIED: { label: "승인 거부", color: "bg-red-50 text-red-700 border-red-200" },
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function truncateId(id: string | null): string {
  if (!id) return "-"
  return id.length > 12 ? `${id.slice(0, 8)}...` : id
}

export default function AuditLogPage() {
  useAuthContext()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [eventFilter, setEventFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("")
  const limit = 50

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (eventFilter !== "ALL") params.set("eventType", eventFilter)
      if (dateFilter) params.set("date", dateFilter)

      const res = await fetch(`/api/admin/audit?${params}`)
      const json = await res.json()
      if (json.data) {
        setEntries(json.data.items || json.data)
        setTotalPages(json.data.totalPages || 1)
      }
    } catch {
      toast.error("감사 로그를 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }, [page, eventFilter, dateFilter])

  useEffect(() => {
    fetchAudit()
  }, [fetchAudit])

  const exportCsv = () => {
    if (entries.length === 0) {
      toast.error("내보낼 데이터가 없습니다")
      return
    }

    const headers = ["시각", "이벤트", "사용자", "이메일", "agentId", "jobId"]
    const rows = entries.map((e) => [
      formatDateTime(e.createdAt),
      EVENT_BADGES[e.eventType]?.label || e.eventType,
      e.user.displayName,
      e.user.email,
      e.agentId || "",
      e.jobId || "",
    ])

    const bom = "﻿"
    const csv = bom + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV 파일이 다운로드되었습니다")
  }

  return (
    <>
      <PageHeader title="감사 로그" description="플랫폼 이벤트 및 사용자 활동 기록">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCsv}>
          <Download className="w-3.5 h-3.5" />
          CSV 내보내기
        </Button>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={eventFilter} onValueChange={(v) => { if (v) setEventFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="이벤트 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 이벤트</SelectItem>
                {Object.entries(EVENT_BADGES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
              className="w-[160px] h-8 text-xs"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="pl-4">시각</TableHead>
                  <TableHead>이벤트</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Job ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j} className={j === 0 ? "pl-4" : ""}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500">감사 로그가 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const badge = EVENT_BADGES[entry.eventType] || {
                      label: entry.eventType,
                      color: "bg-gray-50 text-gray-600 border-gray-200",
                    }
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="pl-4 text-xs text-gray-600 font-mono">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-medium border", badge.color)}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {entry.user.displayName}
                            </span>
                            <span className="text-[10px] text-gray-400">{entry.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-mono">
                          {truncateId(entry.agentId)}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-mono">
                          {truncateId(entry.jobId)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                페이지 {page} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContent>
    </>
  )
}
