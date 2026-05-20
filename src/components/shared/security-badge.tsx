import { cn } from "@/lib/utils"
import { Shield, ShieldAlert, ShieldCheck, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  EXTERNAL: {
    label: "External",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: ShieldCheck,
    desc: "외부 공개 데이터 기반",
  },
  BUYER_PORTAL: {
    label: "Buyer Portal",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Shield,
    desc: "바이어 포탈 데이터",
  },
  INTERNAL: {
    label: "Internal",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: ShieldAlert,
    desc: "사내 데이터 — 접근 제한",
  },
  RESTRICTED: {
    label: "Restricted",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: Lock,
    desc: "민감 데이터 — 제한적 접근",
  },
}

export function SecurityBadge({
  classification,
  size = "sm",
}: {
  classification: string
  size?: "sm" | "md"
}) {
  const config = CONFIG[classification] || CONFIG.EXTERNAL
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 font-medium border",
            config.color,
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
          )}
        >
          <Icon className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
          {config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{config.desc}</p>
      </TooltipContent>
    </Tooltip>
  )
}
