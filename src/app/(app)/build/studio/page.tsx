"use client"

import { useState } from "react"
import Link from "next/link"
import { PageContent } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft, Send, Sparkles, FileText, Upload, Link2, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_KB_FILES = [
  { name: "2026_Exchange_Rate.xlsx", updatedAt: "2시간 전", size: "12.4KB", status: "Connected" },
  { name: "Gap_Buyer_Template_v2.xlsx", updatedAt: "어제", size: "45.8KB", status: "Connected" },
]

const MOCK_CHAT = [
  { role: "bot", content: "안녕하세요! 수정한 로직으로 테스트를 시작합니다. PO 파일을 업로드해 주세요." },
  { role: "user", content: "신규 PO 3건 업로드할게. Gap 양식으로 변환해줘." },
  { role: "bot", content: "네, Gap 양식에 맞춰 분석을 완료했습니다.\n[결과] Gap_OrderRecap_0519.xlsx" },
]

export default function StudioPage() {
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
  const [kbFiles, setKbFiles] = useState(MOCK_KB_FILES)

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/build">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> 빌드
              </Button>
            </Link>
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

      {/* Studio layout: Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col overflow-y-auto border-r border-gray-200 bg-white p-6 gap-6">
          {/* System Instructions */}
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

          {/* Knowledge Base */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Knowledge Base (RAG)</h2>
            <div className="space-y-2">
              {kbFiles.map((file) => (
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

        {/* Right: Preview & Test */}
        <div className="w-[440px] flex flex-col bg-gray-50 flex-shrink-0">
          <div className="px-5 py-4 border-b border-gray-200 bg-white">
            <h2 className="text-sm font-bold text-gray-900">Preview & Test</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">수정 사항이 즉시 반영됩니다</p>
          </div>

          {/* Chat area */}
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

          {/* Chat input */}
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
