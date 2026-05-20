"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"

export type SessionUser = {
  id: string
  email: string
  displayName: string
  role: "USER" | "CREATOR" | "APPROVER" | "ADMIN"
  teamId: string
}

type AuthState = {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const json = await res.json()
        setUser(json.data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error?.message || "로그인 실패")
    }
    const json = await res.json()
    setUser(json.data.user)
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  return { user, loading, login, logout, refresh }
}

const AuthContext = createContext<AuthState | null>(null)

export const AuthProvider = AuthContext.Provider

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
  return ctx
}
