"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  CheckSquare, Clock, CheckCircle2, XCircle, Loader2,
  User, Bot, Calendar, MessageSquare, Sparkles, Workflow,
  Code2, Shield
} from "lucide-react"
import { toast } from "sonner"

type ApprovalItem = {
  id: string
  agentId: string
  agentName: string
  agentGroup: string
  agentDescription: string
  buildTier: string
  requesterName: string
  requesterId: string
  requestedAt: string
  decision: string
}

const TIER_ICON: Record<string, React.ElementType> = {
  NOCODE: Sparkles,
  LOWCODE: Workflow,
  PROCODE: Code2,
}

const TIER_LABELS: Record<string, string> = {
  NOCODE: "노코드",
  LOWCODE: "로우코드",
  PROCODE: "프로코드",
}

export default function ApprovalsPage() {
  useAuthContext()
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [approveComment, setApproveComment] = useState("")
  const [rejectComment, setRejectComment] = useState("")
  const [acting, setActing] = useState(false)

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/approvals?decision=PENDING")
      const json = await res.json()
      if (json.data) setApprovals(json.data.items ?? json.data)
    } catch {
      toast.error("승인 목록을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const selected = approvals.find((a) => a.id === selectedId)

  const handleApprove = async () => {
    if (!selectedId) return
    setActing(true)
    try {
      const res = await fetch(`/api/approvals/${selectedId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: approveComment }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error?.message || "승인에 실패했습니다")
        return
      }
      toast.success("승인 완료되었습니다")
      setSelectedId(null)
      setApproveComment("")
      await fetchApprovals()
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedId) return
    if (rejectComment.trim().length < 5) {
      toast.error("반려 사유를 5자 이상 입력해주세요")
      return
    }
    setActing(true)
    try {
      const res = await fetch(`/api/approvals/${selectedId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: rejectComment }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error?.message || "반려에 실패했습니다")
        return
      }
      toast.success("반려 처리되었습니다")
      setSelectedId(null)
      setRejectComment("")
      await fetchApprovals()
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <PageHeader
        title="승인함"
        description="Agent 게시 요청을 검토하고 승인/반려하세요"
      >
        <Badge variant="outline" className="text-xs gap-1">
          <Clock className="w-3 h-3" />
          {approvals.length}건 대기
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-1.5" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <CheckSquare className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-1">대기 중인 승인 요청이 없습니다</p>
              <p className="text-xs text-gray-400">새로운 요청이 들어오면 여기에 표시됩니다</p>
            </div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="font-semibold text-gray-700">Agent</TableHead>
                      <TableHead className="font-semibold text-gray-700">빌드 티어</TableHead>
                      <TableHead className="font-semibold text-gray-700">요청자</TableHead>
                      <TableHead className="font-semibold text-gray-700">요청일</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((item) => {
                      const TierIcon = TIER_ICON[item.buildTier] || Bot
                      return (
                        <TableRow
                          key={item.id}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedId(item.id)
                            setApproveComment("")
                            setRejectComment("")
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-hansae-navy/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-hansae-navy" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{item.agentName}</p>
                                <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                  {item.agentDescription}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <TierIcon className="w-3 h-3" />
                              {TIER_LABELS[item.buildTier] || item.buildTier}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">{item.requesterName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {new Date(item.requestedAt).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(item.id)
                                setApproveComment("")
                                setRejectComment("")
                              }}
                            >
                              상세보기
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog
          open={!!selectedId}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                승인 요청 상세
              </DialogTitle>
            </DialogHeader>

            {selected && (
              <div className="space-y-5 py-2">
                {/* Agent metadata */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-hansae-navy/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-hansae-navy" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selected.agentName}</h3>
                      <p className="text-xs text-gray-500">{selected.agentGroup}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">빌드 티어</p>
                      <p className="text-gray-700 font-medium">
                        {TIER_LABELS[selected.buildTier] || selected.buildTier}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">요청자</p>
                      <p className="text-gray-700 font-medium">{selected.requesterName}</p>
                    </div>
                  </div>

                  {selected.agentDescription && (
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                      {selected.agentDescription}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Teams Adaptive Card mock */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Teams 알림 미리보기
                  </p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Card header */}
                    <div className="teams-gradient px-4 py-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-white text-sm font-medium">AI Agent Platform</span>
                    </div>
                    {/* Card body */}
                    <div className="p-4 bg-white space-y-3">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Agent 게시 승인 요청
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-500 w-16">Agent</span>
                          <span className="text-gray-900 font-medium">{selected.agentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-500 w-16">요청자</span>
                          <span className="text-gray-900 font-medium">{selected.requesterName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-500 w-16">요청일</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(selected.requestedAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      </div>
                      {/* Mock action buttons in card */}
                      <div className="flex gap-2 pt-2">
                        <div className="flex-1 h-8 rounded bg-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                          승인
                        </div>
                        <div className="flex-1 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                          반려
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action section */}
                <div className="space-y-4">
                  {/* Approve */}
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                    <Label className="text-sm font-medium text-emerald-800 mb-2 block">
                      승인
                    </Label>
                    <Textarea
                      value={approveComment}
                      onChange={(e) => setApproveComment(e.target.value)}
                      placeholder="승인 코멘트 (선택)"
                      className="text-sm min-h-[60px] mb-3 bg-white"
                    />
                    <Button
                      onClick={handleApprove}
                      disabled={acting}
                      className="w-full h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {acting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      승인
                    </Button>
                  </div>

                  {/* Reject */}
                  <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                    <Label className="text-sm font-medium text-red-800 mb-2 block">
                      반려
                    </Label>
                    <Textarea
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      placeholder="반려 사유를 입력하세요 (필수, 5자 이상)"
                      className="text-sm min-h-[60px] mb-1 bg-white"
                    />
                    <p className="text-[10px] text-red-400 mb-3">
                      {rejectComment.trim().length < 5
                        ? `${5 - rejectComment.trim().length}자 더 입력하세요`
                        : "충분합니다"}
                    </p>
                    <Button
                      onClick={handleReject}
                      disabled={acting || rejectComment.trim().length < 5}
                      variant="outline"
                      className="w-full h-9 gap-2 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      {acting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      반려
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  )
}
