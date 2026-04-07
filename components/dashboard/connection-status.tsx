"use client"

import { useEffect, useState } from "react"
import { Wifi } from "lucide-react"

export function ConnectionStatus() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full animate-pulse"
        style={{
          backgroundColor: "var(--risk-low)",
          boxShadow: "0 0 6px var(--risk-low)",
        }}
      />
      <Wifi className="h-3 w-3" style={{ color: "var(--risk-low)" }} />
      <span
        className="text-[9px] font-mono uppercase tracking-wider"
        style={{ color: "var(--risk-low)" }}
      >
        Connected
      </span>
    </span>
  )
}
