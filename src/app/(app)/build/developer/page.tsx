"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Terminal, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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

const COLOR_MAP: Record<string, string> = {
  keyword: "text-[#569CD6]",
  string: "text-[#CE9178]",
  comment: "text-[#6A9955]",
  function: "text-[#DCDCAA]",
  plain: "text-[#D4D4D4]",
}

export default function DeveloperPage() {
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

      {/* Dev layout: Code Editor + Onboarding Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Editor */}
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
                <span key={i} className={COLOR_MAP[token.type] || "text-[#D4D4D4]"}>
                  {token.text}
                </span>
              )
            )}
          </div>
          <div className="mx-5 mb-4 p-3 rounded bg-[#252526] border border-[#333]">
            <p className="text-xs font-mono text-[#10B981]">&gt; SDK Build Success. Ready to Deploy.</p>
          </div>
        </div>

        {/* Onboarding Panel */}
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

      {/* Footer */}
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
