"use client"

import { useState } from "react"
import { globalBenchmarks, type GlobalBenchmark } from "@/lib/risk-data"
import { Globe, ExternalLink, BookOpen, Building2, BarChart3 } from "lucide-react"

const severityStyles: Record<
  GlobalBenchmark["severity"],
  { color: string; bg: string; border: string }
> = {
  critical: {
    color: "var(--risk-critical)",
    bg: "color-mix(in srgb, var(--risk-critical) 10%, transparent)",
    border: "color-mix(in srgb, var(--risk-critical) 25%, transparent)",
  },
  high: {
    color: "var(--risk-high)",
    bg: "color-mix(in srgb, var(--risk-high) 10%, transparent)",
    border: "color-mix(in srgb, var(--risk-high) 25%, transparent)",
  },
  medium: {
    color: "var(--risk-medium)",
    bg: "color-mix(in srgb, var(--risk-medium) 10%, transparent)",
    border: "color-mix(in srgb, var(--risk-medium) 25%, transparent)",
  },
}

type FilterTab = "all" | "Risk Intelligence" | "Strategic Insights" | "World Bank"

export function GlobalBenchmarks() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const filteredBenchmarks =
    activeTab === "all"
      ? globalBenchmarks
      : globalBenchmarks.filter((b) => b.source === activeTab)

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <Globe className="h-3 w-3" /> },
    { key: "Risk Intelligence", label: "Risk Intelligence", icon: <BarChart3 className="h-3 w-3" /> },
    { key: "Strategic Insights", label: "Strategic Insights", icon: <BookOpen className="h-3 w-3" /> },
    { key: "World Bank", label: "WB", icon: <Building2 className="h-3 w-3" /> },
  ]

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 border-b border-border/35 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <p className="dashboard-section-kicker">
                External Context
              </p>
            </div>
            <h2 className="dashboard-section-title mt-1.5">
              Global Benchmarks
            </h2>
            <p className="dashboard-section-copy mt-1 text-sm leading-tight">
              Executive reference points from Risk Intelligence, Strategic Insights, and the World Bank.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-border/50 bg-background/35 px-2.5 py-1.5 text-right">
            <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              Active Benchmarks
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
              {filteredBenchmarks.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] transition-all duration-200"
            style={{
              color:
                activeTab === tab.key
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
              backgroundColor:
                activeTab === tab.key
                  ? "var(--primary)"
                  : "transparent",
              border: `1px solid ${
                activeTab === tab.key
                  ? "var(--primary)"
                  : "var(--border)"
              }`,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between text-[9px] text-muted-foreground">
        <span className="font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
          {filteredBenchmarks.length} reference point{filteredBenchmarks.length !== 1 ? "s" : ""}
        </span>
        <span className="font-mono uppercase tracking-[0.16em] text-primary/60">2026 Benchmark Engine</span>
      </div>

      <div className="min-h-0 flex-1">
        <div className="flex flex-col gap-2">
        {filteredBenchmarks.map((benchmark) => {
          const style = severityStyles[benchmark.severity]
          return (
            <div
              key={benchmark.id}
              className="group rounded-2xl border border-border/45 bg-background/30 p-3 transition-all duration-200 hover:border-border/70 hover:bg-card/30"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
                  <span
                    className="rounded-full px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em]"
                    style={{
                      color: style.color,
                      backgroundColor: style.bg,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {benchmark.severity}
                  </span>
                  <span className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-primary/65">
                    {benchmark.source}
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/55">
                    {benchmark.year}
                  </span>
                </div>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary/60" />
              </div>

              <p className="mb-1 text-sm font-semibold leading-tight text-foreground">
                {benchmark.risk}
              </p>

              <p className="mb-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-primary/70">
                {benchmark.report}
              </p>

              <p className="text-[13px] leading-tight text-muted-foreground">
                {benchmark.description}
              </p>

              <div className="mt-2 rounded-xl border border-border/35 bg-card/25 p-2.5">
                <p className="mb-1 text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                  {"Ma'aden"} Relevance
                </p>
                <p className="text-[13px] leading-tight text-foreground/85">
                  {benchmark.relevance}
                </p>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
