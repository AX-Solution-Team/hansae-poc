"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SecurityBadge } from "@/components/shared/security-badge"
import { AgentGroupIcon, AGENT_GROUPS } from "@/components/shared/agent-group-icon"
import {
  Search, Star, StarOff, Lock, ArrowRight, Bot,
  ExternalLink
} from "lucide-react"
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

export default function MarketplacePage() {
  useAuthContext()
  const [agents, setAgents] = useState<AgentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [groupFilter, setGroupFilter] = useState("ALL")
  const [classFilter, setClassFilter] = useState("ALL")

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
    if (groupFilter !== "ALL") {
      result = result.filter((a) => a.agentGroup === groupFilter)
    }
    if (classFilter !== "ALL") {
      result = result.filter((a) => a.dataClassification === classFilter)
    }
    return result
  }, [agents, query, groupFilter, classFilter])

  return (
    <>
      <PageHeader title="마켓플레이스" description="승인된 Agent를 검색하고 실행하세요">
        <Badge variant="outline" className="text-xs">
          {agents.length}개 Agent
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Agent 이름, 태그, 설명으로 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={groupFilter} onValueChange={(v) => v && setGroupFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="그룹 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 그룹</SelectItem>
                {Object.entries(AGENT_GROUPS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={(v) => v && setClassFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="데이터 등급" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 등급</SelectItem>
                <SelectItem value="EXTERNAL">External</SelectItem>
                <SelectItem value="BUYER_PORTAL">Buyer Portal</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="RESTRICTED">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-6 h-[200px]" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <Bot className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((agent) => (
                <AgentCardItem
                  key={agent.id}
                  agent={agent}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </PageContent>
    </>
  )
}

function AgentCardItem({
  agent,
  onToggleFavorite,
}: {
  agent: AgentCard
  onToggleFavorite: (id: string, isFav: boolean) => void
}) {
  const isLocked = !agent.demoRunnable
  const isRedirect = agent.runtimeType === "STREAMLIT_HOST" || agent.runtimeType === "BI_CONNECTOR"

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
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <AgentGroupIcon group={agent.agentGroup} size="sm" />
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

        <Link href={`/marketplace/${agent.slug}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-hansae-navy transition-colors mb-1">
            {agent.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {agent.description}
        </p>

        {agent.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {agent.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{agent.owner.displayName}</span>
            <span>실행 {agent.runCount}회</span>
          </div>
          {!isLocked && (
            <Link
              href={isRedirect ? `/apps/${agent.slug}` : `/run?slug=${agent.slug}`}
            >
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-hansae-navy">
                {isRedirect ? (
                  <>열기 <ExternalLink className="w-3 h-3" /></>
                ) : (
                  <>실행 <ArrowRight className="w-3 h-3" /></>
                )}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
