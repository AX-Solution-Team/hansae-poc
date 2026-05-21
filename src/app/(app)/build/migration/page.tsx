"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, FileText, Package, Mail, Factory, BarChart3, Shirt, Search, FileCheck, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { step: 1, label: "Python Script Upload" },
  { step: 2, label: "Hansae SDK Wrapping" },
  { step: 3, label: "AI Reasoning Injection" },
  { step: 4, label: "Marketplace Deploy" },
]

const ASSETS: { name: string; tech: string; icon: React.ElementType; iconBg: string; iconColor: string; status: string; agentId?: string; note?: string }[] = [
  { name: "바이어 PO 오더리캡 자동 생성", tech: "pdfplumber, openpyxl", icon: FileText, iconBg: "bg-blue-50", iconColor: "text-blue-600", status: "completed", agentId: "#AG-001" },
  { name: "ZARA 바이어 제품 정보 크롤러", tech: "Selenium, BeautifulSoup", icon: Search, iconBg: "bg-purple-50", iconColor: "text-purple-600", status: "completed", agentId: "#AG-002" },
  { name: "Target 부자재 발주서 자동생성", tech: "Streamlit, Pandas", icon: Package, iconBg: "bg-amber-50", iconColor: "text-amber-600", status: "in-progress", note: "Wrapping SDK..." },
  { name: "이메일 검색 및 자료 다운로드", tech: "Win32com, Outlook API", icon: Mail, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", status: "in-progress", note: "Testing AI Logic..." },
  { name: "ERP 생산현황 활용 및 알림", tech: "Python, RPA Connect", icon: Factory, iconBg: "bg-gray-100", iconColor: "text-gray-600", status: "ready" },
  { name: "재고 분석 및 비즈니스 인사이트", tech: "Pandas, Plotly", icon: BarChart3, iconBg: "bg-indigo-50", iconColor: "text-indigo-600", status: "ready" },
  { name: "POCN 확인서 자동 생성", tech: "pdfplumber, difflib", icon: FileCheck, iconBg: "bg-teal-50", iconColor: "text-teal-600", status: "completed", agentId: "#AG-003" },
  { name: "주간 매출 리포트 자동화", tech: "openpyxl, Jinja2", icon: TrendingUp, iconBg: "bg-rose-50", iconColor: "text-rose-600", status: "completed", agentId: "#AG-004" },
]

export default function MigrationPage() {
  const completedCount = ASSETS.filter((a) => a.status === "completed").length
  const inProgressCount = ASSETS.filter((a) => a.status === "in-progress").length

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
              <h1 className="text-lg font-bold text-gray-900">Legacy Asset Migration Center</h1>
              <p className="text-xs text-gray-500">기존 자동화 자산을 플랫폼 에이전트로 전환합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Total Assets: <strong className="text-gray-900">20 Tools</strong>
            </span>
            <Button variant="outline" size="sm">Migration Logs</Button>
            <Button className="bg-hansae-navy hover:bg-hansae-navy-light gap-1.5">
              + New Onboarding
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Stepper */}
          <div className="bg-hansae-navy rounded-xl p-5 flex items-center justify-between gap-4">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex items-center gap-4 flex-1">
                <div className={cn("flex-1", s.step === 4 && "opacity-50")}>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Step {s.step}
                  </p>
                  <p className="text-sm font-semibold text-gray-100 mt-1">{s.label}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="text-red-400 font-black text-lg">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{ASSETS.length - completedCount - inProgressCount}</p>
              <p className="text-xs text-gray-500">Ready to Onboard</p>
            </div>
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ASSETS.map((asset) => (
              <div
                key={asset.name}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all",
                  asset.status === "ready" && "opacity-60"
                )}
              >
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", asset.iconBg)}>
                  <asset.icon className={cn("w-5 h-5", asset.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{asset.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tech: {asset.tech}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {asset.status === "completed" && (
                      <>
                        <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]" variant="outline">
                          Completed
                        </Badge>
                        <span className="text-[10px] text-gray-400">Agent ID: {asset.agentId}</span>
                      </>
                    )}
                    {asset.status === "in-progress" && (
                      <>
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]" variant="outline">
                          In Progress
                        </Badge>
                        <span className="text-[10px] text-gray-400">{asset.note}</span>
                      </>
                    )}
                    {asset.status === "ready" && (
                      <span className="text-[10px] text-gray-400">Ready to Onboard</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Migration Engine v2.1 Active
        </div>
        <span>Success Rate: 100% | Avg. Onboarding: 45min</span>
      </div>
    </div>
  )
}
