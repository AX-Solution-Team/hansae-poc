"use client"

import { useState, useEffect } from "react"
import { PageHeader, PageContent } from "@/components/layout/app-shell"
import { useAuthContext } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Users, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type UserEntry = {
  id: string
  displayName: string
  email: string
  role: string
  team: { name: string } | null
  createdAt: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  USER:     { label: "사용자", color: "bg-blue-50 text-blue-700 border-blue-200" },
  CREATOR:  { label: "제작자", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  APPROVER: { label: "승인자", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ADMIN:    { label: "관리자", color: "bg-red-50 text-red-700 border-red-200" },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export default function AdminUsersPage() {
  useAuthContext()
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const json = await res.json()
      if (json.data) {
        setUsers(json.data.items || json.data)
      }
    } catch {
      toast.error("사용자 목록을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="사용자 관리" description="플랫폼 사용자 현황을 확인합니다">
        <Badge variant="outline" className="text-xs gap-1">
          <UserCheck className="w-3 h-3" />
          {users.length}명
        </Badge>
      </PageHeader>
      <PageContent>
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="pl-4">이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>팀</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j} className={j === 0 ? "pl-4" : ""}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500">등록된 사용자가 없습니다</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="pl-4">
                          <span className="text-sm font-medium text-gray-900">
                            {u.displayName}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-medium border", roleConf.color)}
                          >
                            {roleConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {u.team?.name || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(u.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageContent>
    </>
  )
}
