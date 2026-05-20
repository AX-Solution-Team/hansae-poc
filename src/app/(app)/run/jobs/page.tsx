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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  History, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, XCircle, Clock, Ban, Shield, FileDown,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { JobSummary } from "@/types/api"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: "완료", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  RUNNING:   { label: "실행중", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Loader2 },
  FAILED:    { label: "실패", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  CANCELLED: { label: "취소", color: "bg-gray-50 text-gray-500 border-gray-200", icon: Ban },
  QUEUED:    { label: "대기", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
}

function formatDuration(ms: number | null): string {
  if (!ms) return "-"
  if (ms < 1000) return `${ms}ms`
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const remainSec = sec % 60
  return `${min}m ${remainSec}s`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function RunJobsPage() {
  useAuthContext()
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const limit = 20

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        mine: "true",
        page: String(page),
        limit: String(limit),
      })
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)

      const res = await fetch(`/api/jobs?${params}`)
      const json = await res.json()
      if (json.data) {
        setJobs(json.data.items || json.data)
        setTotalPages(json.data.totalPages || 1)
      }
    } catch {
      toast.error("실행 이력을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const openDetail = (job: JobSummary) => {
    setSelectedJob(job)
    setDialogOpen(true)
  }

  const stepStatusColor = (status: string) => {
    switch (status) {
      case "DONE": return "text-green-600"
      case "RUNNING": return "text-blue-600"
      case "ERROR": return "text-red-600"
      default: return "text-gray-400"
    }
  }

  return (
    <>
      <PageHeader title="실행 이력" description="내 Agent 실행 기록을 확인합니다">
        <Badge variant="outline" className="text-xs gap-1">
          <History className="w-3 h-3" />
          최근 실행
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 상태</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="RUNNING">실행중</SelectItem>
                <SelectItem value="FAILED">실패</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
                <SelectItem value="QUEUED">대기</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="w-[150px] h-8 text-xs"
                placeholder="시작일"
              />
              <span className="text-gray-400 text-xs">~</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="w-[150px] h-8 text-xs"
                placeholder="종료일"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="pl-4">시각</TableHead>
                  <TableHead>Agent명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>소요시간</TableHead>
                  <TableHead>Sandbox</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j} className={j === 0 ? "pl-4" : ""}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500">실행 이력이 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => {
                    const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.QUEUED
                    const Icon = sc.icon
                    return (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => openDetail(job)}
                      >
                        <TableCell className="pl-4 text-xs text-gray-600">
                          {formatDateTime(job.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {job.agentName}
                            </span>
                            <span className="text-[10px] text-gray-400">{job.agentSlug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("gap-1 text-[10px] font-medium border", sc.color)}
                          >
                            <Icon className={cn("w-3 h-3", job.status === "RUNNING" && "animate-spin")} />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {formatDuration(job.durationMs)}
                        </TableCell>
                        <TableCell>
                          {job.isSandbox && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-200"
                            >
                              <Shield className="w-3 h-3" />
                              Sandbox
                            </Badge>
                          )}
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

        {/* Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>실행 상세</DialogTitle>
              <DialogDescription>
                {selectedJob?.agentName} ({selectedJob?.agentSlug})
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4 mt-2">
                {/* Status & Duration */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const sc = STATUS_CONFIG[selectedJob.status] || STATUS_CONFIG.QUEUED
                    const Icon = sc.icon
                    return (
                      <Badge
                        variant="outline"
                        className={cn("gap-1 text-xs font-medium border", sc.color)}
                      >
                        <Icon className={cn("w-3.5 h-3.5", selectedJob.status === "RUNNING" && "animate-spin")} />
                        {sc.label}
                      </Badge>
                    )
                  })()}
                  <span className="text-xs text-gray-500">
                    소요시간: {formatDuration(selectedJob.durationMs)}
                  </span>
                  {selectedJob.isSandbox && (
                    <Badge variant="outline" className="gap-1 text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                      <Shield className="w-3 h-3" />
                      Sandbox
                    </Badge>
                  )}
                </div>

                {/* Steps */}
                {selectedJob.steps && selectedJob.steps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">실행 단계</p>
                    <div className="space-y-1.5">
                      {selectedJob.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-mono w-5 text-right">
                              {step.seq}
                            </span>
                            <span className={cn("font-medium", stepStatusColor(step.status))}>
                              {step.label}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", stepStatusColor(step.status))}
                          >
                            {step.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {selectedJob.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1">오류 메시지</p>
                        <p className="text-xs text-red-600">{selectedJob.errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Output Files */}
                {selectedJob.outputFiles && selectedJob.outputFiles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">출력 파일</p>
                    <div className="space-y-1.5">
                      {selectedJob.outputFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.blobUrl}
                          download
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileDown className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {file.fileName}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {(file.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedJob.summaryMessage && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700">{selectedJob.summaryMessage}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  )
}
