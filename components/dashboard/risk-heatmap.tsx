"use client"

import { useState, useMemo } from "react"
import { risks, likelihoodLabels, impactLabels, getRiskColor, getRegionInfo, type Risk } from "@/lib/risk-data"
import { Star } from "lucide-react"

interface RiskHeatmapProps {
  onSelectRisk: (risk: Risk) => void
  selectedRisk: Risk | null
}

export function RiskHeatmap({ onSelectRisk, selectedRisk }: RiskHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const riskGrid = useMemo(() => {
    const grid: Record<string, Risk[]> = {}
    risks.forEach((risk) => {
      const key = `${risk.likelihood}-${risk.impact}`
      if (!grid[key]) grid[key] = []
      grid[key].push(risk)
    })
    return grid
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Risk Universe
          </h2>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            5x5 Probability-Impact Matrix | {risks.length} risks mapped
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-risk-critical animate-pulse" />
            <span className="text-muted-foreground">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-risk-high" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-risk-medium" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5 text-gold" />
            <span className="text-muted-foreground">Opportunity</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Impact label */}
        <div className="flex items-center justify-center mb-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
            Impact
          </span>
          <span className="text-[9px] ml-1 text-muted-foreground/50">{"→"}</span>
        </div>

        <div className="flex flex-1 gap-1">
          {/* Likelihood label */}
          <div className="flex items-center justify-center w-5 shrink-0">
            <span
              className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Likelihood
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            {/* Column headers */}
            <div className="grid grid-cols-5 gap-1 pl-0">
              {impactLabels.map((label, i) => (
                <div key={label} className="text-center">
                  <span className="text-[8px] font-mono text-muted-foreground/70 leading-none">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid rows (5 to 1, top to bottom) */}
            {[5, 4, 3, 2, 1].map((likelihood) => (
              <div key={likelihood} className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((impact) => {
                  const cellKey = `${likelihood}-${impact}`
                  const cellRisks = riskGrid[cellKey] || []
                  const bgColor = getRiskColor(likelihood, impact)
                  const isHovered = hoveredCell === cellKey
                  const score = likelihood * impact
                  const isCriticalZone = score >= 20

                  return (
                    <div
                      key={cellKey}
                      className={`flex-1 relative rounded-sm border flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isCriticalZone && cellRisks.length > 0 ? "animate-pulse-gold" : ""
                      }`}
                      style={{
                        backgroundColor: isHovered
                          ? bgColor
                          : `color-mix(in srgb, ${bgColor} 12%, transparent)`,
                        borderColor: isCriticalZone && cellRisks.length > 0
                          ? `color-mix(in srgb, ${bgColor} 60%, transparent)`
                          : "color-mix(in srgb, var(--border) 50%, transparent)",
                        boxShadow: isHovered
                          ? `0 0 12px ${bgColor}40, inset 0 0 12px ${bgColor}20`
                          : isCriticalZone && cellRisks.length > 0
                            ? `0 0 8px ${bgColor}30`
                            : "none",
                      }}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Cell background glow for occupied cells */}
                      {cellRisks.length > 0 && (
                        <div
                          className="absolute inset-0 rounded-sm"
                          style={{
                            opacity: isCriticalZone ? 0.3 : 0.2,
                            background: `radial-gradient(circle at center, ${bgColor} 0%, transparent 70%)`,
                          }}
                        />
                      )}

                      {/* Risk dots */}
                      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1 p-1">
                        {cellRisks.map((risk) => {
                          const isSelected = selectedRisk?.id === risk.id
                          const isOpportunity = risk.status === "opportunity"
                          const isInternational = risk.region !== "ksa"
                          const regionInfo = getRegionInfo(risk.region)

                          return (
                            <button
                              key={risk.id}
                              onClick={() => onSelectRisk(risk)}
                              className="group relative"
                              title={risk.name}
                              aria-label={`View details for ${risk.name}`}
                            >
                              {isOpportunity ? (
                                <Star
                                  className="h-3.5 w-3.5 transition-all duration-300"
                                  style={{
                                    color: "var(--gold)",
                                    filter: isSelected
                                      ? "drop-shadow(0 0 8px var(--gold))"
                                      : "drop-shadow(0 0 3px var(--gold-dim))",
                                    transform: isSelected ? "scale(1.4)" : "scale(1)",
                                  }}
                                />
                              ) : (
                                <div className="relative">
                                  <div
                                    className="h-3 w-3 rounded-full transition-all duration-300"
                                    style={{
                                      backgroundColor: bgColor,
                                      boxShadow: isSelected
                                        ? `0 0 10px ${bgColor}, 0 0 20px ${bgColor}80, 0 0 30px ${bgColor}40`
                                        : isCriticalZone
                                          ? `0 0 8px ${bgColor}90, 0 0 14px ${bgColor}40`
                                          : `0 0 6px ${bgColor}80`,
                                      transform: isSelected ? "scale(1.3)" : "scale(1)",
                                      border: isInternational ? `1.5px solid ${regionInfo.color}` : "none",
                                    }}
                                  />
                                  {/* International flag indicator */}
                                  {isInternational && (
                                    <span
                                      className="absolute -top-1.5 -right-1.5 text-[6px] leading-none pointer-events-none"
                                      style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))" }}
                                    >
                                      {regionInfo.flag}
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded text-[9px] font-mono text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                <span className="flex items-center gap-1">
                                  {isInternational && <span className="text-[8px]">{regionInfo.flag}</span>}
                                  {risk.name}
                                </span>
                                <div
                                  className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent"
                                  style={{ borderTopColor: "var(--border)" }}
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Row labels at bottom */}
            <div className="grid grid-cols-5 gap-1 mt-0.5">
              {impactLabels.map((label) => (
                <div key={label} className="text-center">
                  <span className="text-[7px] font-mono text-muted-foreground/50 leading-none">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Likelihood labels on the right */}
          <div className="flex flex-col gap-1 w-5 shrink-0 pt-3.5 pb-4">
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} className="flex-1 flex items-center justify-center">
                <span className="text-[8px] font-mono text-muted-foreground/70">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
