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
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="flex items-center gap-2 mb-2.5">
        <Globe className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Global Intelligence
          </h2>
          <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
            2026 Benchmark Engine | ICMM Aligned
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider transition-all duration-200"
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

      {/* Count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono text-muted-foreground/60">
          {filteredBenchmarks.length} benchmark{filteredBenchmarks.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[9px] font-mono text-primary/50">2026 Benchmark Engine</span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredBenchmarks.map((benchmark) => {
          const style = severityStyles[benchmark.severity]
          return (
            <div
              key={benchmark.id}
              className="group p-2.5 rounded border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-all duration-200 cursor-default"
            >
              {/* Source + severity row */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: style.color,
                      backgroundColor: style.bg,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {benchmark.severity}
                  </span>
                  <span className="text-[8px] font-mono text-primary/50 px-1 py-0.5 rounded bg-primary/5 border border-primary/10">
                    {benchmark.source}
                  </span>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
              </div>

              {/* Risk title */}
              <p className="text-[11px] font-medium text-foreground leading-snug mb-1">
                {benchmark.risk}
              </p>

              {/* Report name */}
              <p className="text-[9px] font-mono text-primary/70 mb-1.5">
                {benchmark.report}
              </p>

              {/* Description */}
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                {benchmark.description}
              </p>

              {/* Relevance */}
              <div className="mt-2 pt-1.5 border-t border-border/30">
                <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-0.5">
                  {"Ma'aden"} Relevance
                </p>
                <p className="text-[9px] text-primary/80 leading-snug">
                  {benchmark.relevance}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
