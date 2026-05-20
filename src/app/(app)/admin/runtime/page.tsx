"use client"

import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Shield, Lock, FileSearch, Clock, AlertTriangle,
  CheckCircle2, XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ---- Matrix data ---- */
const RUNTIME_TYPES = ["PYTHON_JOB", "STREAMLIT_HOST", "WINDOWS_WORKER", "BI_CONNECTOR"] as const
const DATA_CLASSES = ["EXTERNAL", "BUYER_PORTAL", "INTERNAL", "RESTRICTED"] as const

const RUNTIME_LABELS: Record<string, string> = {
  PYTHON_JOB: "Python Job",
  STREAMLIT_HOST: "Streamlit Host",
  WINDOWS_WORKER: "Windows Worker",
  BI_CONNECTOR: "BI Connector",
}

const CLASS_LABELS: Record<string, string> = {
  EXTERNAL: "External",
  BUYER_PORTAL: "Buyer Portal",
  INTERNAL: "Internal",
  RESTRICTED: "Restricted",
}

const CLASS_COLORS: Record<string, string> = {
  EXTERNAL: "bg-green-50 text-green-700 border-green-200",
  BUYER_PORTAL: "bg-blue-50 text-blue-700 border-blue-200",
  INTERNAL: "bg-amber-50 text-amber-700 border-amber-200",
  RESTRICTED: "bg-red-50 text-red-700 border-red-200",
}

type CellData = {
  allowed: "yes" | "no" | "warn"
  note: string
}

const MATRIX: Record<string, Record<string, CellData>> = {
  EXTERNAL: {
    PYTHON_JOB:      { allowed: "yes",  note: "Azure Job" },
    STREAMLIT_HOST:  { allowed: "yes",  note: "Container" },
    WINDOWS_WORKER:  { allowed: "no",   note: "" },
    BI_CONNECTOR:    { allowed: "yes",  note: "Gateway" },
  },
  BUYER_PORTAL: {
    PYTHON_JOB:      { allowed: "yes",  note: "+ Key Vault" },
    STREAMLIT_HOST:  { allowed: "yes",  note: "" },
    WINDOWS_WORKER:  { allowed: "warn", note: "Phase 2" },
    BI_CONNECTOR:    { allowed: "yes",  note: "" },
  },
  INTERNAL: {
    PYTHON_JOB:      { allowed: "no",   note: "SEC-01" },
    STREAMLIT_HOST:  { allowed: "warn", note: "On-prem" },
    WINDOWS_WORKER:  { allowed: "yes",  note: "On-prem" },
    BI_CONNECTOR:    { allowed: "warn", note: "" },
  },
  RESTRICTED: {
    PYTHON_JOB:      { allowed: "no",   note: "" },
    STREAMLIT_HOST:  { allowed: "no",   note: "" },
    WINDOWS_WORKER:  { allowed: "yes",  note: "On-prem only" },
    BI_CONNECTOR:    { allowed: "no",   note: "" },
  },
}

function CellBadge({ cell }: { cell: CellData }) {
  if (cell.allowed === "yes") {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        {cell.note && (
          <span className="text-[11px] text-green-700 font-medium">{cell.note}</span>
        )}
      </div>
    )
  }
  if (cell.allowed === "no") {
    return (
      <div className="flex items-center gap-1.5">
        <XCircle className="w-4 h-4 text-red-400" />
        {cell.note && (
          <span className="text-[11px] text-red-600 font-medium">{cell.note}</span>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <AlertTriangle className="w-4 h-4 text-amber-500" />
      {cell.note && (
        <span className="text-[11px] text-amber-700 font-medium">{cell.note}</span>
      )}
    </div>
  )
}

/* ---- Security Policies ---- */
const POLICIES = [
  {
    id: "SEC-01",
    title: "Internal Agent Azure Job 실행 금지",
    description: "Internal 등급의 Agent는 Azure Job으로 실행할 수 없습니다. 사내 데이터가 클라우드 환경에 노출되는 것을 방지합니다.",
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "SEC-02",
    title: "바이어 Credential은 Key Vault Only",
    description: "바이어 포탈 접속에 사용되는 credential은 반드시 Azure Key Vault에 저장하고, 런타임에서 환경 변수로만 주입합니다.",
    icon: Lock,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "SEC-03",
    title: "실행 및 다운로드 감사 로그 필수",
    description: "모든 Agent 실행과 결과 파일 다운로드는 감사 로그에 기록되어야 합니다. 로그 미생성 시 실행이 차단됩니다.",
    icon: FileSearch,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: "SEC-04",
    title: "결과 파일 기본 보존 90일",
    description: "Agent 실행 결과로 생성된 파일은 기본 90일간 보존되며, 보존 기간 경과 후 자동 삭제됩니다. Restricted 등급은 30일로 단축됩니다.",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
]

export default function RuntimePolicyPage() {
  return (
    <>
      <PageHeader title="런타임 정책" description="데이터 등급별 런타임 허용 매트릭스 및 보안 정책">
        <Badge variant="outline" className="text-xs gap-1">
          <Shield className="w-3 h-3" />
          v1.0
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Matrix Table */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Data Classification x Runtime Type 매트릭스
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              데이터 등급과 런타임 유형 조합에 따른 실행 허용 여부입니다.
            </p>
            <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="pl-4 w-[160px]">Data Class</TableHead>
                    {RUNTIME_TYPES.map((rt) => (
                      <TableHead key={rt} className="text-center">
                        <span className="text-[11px] font-semibold">
                          {RUNTIME_LABELS[rt]}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DATA_CLASSES.map((dc) => (
                    <TableRow key={dc}>
                      <TableCell className="pl-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold border",
                            CLASS_COLORS[dc]
                          )}
                        >
                          {CLASS_LABELS[dc]}
                        </Badge>
                      </TableCell>
                      {RUNTIME_TYPES.map((rt) => (
                        <TableCell key={rt} className="text-center">
                          <div className="flex justify-center">
                            <CellBadge cell={MATRIX[dc][rt]} />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>허용</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>차단</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>조건부 / 예정</span>
            </div>
          </div>

          {/* Security Policies */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              보안 정책
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              플랫폼 전반에 적용되는 보안 정책입니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POLICIES.map((policy) => {
                const Icon = policy.icon
                return (
                  <Card key={policy.id} className="border-0 shadow-sm">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0",
                            policy.bgColor
                          )}
                        >
                          <Icon className={cn("w-5 h-5", policy.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono font-semibold"
                            >
                              {policy.id}
                            </Badge>
                          </div>
                          <CardTitle className="mt-1 text-sm">
                            {policy.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed">
                        {policy.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </PageContent>
    </>
  )
}
