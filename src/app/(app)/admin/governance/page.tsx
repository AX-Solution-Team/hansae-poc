"use client"

import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, DollarSign, Users, Cpu, AlertTriangle, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const SECURITY_LOGS = [
  { level: "info", time: "14:30:05", message: "Agent 'Target PO' executed by user 'kim.hs'" },
  { level: "info", time: "14:31:12", message: "PII Masking applied to input data (3 items)" },
  { level: "warn", time: "14:35:22", message: "Potential sensitive data detected in prompt (Blocked)" },
  { level: "info", time: "14:40:45", message: "Policy update: 'Design Team' access granted to VLM" },
  { level: "info", time: "14:45:10", message: "Weekly audit report generated" },
  { level: "info", time: "14:50:33", message: "Agent 'ZARA Crawler' version v2.1 published" },
  { level: "warn", time: "14:55:18", message: "Unusual API call pattern detected from user 'park.tj' (Monitored)" },
  { level: "info", time: "15:00:02", message: "Scheduled compliance check completed - All Clear" },
]

export default function GovernancePage() {
  return (
    <>
      <PageHeader
        title="Enterprise AI Governance Dashboard"
        description="AI 활용의 투명성과 데이터 보안을 관리합니다"
      >
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Secure & Compliant
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource & Cost Usage */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  Resource & Cost Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Monthly Budget Usage</span>
                    <span className="font-semibold text-gray-900">$12,450 / $20,000</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Total Tokens</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">1.2B</p>
                    <p className="text-[10px] text-gray-400 mt-1">이번 달 사용량</p>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Active Users</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">2,480</p>
                    <p className="text-[10px] text-gray-400 mt-1">월간 활성 사용자</p>
                  </div>
                </div>

                {/* Department breakdown */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500">부서별 사용량</p>
                  {[
                    { dept: "해외영업팀", pct: 35, color: "bg-red-500" },
                    { dept: "디자인팀", pct: 28, color: "bg-blue-500" },
                    { dept: "생산관리팀", pct: 20, color: "bg-emerald-500" },
                    { dept: "재무팀", pct: 12, color: "bg-amber-500" },
                    { dept: "기타", pct: 5, color: "bg-gray-400" },
                  ].map((d) => (
                    <div key={d.dept}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{d.dept}</span>
                        <span className="text-gray-500">{d.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", d.color)} style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security & DLP Logs */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  Security & DLP Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-2 max-h-[360px] overflow-y-auto">
                  {SECURITY_LOGS.map((log, i) => (
                    <div
                      key={i}
                      className={cn(
                        "pb-2 border-b border-gray-200 last:border-0",
                        log.level === "warn" ? "text-amber-600" : "text-blue-600"
                      )}
                    >
                      [{log.level === "warn" ? "WARN" : "INFO"}] {log.time} - {log.message}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Governance Insight */}
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-hansae-navy flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">보안 거버넌스 인사이트</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    지난 24시간 동안 <strong>12건</strong>의 비정상 접근 시도가 차단되었습니다.
                    사내 보안 규정 준수율 <strong>100%</strong>를 유지하고 있습니다.
                    이번 주 DLP 필터링에 의해 <strong>3건</strong>의 민감 데이터 전송이 자동 마스킹 처리되었습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "ISO/IEC 27001", status: "Certified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "데이터 보안 정책", status: "Active", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "개인정보 보호 (DLP)", status: "Enforced", color: "bg-purple-50 text-purple-700 border-purple-200" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-lg border border-gray-200 bg-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <Badge className={cn("mt-1 text-[10px]", item.color)} variant="outline">
                    {item.status}
                  </Badge>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </>
  )
}
