"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth, AuthProvider } from "@/hooks/use-auth"
import { AppShell } from "./app-shell"

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.replace("/login")
    }
  }, [auth.loading, auth.user, router])

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-hansae-surface">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/brand/Hansae-logo.jpg"
            alt="HANSAE"
            className="h-10 w-auto object-contain animate-pulse-subtle"
          />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!auth.user) return null

  return (
    <AuthProvider value={auth}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
