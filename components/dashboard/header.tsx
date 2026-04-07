"use client"

import { useEffect, useState } from "react"
import { Shield, Activity, Radio, Globe, Star, Map } from "lucide-react"
import { risks, globalBenchmarks, REGIONS } from "@/lib/risk-data"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"

export function DashboardHeader() {

  // ✅ ALL HOOKS INSIDE COMPONENT
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [stock, setStock] = useState<any>(null)

  const totalRisks = risks.filter((r) => r.status !== "opportunity").length
  const opportunities = risks.filter((r) => r.status === "opportunity").length
  const benchmarkCount = globalBenchmarks.length
  const international = risks.filter((r) => r.region !== "ksa").length

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

  // ✅ STOCK FETCH (SEPARATE HOOK)
  useEffect(() => {
    fetch("/api/stock")
      .then(res => res.json())
      .then(data => setStock(data))
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm">

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2">
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-risk-low animate-pulse" />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Ma'aden <span className="text-primary">Risk Command</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              Global Enterprise Risk Universe
            </p>
          </div>
        </div>

        {/* 🔥 STOCK DISPLAY */}
        <div className="ml-6 text-sm font-mono">
          {stock ? (
            <div>
              SAR {stock.price?.toFixed(2)}{" "}
              <span className={stock.change > 0 ? "text-green-400" : "text-red-400"}>
                {stock.change?.toFixed(2)}%
              </span>
            </div>
          ) : (
            "Loading..."
          )}
        </div>

      </div>

      <div className="flex items-center gap-6">

        <ThemeToggle />

        <div className="text-right">
          <p className="text-sm font-mono text-primary">
            {time || "--:--:--"}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {date || "---"} AST
          </p>
        </div>

      </div>

    </header>
  )
}