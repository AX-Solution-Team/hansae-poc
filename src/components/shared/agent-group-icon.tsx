import {
  FileText, TrendingUp, Palette, MessageCircle,
  Factory, Users, Calculator
} from "lucide-react"
import { cn } from "@/lib/utils"

export const AGENT_GROUPS: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
  examplePrompt: string
}> = {
  PO_PROCESSING: {
    label: "PO Processing",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "바이어 PO 수신·파싱·리캡·POCN 처리",
    examplePrompt: "Target 바이어 PO 오더리캡 정리해줘",
  },
  SALES_INVENTORY: {
    label: "Sales & Inventory",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    description: "매출 리포트·재고 현황·수주 분석",
    examplePrompt: "이번 달 일별 매출 리포트 보여줘",
  },
  DESIGN_INTELLIGENCE: {
    label: "Design Intelligence",
    icon: Palette,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "바이어 신제품 크롤링·트렌드·Fit 분석·라인시트",
    examplePrompt: "이번 주 ZARA Trousers 신제품 정리해줘",
  },
  COMMUNICATION: {
    label: "Communication",
    icon: MessageCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "이메일·핸드캐리·주가 알림 자동화",
    examplePrompt: "한세실업 주가 변동 알림 설정해줘",
  },
  PRODUCTION_QUALITY: {
    label: "Production & Quality",
    icon: Factory,
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "IPQC 검사·ERP 모니터링·BOM/WIP 추적",
    examplePrompt: "이번 주 검사 리포트 만들어줘",
  },
  HR_COMPLIANCE: {
    label: "HR & Compliance",
    icon: Users,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    description: "HR 감사·현황 대시보드",
    examplePrompt: "HR 감사 동기화 상태 확인",
  },
  FINANCE_AUDIT: {
    label: "Finance & Audit",
    icon: Calculator,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "재고 분석·BI 대시보드·재무감사 자동화",
    examplePrompt: "BI Daily 대시보드 확인",
  },
}

export function AgentGroupIcon({
  group,
  size = "md",
  showLabel = false,
}: {
  group: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}) {
  const config = AGENT_GROUPS[group]
  if (!config) return null

  const Icon = config.icon
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  }
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl",
          sizeClasses[size],
          config.bgColor
        )}
      >
        <Icon className={cn(iconSizes[size], config.color)} />
      </div>
      {showLabel && (
        <div>
          <p className="text-sm font-semibold text-gray-900">{config.label}</p>
          <p className="text-xs text-gray-500">{config.description}</p>
        </div>
      )}
    </div>
  )
}
