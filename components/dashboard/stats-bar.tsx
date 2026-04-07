"use client"

import { useState } from "react"
import { risks, getRiskColor, getRegionInfo, type Risk } from "@/lib/risk-data"
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Globe,
  Star,
  Map,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

type StatKey = "critical" | "high" | "international" | "benchmarkSources" | "opportunities" | "total"

interface StatConfig {
  key: StatKey
  label: string
  icon: React.ElementType
  color: string
  getRisks: () => Risk[]
}

interface StatsBarProps {
  onSelectRisk?: (risk: Risk) => void
}

export function StatsBar({ onSelectRisk }: StatsBarProps) {
  const [expanded, setExpanded] = useState<StatKey | null>(null)

  const stats: StatConfig[] = [
    {
      key: "critical",
      label: "Critical Risks",
      icon: AlertTriangle,
      color: "var(--risk-critical)",
      getRisks: () => risks.filter((r) => r.likelihood * r.impact >= 20 && r.status !== "opportunity"),
    },
    {
      key: "high",
      label: "High Risks",
      icon: TrendingUp,
      color: "var(--risk-high)",
      getRisks: () => risks.filter((r) => r.likelihood * r.impact >= 12 && r.likelihood * r.impact < 20 && r.status !== "opportunity"),
    },
    {
      key: "international",
      label: "International",
      icon: Map,
      color: "#7B93DB",
      getRisks: () => risks.filter((r) => r.region !== "ksa"),
    },
    {
      key: "benchmarkSources",
      label: "Benchmark Sources",
      icon: Globe,
      color: "var(--chart-5)",
      getRisks: () => risks.filter((r) => r.source === "riskIntelligence" || r.source === "strategicInsights"),
    },
    {
      key: "opportunities",
      label: "Opportunities",
      icon: Star,
      color: "var(--gold)",
      getRisks: () => risks.filter((r) => r.status === "opportunity"),
    },
    {
      key: "total",
      label: "Total Universe",
      icon: Shield,
      color: "var(--risk-low)",
      getRisks: () => risks,
    },
  ]

  const handleToggle = (key: StatKey) => {
    setExpanded(expanded === key ? null : key)
  }

  const expandedStat = stats.find((s) => s.key === expanded)
  const expandedRisks = expandedStat?.getRisks() || []

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon
          const count = stat.getRisks().length
          const isExpanded = expanded === stat.key

          return (
            <button
              key={stat.key}
              onClick={() => handleToggle(stat.key)}
              className={`flex items-center gap-3 p-3 rounded border transition-all duration-200 text-left group ${
                isExpanded
                  ? "ring-2 ring-offset-1 ring-offset-background"
                  : "hover:border-primary/30"
              }`}
              style={{
                backgroundColor: isExpanded
                  ? `color-mix(in srgb, ${stat.color} 8%, var(--card))`
                  : "color-mix(in srgb, var(--card) 50%, transparent)",
                borderColor: isExpanded
                  ? stat.color
                  : "color-mix(in srgb, var(--border) 50%, transparent)",
                // @ts-ignore
                "--tw-ring-color": stat.color,
              }}
            >
              <div
                className="h-8 w-8 rounded flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: `color-mix(in srgb, ${stat.color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stat.color} 25%, transparent)`,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xl font-bold font-mono leading-none"
                  style={{ color: stat.color }}
                >
                  {count}
                </p>
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5 truncate">
                  {stat.label}
                </p>
              </div>
              <div
                className="h-5 w-5 rounded flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: isExpanded
                    ? stat.color
                    : `color-mix(in srgb, ${stat.color} 10%, transparent)`,
                  color: isExpanded ? "var(--background)" : stat.color,
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded dropdown panel */}
      <AnimatePresence>
        {expanded && expandedStat && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-lg border p-3"
              style={{
                backgroundColor: "var(--card)",
                borderColor: expandedStat.color,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <expandedStat.icon
                    className="h-4 w-4"
                    style={{ color: expandedStat.color }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: expandedStat.color }}
                  >
                    {expandedStat.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({expandedRisks.length} risks)
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(null)}
                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {expandedRisks.slice(0, 30).map((risk) => {
                  const score = risk.likelihood * risk.impact
                  const riskColor = getRiskColor(risk.likelihood, risk.impact)
                  const regionInfo = getRegionInfo(risk.region)
                  const isInternational = risk.region !== "ksa"

                  return (
                    <button
                      key={risk.id}
                      onClick={() => {
                        if (onSelectRisk) {
                          onSelectRisk(risk)
                          setExpanded(null)
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded text-left transition-all duration-150 hover:bg-primary/10 hover:border-primary/30 border border-transparent group"
                    >
                      <span
                        className="text-[9px] font-mono text-muted-foreground w-12 shrink-0 group-hover:text-primary"
                      >
                        {risk.id}
                      </span>
                      {isInternational && (
                        <span className="text-[10px] shrink-0" title={regionInfo.label}>
                          {regionInfo.flag}
                        </span>
                      )}
                      {risk.status === "opportunity" && (
                        <Star className="h-3 w-3 shrink-0" style={{ color: "var(--gold)" }} />
                      )}
                      <span className="text-[11px] text-foreground flex-1 truncate group-hover:text-primary">
                        {risk.name}
                      </span>
                      <span
                        className="text-[9px] font-mono font-bold shrink-0"
                        style={{ color: riskColor }}
                      >
                        {score}
                      </span>
                      <span
                        className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          color: riskColor,
                          backgroundColor: `color-mix(in srgb, ${riskColor} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${riskColor} 25%, transparent)`,
                        }}
                      >
                        {risk.category}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 group-hover:text-primary shrink-0">
                        View
                      </span>
                    </button>
                  )
                })}
                {expandedRisks.length > 30 && (
                  <div className="text-center py-2 text-[10px] text-muted-foreground font-mono">
                    +{expandedRisks.length - 30} more risks
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
