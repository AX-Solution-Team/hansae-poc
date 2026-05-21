"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SecurityBadge } from "@/components/shared/security-badge"
import { AgentGroupIcon, AGENT_GROUPS } from "@/components/shared/agent-group-icon"
import {
  Search, Star, StarOff, Lock, ArrowRight, Bot, TrendingUp,
  Flame, Building2, Bookmark, FolderOpen, GitFork, GitPullRequest,
  Trophy, Sparkles, Eye, BarChart3, Clock, ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type AgentCard = {
  id: string
  slug: string
  name: string
  description: string
  agentGroup: string
  dataClassification: string
  tags: string[]
  owner: { displayName: string }
  runCount: number
  lastRunAt: string | null
  demoRunnable: boolean
  lockedReason: string | null
  isFavorite: boolean
  runtimeType: string
}

const TAG_FILTERS = ["All", "Official", "Custom", "Automation", "Data Analysis", "Report"]

const SIDEBAR_NAV = {
  explore: [
    { key: "popular", label: "인기 Agent", icon: Flame },
    { key: "department", label: "부서별 카테고리", icon: Building2 },
    { key: "favorites", label: "즐겨찾기", icon: Bookmark },
  ],
  workspace: [
    { key: "projects", label: "내 프로젝트", icon: FolderOpen, count: 12 },
    { key: "forks", label: "Fork 목록", icon: GitFork, count: 8 },
    { key: "contributions", label: "기여 현황 (PR)", icon: GitPullRequest },
  ],
  collections: [
    { key: "top-rated", label: "Top Rated", icon: Trophy },
    { key: "new-arrivals", label: "New Arrivals", icon: Sparkles },
  ],
}

const MOCK_RATINGS: Record<string, { rating: number; views: number; forks: number }> = {
  "po-order-recap": { rating: 4.9, views: 1200, forks: 42 },
  "design-zara-trousers": { rating: 4.8, views: 850, forks: 12 },
  "design-target-trousers": { rating: 4.7, views: 720, forks: 8 },
  "design-walmart-trousers": { rating: 4.6, views: 680, forks: 6 },
  "design-alvanon": { rating: 4.5, views: 540, forks: 5 },
  "design-linesheet": { rating: 4.4, views: 460, forks: 15 },
  "po-pocn": { rating: 4.6, views: 380, forks: 10 },
  "po-pivot": { rating: 4.3, views: 290, forks: 7 },
  "po-download": { rating: 4.5, views: 510, forks: 18 },
  "po-sample-pdf-excel": { rating: 4.4, views: 440, forks: 14 },
  "po-trim-order": { rating: 4.2, views: 320, forks: 4 },
  "sales-report": { rating: 4.7, views: 2100, forks: 156 },
  "comm-stock-alert": { rating: 4.3, views: 620, forks: 3 },
  "comm-email-fit": { rating: 4.6, views: 540, forks: 8 },
  "comm-handcarry": { rating: 4.1, views: 210, forks: 2 },
  "prod-inspection": { rating: 4.5, views: 420, forks: 5 },
  "prod-erp-monitor": { rating: 4.4, views: 380, forks: 9 },
  "prod-bom-wip": { rating: 4.3, views: 250, forks: 3 },
  "analytics-inventory": { rating: 4.9, views: 3400, forks: 28 },
  "hr-auditsync": { rating: 4.2, views: 180, forks: 1 },
  "hr-dashboard": { rating: 4.1, views: 150, forks: 2 },
  "finance-audit-pad": { rating: 4.0, views: 130, forks: 1 },
  "bi-daily": { rating: 4.5, views: 890, forks: 11 },
}

const OFFICIAL_SLUGS = new Set([
  "po-order-recap", "design-zara-trousers", "design-target-trousers",
  "design-walmart-trousers", "design-alvanon", "design-linesheet",
  "po-pocn", "po-pivot", "po-download", "po-sample-pdf-excel",
  "po-trim-order", "prod-inspection", "prod-erp-monitor", "bi-daily",
])

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function MarketplacePage() {
  useAuthContext()
  const [agents, setAgents] = useState<AgentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [sidebarSection, setSidebarSection] = useState("popular")
  const [tagFilter, setTagFilter] = useState("All")

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/marketplace")
      const json = await res.json()
      if (json.data?.items) setAgents(json.data.items)
    } catch {
      toast.error("마켓플레이스를 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (agentId: string, isFav: boolean) => {
    const method = isFav ? "DELETE" : "POST"
    await fetch(`/api/favorites/${agentId}`, { method })
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, isFavorite: !isFav } : a
      )
    )
  }

  const filtered = useMemo(() => {
    let result = agents

    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (sidebarSection === "favorites") {
      result = result.filter((a) => a.isFavorite)
    } else if (sidebarSection === "top-rated") {
      result = [...result].sort((a, b) => (MOCK_RATINGS[b.slug]?.rating || 0) - (MOCK_RATINGS[a.slug]?.rating || 0))
    } else if (sidebarSection === "new-arrivals") {
      result = [...result].sort((a, b) => (b.lastRunAt || "").localeCompare(a.lastRunAt || ""))
    }

    if (tagFilter === "Official") {
      result = result.filter((a) => OFFICIAL_SLUGS.has(a.slug))
    } else if (tagFilter === "Custom") {
      result = result.filter((a) => !OFFICIAL_SLUGS.has(a.slug))
    } else if (tagFilter === "Automation") {
      result = result.filter((a) => a.runtimeType === "PYTHON_JOB" || a.runtimeType === "WINDOWS_WORKER")
    } else if (tagFilter === "Data Analysis") {
      result = result.filter((a) => a.agentGroup === "DESIGN_INTELLIGENCE" || a.agentGroup === "SALES_INVENTORY" || a.agentGroup === "FINANCE_AUDIT")
    } else if (tagFilter === "Report") {
      result = result.filter((a) => a.slug.includes("report") || a.slug.includes("bi-") || a.slug.includes("inspection") || a.slug.includes("linesheet"))
    }

    return result
  }, [agents, query, sidebarSection, tagFilter])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* KPI Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">인기 Agent 스토어</h1>
            <p className="text-sm text-gray-500 mt-0.5">승인된 Agent를 검색하고 실행하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/build">
              <Button variant="outline" size="sm">+ Agent 등록</Button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">활성 Agent</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{agents.length > 0 ? 248 : 0}개</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 12.5%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">주간 실행</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">42,841회</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 8.2%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">절감 시간</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">12,400h</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 15.4%
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-red-600 font-medium">전사 도입률</p>
            <p className="text-2xl font-bold text-red-700 mt-1">92%</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 3.1%
            </p>
          </div>
        </div>
      </div>

      {/* Main body with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 py-4 px-3">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">탐색</p>
          <div className="space-y-0.5 mb-4">
            {SIDEBAR_NAV.explore.map((item) => {
              const Icon = item.icon
              const isActive = sidebarSection === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setSidebarSection(item.key)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-hansae-navy text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>

          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">워크스페이스</p>
          <div className="space-y-0.5 mb-4">
            {SIDEBAR_NAV.workspace.map((item) => {
              const Icon = item.icon
              const isActive = sidebarSection === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setSidebarSection(item.key)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-hansae-navy text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.count && (
                    <span className={cn("text-xs", isActive ? "text-white/70" : "text-gray-400")}>
                      ({item.count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Collections</p>
          <div className="space-y-0.5">
            {SIDEBAR_NAV.collections.map((item) => {
              const Icon = item.icon
              const isActive = sidebarSection === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setSidebarSection(item.key)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-hansae-navy text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search + Tag filters */}
          <div className="mb-5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="바이어명, 업무 키워드, 작성자 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 max-w-2xl"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {TAG_FILTERS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                    tagFilter === tag
                      ? "bg-hansae-navy text-white border-hansae-navy"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-6 h-[220px]" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <Bot className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((agent) => (
                <AgentStoreCard
                  key={agent.id}
                  agent={agent}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Footer info */}
          <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {filtered.length} of {agents.length} Agents</span>
            <span>최종 동기화: 2026.05.20 14:30 | v2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentStoreCard({
  agent,
  onToggleFavorite,
}: {
  agent: AgentCard
  onToggleFavorite: (id: string, isFav: boolean) => void
}) {
  const isLocked = !agent.demoRunnable
  const isOfficial = OFFICIAL_SLUGS.has(agent.slug)
  const stats = MOCK_RATINGS[agent.slug] || { rating: 4.0, views: 100, forks: 1 }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      {isLocked && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 max-w-[180px]">
              {agent.lockedReason || "현재 실행할 수 없습니다"}
            </p>
          </div>
        </div>
      )}
      <CardContent className="p-5">
        {/* Top row: icon + badge + favorite */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <AgentGroupIcon group={agent.agentGroup} size="sm" />
            <Badge
              className={cn(
                "text-[10px] font-bold px-1.5 py-0",
                isOfficial
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-blue-50 text-blue-600 border-blue-200"
              )}
              variant="outline"
            >
              {isOfficial ? "Official" : "Custom"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <SecurityBadge classification={agent.dataClassification} />
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleFavorite(agent.id, agent.isFavorite)
              }}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {agent.isFavorite ? (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              ) : (
                <StarOff className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Title + Author */}
        <Link href={`/marketplace/${agent.slug}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-hansae-navy transition-colors mb-0.5">
            {agent.name}
          </h3>
        </Link>
        <p className="text-[11px] text-gray-400 mb-2">By {agent.owner.displayName}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {agent.description}
        </p>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {agent.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats row: rating, views, forks */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {stats.rating}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Eye className="w-3 h-3" />
            {formatCount(stats.views)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <GitFork className="w-3 h-3" />
            {stats.forks} Forks
          </span>
          {!isLocked && (
            <Link href={`/apps/${agent.slug}`} className="ml-auto">
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-hansae-navy">
                실행 <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
