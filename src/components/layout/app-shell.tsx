"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/hooks/use-auth"
import {
  Home, MessageSquare, Store, Hammer, CheckSquare, Bot,
  LayoutGrid, Shield, ChevronLeft, ChevronRight, LogOut,
  User, History, Settings, ArrowRightLeft, Eye,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ROLE_HIERARCHY = ["USER", "CREATOR", "APPROVER", "ADMIN"] as const

function hasMinRole(userRole: string, minRole: string): boolean {
  return ROLE_HIERARCHY.indexOf(userRole as typeof ROLE_HIERARCHY[number]) >=
    ROLE_HIERARCHY.indexOf(minRole as typeof ROLE_HIERARCHY[number])
}

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  minRole?: string
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/run", label: "실행", icon: MessageSquare },
  { href: "/run/jobs", label: "실행 이력", icon: History },
  { href: "/marketplace", label: "마켓플레이스", icon: Store },
  { href: "/build", label: "빌드", icon: Hammer, minRole: "CREATOR" },
  { href: "/build/migration", label: "자산 마이그레이션", icon: ArrowRightLeft, minRole: "CREATOR" },
  { href: "/approvals", label: "승인함", icon: CheckSquare, minRole: "APPROVER" },
  { href: "/agents", label: "에이전트", icon: Bot },
  { href: "/admin/governance", label: "거버넌스", icon: Eye, minRole: "ADMIN" },
  { href: "/admin/audit", label: "감사 로그", icon: Shield, minRole: "ADMIN" },
  { href: "/admin/users", label: "사용자 관리", icon: User, minRole: "ADMIN" },
  { href: "/admin/agents", label: "에이전트 관리", icon: LayoutGrid, minRole: "ADMIN" },
  { href: "/admin/runtime", label: "런타임 정책", icon: Settings, minRole: "ADMIN" },
]

const ROLE_LABELS: Record<string, string> = {
  USER: "사용자",
  CREATOR: "제작자",
  APPROVER: "승인자",
  ADMIN: "관리자",
}

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-blue-100 text-blue-700",
  CREATOR: "bg-emerald-100 text-emerald-700",
  APPROVER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthContext()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasMinRole(user.role, item.minRole)
  )

  const mainNavItems = visibleItems.filter(
    (item) => !item.href.startsWith("/admin")
  )
  const adminNavItems = visibleItems.filter(
    (item) => item.href.startsWith("/admin")
  )

  return (
    <TooltipProvider delayDuration={0}>
    <div className="flex h-screen bg-hansae-surface">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
            collapsed ? "w-[68px]" : "w-[260px]"
          )}
        >
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg hansae-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              {!collapsed && (
                <div className="min-w-0 animate-fade-in">
                  <h1 className="text-sm font-bold text-hansae-navy truncate">
                    AI Agent Platform
                  </h1>
                  <p className="text-[10px] text-gray-400 truncate">HANSAE</p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                const Icon = item.icon

                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-hansae-navy text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[10px] h-5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return link
              })}
            </div>

            {adminNavItems.length > 0 && (
              <>
                <Separator className="my-4" />
                {!collapsed && (
                  <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    관리
                  </p>
                )}
                <div className="space-y-1">
                  {adminNavItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon

                    const link = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-hansae-navy text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return link
                  })}
                </div>
              </>
            )}
          </nav>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 mx-3 mb-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* User profile */}
          <div className="border-t border-gray-100 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors",
                    collapsed && "justify-center"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-hansae-navy text-white text-xs font-medium">
                      {user.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName}
                      </p>
                      <Badge
                        className={cn(
                          "text-[10px] h-4 px-1.5",
                          ROLE_COLORS[user.role]
                        )}
                        variant="secondary"
                      >
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout().then(() => window.location.href = "/login")}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Footer */}
          {!collapsed && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">
                Powered by TeamSparta AX
              </p>
            </div>
          )}
        </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
    </TooltipProvider>
  )
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-8", className)}>
      {children}
    </div>
  )
}
