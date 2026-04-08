"use client"

import { useEffect, useState } from "react"
import { Shield, Activity, Globe } from "lucide-react"
import { REGIONS } from "@/lib/risk-data"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { ContextVault } from "@/components/dashboard/context-vault"

export function DashboardHeader() {

  // ✅ ALL HOOKS INSIDE COMPONENT
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  // ✅ CLOCK
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Riyadh",
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Riyadh",
        })
      )
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="border-b border-border/40 bg-card/55 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-2.5 px-4 py-2.5 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative mt-0.5 shrink-0 rounded-2xl border border-primary/20 bg-primary/8 p-2">
              <Shield className="h-5 w-5 text-primary" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-risk-low animate-pulse" />
            </div>

            <div className="min-w-0">
              <p className="dashboard-section-kicker">
                Ma'aden Executive Dashboard
              </p>
              <h1 className="mt-0.5 text-[1.28rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[1.52rem]">
                Ma'aden <span className="text-primary">Risk Command Centre</span>
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3 w-3 text-primary/75" />
                  CEO / CRO command surface
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3 text-primary/70" />
                  {REGIONS.length} tracked regions
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-3">
          <ContextVault />
          <ThemeToggle />
          <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-right">
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              Riyadh time
            </div>
            <div className="mt-1">
              <p className="text-[0.95rem] font-mono tabular-nums text-primary">
                {time || "--:--:--"}
              </p>
              <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                {date || "---"} AST
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
