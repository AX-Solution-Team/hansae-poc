"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useAuthContext } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send, Bot, User as UserIcon, Download, FileSpreadsheet,
  Loader2, CheckCircle2, Clock, AlertCircle, Play,
  ChevronRight, Sparkles, Table2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Message = {
  id: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  content: string
  metadata?: {
    jobId?: string
    job?: {
      status: string
      steps: { label: string; status: string }[]
      summaryMessage?: string
    }
    outputFiles?: {
      id: string
      fileName: string
      downloadUrl: string
      previewRows?: Record<string, unknown>[]
    }[]
    alternateBrands?: { slug: string; name: string; agentGroup: string }[]
    candidates?: { slug: string; name: string }[]
  }
  createdAt: string
}

type Session = {
  id: string
  title: string | null
  updatedAt: string
}

const QUICK_PROMPTS = [
  { label: "ZARA Trousers 분석", text: "이번 주 ZARA Trousers 신제품 정리해줘" },
  { label: "PO 오더리캡", text: "Target 바이어 PO 이번 주 오더리캡 정리해줘" },
  { label: "검사 리포트", text: "이번 주 검사 리포트 만들어줘" },
]

const STEP_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  running: Loader2,
  done: CheckCircle2,
  failed: AlertCircle,
}

export default function RunPage() {
  useAuthContext()
  const searchParams = useSearchParams()
  const slugParam = searchParams.get("slug")

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [_sessions, setSessions] = useState<Session[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (slugParam) {
      setInput(``)
    }
  }, [slugParam])

  useEffect(() => {
    fetch("/api/run/sessions")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setSessions(json.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || sending) return

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: msg,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/run/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: msg,
          slug: slugParam,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message || "실행에 실패했습니다")
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          role: "ASSISTANT",
          content: json.error?.message || "오류가 발생했습니다",
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errMsg])
        return
      }

      const data = json.data
      if (data.sessionId) setSessionId(data.sessionId)

      const assistantMsg: Message = {
        id: data.assistantMessageId || `ast-${Date.now()}`,
        role: "ASSISTANT",
        content: data.reply,
        metadata: {
          jobId: data.jobId,
          job: data.job,
          outputFiles: data.outputFiles,
          alternateBrands: data.alternateBrands,
          candidates: data.candidates,
        },
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [input, sending, sessionId, slugParam])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Teams-style header */}
      <div className="teams-gradient px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">AI Agent 실행</h1>
            <p className="text-white/60 text-xs">자연어로 Agent를 실행하세요</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => {
            setMessages([])
            setSessionId(null)
          }}
        >
          새 대화
        </Button>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 bg-white">
        <div className="max-w-3xl mx-auto py-6 px-4">
          {messages.length === 0 ? (
            <EmptyState
              onPrompt={(text) => sendMessage(text)}
            />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onReuse={(text) => sendMessage(text)} />
              ))}
              {sending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full teams-gradient flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      처리 중...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Agent를 실행해 보세요... (예: 이번 주 ZARA Trousers 신제품 정리해줘)"
                className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teams-purple/30 focus:border-teams-purple min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={sending}
              />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="h-[44px] px-4 teams-gradient hover:opacity-90 rounded-xl"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 px-1">
            Enter로 전송 · Shift+Enter로 줄바꿈
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl teams-gradient flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Agent를 실행해 보세요
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        아래 예시를 클릭하거나 자연어로 원하는 작업을 입력하세요.
        <br />
        AI가 적절한 Agent를 찾아 실행합니다.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => onPrompt(qp.text)}
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-teams-purple/30 hover:bg-teams-purple/5 transition-all text-left group"
          >
            <Play className="w-4 h-4 text-teams-purple mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-teams-purple">
                {qp.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{qp.text}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message, onReuse }: { message: Message; onReuse: (text: string) => void }) {
  const isUser = message.role === "USER"
  const meta = message.metadata

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-hansae-navy" : "teams-gradient"
        )}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn("max-w-[80%] space-y-3", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-hansae-navy text-white rounded-tr-sm"
              : "bg-gray-50 text-gray-900 rounded-tl-sm"
          )}
        >
          {message.content}
        </div>

        {/* Job progress */}
        {meta?.job && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  meta.job.status === "COMPLETED" && "bg-green-50 text-green-700 border-green-200",
                  meta.job.status === "FAILED" && "bg-red-50 text-red-700 border-red-200",
                  meta.job.status === "RUNNING" && "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                {meta.job.status === "COMPLETED" ? "완료" :
                 meta.job.status === "FAILED" ? "실패" :
                 meta.job.status === "RUNNING" ? "실행 중" : meta.job.status}
              </Badge>
            </div>
            <div className="space-y-2">
              {meta.job.steps.map((step, i) => {
                const StepIcon = STEP_ICONS[step.status] || Clock
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <StepIcon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        step.status === "done" && "text-green-500",
                        step.status === "running" && "text-blue-500 animate-spin",
                        step.status === "pending" && "text-gray-300",
                        step.status === "failed" && "text-red-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs",
                        step.status === "done" && "text-gray-700",
                        step.status === "running" && "text-blue-700 font-medium",
                        step.status === "pending" && "text-gray-400",
                        step.status === "failed" && "text-red-600"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
            {meta.job.summaryMessage && (
              <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                {meta.job.summaryMessage}
              </p>
            )}
          </div>
        )}

        {/* Output files */}
        {meta?.outputFiles && meta.outputFiles.length > 0 && (
          <div className="space-y-2">
            {meta.outputFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.fileName}
                      </p>
                    </div>
                  </div>
                  <a href={file.downloadUrl} download>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" />
                      다운로드
                    </Button>
                  </a>
                </div>

                {/* Preview table */}
                {file.previewRows && file.previewRows.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50">
                      <Table2 className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-medium">
                        미리보기 (상위 {file.previewRows.length}행)
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50/50">
                            {Object.keys(file.previewRows[0]).map((key) => (
                              <th
                                key={key}
                                className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {file.previewRows.slice(0, 10).map((row, i) => (
                            <tr key={i} className="border-t border-gray-50">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                                  {String(val ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Alternate brands / reuse chips */}
        {meta?.alternateBrands && meta.alternateBrands.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {meta.alternateBrands.map((brand) => (
              <button
                key={brand.slug}
                onClick={() => onReuse(`${brand.name} 바지 신제품도 같은 방식으로 정리해줘`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teams-purple/20 bg-teams-purple/5 text-teams-purple text-xs font-medium hover:bg-teams-purple/10 transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
                {brand.name} 도 실행
              </button>
            ))}
          </div>
        )}

        {/* Candidates when no match */}
        {meta?.candidates && meta.candidates.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs font-medium text-amber-700 mb-2">
              이런 Agent를 찾으시나요?
            </p>
            <div className="flex flex-wrap gap-2">
              {meta.candidates.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => onReuse(c.name)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
