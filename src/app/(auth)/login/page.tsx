"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Bot } from "lucide-react"

const DEMO_ACCOUNTS = [
  { email: "user@hansae.demo", role: "USER", name: "김실무", desc: "일반 사용자" },
  { email: "creator@hansae.demo", role: "CREATOR", name: "이제작", desc: "Agent 제작자" },
  { email: "approver@hansae.demo", role: "APPROVER", name: "박팀장", desc: "승인 권한자" },
  { email: "admin@hansae.demo", role: "ADMIN", name: "최관리", desc: "시스템 관리자" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message || "로그인에 실패했습니다")
        return
      }
      toast.success(`${json.data.user.displayName}님, 환영합니다!`)
      router.push("/")
    } catch {
      toast.error("네트워크 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(account.email)
    setPassword("demo1234")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-[480px] hansae-gradient flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">HANSAE</h2>
              <p className="text-white/60 text-xs">AI Agent Platform</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            AI Agent로
            <br />
            업무를 혁신하세요
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            20개 자동화 자산을 하나의 플랫폼에서 만들고, 공유하고, 실행하세요.
            Teams 한 줄 명령으로 시작할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
            <Bot className="w-5 h-5 text-white/80 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">23개 Agent 등록 완료</p>
              <p className="text-white/60 text-xs mt-0.5">
                Design · PO · Sales · Communication · Production · HR · Finance
              </p>
            </div>
          </div>
          <p className="text-white/40 text-xs text-center">
            Powered by TeamSparta AX
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-hansae-surface">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl hansae-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h2 className="font-bold text-hansae-navy text-lg">HANSAE</h2>
              <p className="text-gray-400 text-xs">AI Agent Platform</p>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">로그인</CardTitle>
              <CardDescription>
                데모 계정으로 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@hansae.demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="demo1234"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-hansae-navy hover:bg-hansae-navy-light"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  로그인
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-xs text-gray-500 mb-3 font-medium">
                  데모 계정 바로가기
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => quickLogin(account)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:border-hansae-navy/30 hover:bg-hansae-navy/5 transition-all text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-hansae-navy/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-hansae-navy">
                          {account.name[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {account.name}
                        </p>
                        <p className="text-[10px] text-gray-500">{account.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
