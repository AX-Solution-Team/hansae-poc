"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-sm text-gray-500 mb-1">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
        )}
        <Button onClick={reset} className="mt-4">
          다시 시도
        </Button>
      </div>
    </div>
  )
}
