"use client"

import { useState, useMemo } from "react"
import { risks, likelihoodLabels, impactLabels, getRiskColor, getRegionInfo, type Risk } from "@/lib/risk-data"
import { Star } from "lucide-react"

interface RiskHeatmapProps {
  onSelectRisk: (risk: Risk) => void
  selectedRisk: Risk | null
}

type CellDensity = "low" | "medium" | "high"

function getCellDensity(count: number): CellDensity {
  if (count > 25) return "high"
  if (count >= 9) return "medium"
  return "low"
}

function getCategoryBreakdown(cellRisks: Risk[]) {
  return Object.entries(
    cellRisks.reduce<Record<string, number>>((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
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
    <div className="flex min-h-0 flex-col overflow-x-auto overflow-y-visible">
      <div className="mb-2.5 flex shrink-0 flex-col gap-1.5 border-b border-border/40 pb-2.5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="dashboard-section-kicker">
            Primary Risk Surface
          </p>
          <h2 className="dashboard-section-title mt-1 text-[1.18rem] sm:text-[1.35rem]">
            Enterprise Risk Heatmap
          </h2>
          <p className="mt-1 max-w-3xl text-[0.8rem] leading-5 text-muted-foreground">
            Full 5x5 probability-impact matrix across the Ma&apos;aden risk universe.
          </p>
        </div>
      </div>

      <div className="mb-2 grid shrink-0 gap-1.5 text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-risk-critical animate-pulse" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-risk-high" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-risk-medium" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-2.5 w-2.5 text-gold" />
            <span>Opportunity</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          5x5 Probability-Impact Matrix
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[1.5rem] border border-border/40 bg-background/25 p-2 sm:p-2.5">
        <div
          className="grid min-h-0 flex-1 gap-1"
          style={{
            gridTemplateColumns: "44px repeat(5, minmax(0, 1fr))",
            gridTemplateRows: "auto repeat(5, minmax(52px, 1fr))",
          }}
        >
          <div className="flex items-center justify-center rounded-lg border border-border/25 bg-card/20 px-1 py-1 text-center">
            <span className="text-[7px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              P \ I
            </span>
          </div>

          {impactLabels.map((label, i) => (
            <div
              key={label}
              className="flex items-center justify-center rounded-lg border border-border/30 bg-card/30 px-1 py-1 text-center"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              <div>
                <span className="block text-[8px] font-mono text-muted-foreground/70 leading-none">
                  {i + 1}
                </span>
                <span className="mt-0.5 block text-[8px] text-foreground/80 leading-none">
                  {label}
                </span>
              </div>
            </div>
          ))}

          {[5, 4, 3, 2, 1].map((likelihood) => (
            <div
              key={`axis-${likelihood}`}
              className="flex items-center justify-center rounded-lg border border-border/25 bg-card/25 px-1 py-0.5 text-center"
              style={{ gridColumn: 1, gridRow: 7 - likelihood }}
            >
              <div>
                <span className="block text-[7px] font-mono text-muted-foreground/70">
                  {likelihood}
                </span>
                <span className="mt-0.5 block text-[7px] text-foreground/75 leading-none">
                  {likelihoodLabels[likelihood - 1]}
                </span>
              </div>
            </div>
          ))}

          {[5, 4, 3, 2, 1].flatMap((likelihood) =>
            [1, 2, 3, 4, 5].map((impact) => {
              const cellKey = `${likelihood}-${impact}`
              const cellRisks = riskGrid[cellKey] || []
              const bgColor = getRiskColor(likelihood, impact)
              const isHovered = hoveredCell === cellKey
              const score = likelihood * impact
              const isCriticalZone = score >= 20
              const density = getCellDensity(cellRisks.length)
              const categoryBreakdown = getCategoryBreakdown(cellRisks)
              const visibleRisks =
                density === "high"
                  ? cellRisks.slice(0, 12)
                  : cellRisks

              const clusterTone =
                density === "high"
                  ? {
                      opacity: isCriticalZone ? 0.34 : 0.28,
                      innerWidth: "68%",
                      gap: "0.1rem",
                    }
                  : density === "medium"
                    ? {
                        opacity: isCriticalZone ? 0.26 : 0.2,
                        innerWidth: "76%",
                        gap: "0.12rem",
                      }
                    : {
                        opacity: isCriticalZone ? 0.18 : 0.14,
                        innerWidth: "80%",
                        gap: "0.18rem",
                      }

              return (
                <div
                  key={cellKey}
                  className={`group relative flex min-h-[52px] items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 sm:min-h-[56px] lg:min-h-[60px] ${
                    isCriticalZone && cellRisks.length > 0 ? "animate-pulse-gold" : ""
                  }`}
                  style={{
                    gridColumn: impact + 1,
                    gridRow: 7 - likelihood,
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
                  <div className="absolute left-1 top-1 z-10 rounded-md bg-black/15 px-1 py-0.5 text-[7px] font-mono text-muted-foreground/85 backdrop-blur-sm">
                    {cellRisks.length}
                  </div>

                  {cellRisks.length > 0 && (
                    <div
                      className="absolute inset-0 rounded-sm"
                      style={{
                        opacity: clusterTone.opacity,
                        background:
                          density === "high"
                            ? `radial-gradient(circle at center, color-mix(in srgb, ${bgColor} 42%, transparent) 0%, transparent 72%)`
                            : `radial-gradient(circle at center, ${bgColor} 0%, transparent 70%)`,
                      }}
                    />
                  )}

                  <div
                    className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden p-1.5"
                  >
                    <div
                      className="flex max-h-full flex-wrap content-center items-center justify-center overflow-hidden rounded-full px-1 py-1"
                      style={{
                        width: clusterTone.innerWidth,
                        gap: clusterTone.gap,
                        background:
                          density === "high"
                            ? `radial-gradient(circle, color-mix(in srgb, ${bgColor} 28%, transparent) 0%, transparent 78%)`
                            : "transparent",
                      }}
                    >
                    {visibleRisks.map((risk) => {
                      const isSelected = selectedRisk?.id === risk.id
                      const isOpportunity = risk.status === "opportunity"
                      const isInternational = risk.region !== "ksa"
                      const regionInfo = getRegionInfo(risk.region)
                      const sizeClass =
                        density === "high"
                          ? "h-[4px] w-[4px] sm:h-[4.5px] sm:w-[4.5px]"
                          : density === "medium"
                            ? "h-[5px] w-[5px] sm:h-[5.5px] sm:w-[5.5px]"
                            : "h-[7px] w-[7px] sm:h-[8px] sm:w-[8px]"

                      return (
                        <button
                          key={risk.id}
                          onClick={() => onSelectRisk(risk)}
                          className="group relative shrink-0"
                          title={risk.name}
                          aria-label={`View details for ${risk.name}`}
                        >
                          {isOpportunity ? (
                            <Star
                              className={density === "low" ? "h-3 w-3 transition-all duration-300" : "h-2.5 w-2.5 transition-all duration-300"}
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
                                className={`${sizeClass} rounded-full transition-all duration-300`}
                                style={{
                                  backgroundColor: bgColor,
                                  boxShadow: isSelected
                                    ? `0 0 10px ${bgColor}, 0 0 20px ${bgColor}80, 0 0 30px ${bgColor}40`
                                    : isCriticalZone
                                      ? `0 0 7px ${bgColor}90, 0 0 12px ${bgColor}40`
                                      : density === "high"
                                        ? `0 0 4px ${bgColor}70`
                                        : `0 0 6px ${bgColor}80`,
                                  transform: isSelected ? "scale(1.3)" : "scale(1)",
                                  border: isInternational ? `1.5px solid ${regionInfo.color}` : "none",
                                }}
                              />
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
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded border border-border bg-card px-2 py-1 text-[10px] font-mono text-foreground whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
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

                    {density === "high" && cellRisks.length > visibleRisks.length && (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      >
                        <div
                          className="rounded-full border px-2.5 py-1 text-[10px] font-semibold tabular-nums text-foreground backdrop-blur-md"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--card) 80%, transparent)",
                            borderColor: `color-mix(in srgb, ${bgColor} 32%, transparent)`,
                            boxShadow: `0 0 18px color-mix(in srgb, ${bgColor} 30%, transparent)`,
                          }}
                        >
                          {cellRisks.length}
                        </div>
                      </div>
                    )}

                    {cellRisks.length > 0 && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-[170px] -translate-x-1/2 rounded border border-border bg-card px-2.5 py-2 text-[10px] font-mono text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                          {cellRisks.length} risk{cellRisks.length !== 1 ? "s" : ""} in this cell
                        </div>
                        {categoryBreakdown.length > 0 && (
                          <div className="mt-1.5 space-y-1 text-muted-foreground">
                            {categoryBreakdown.map(([category, count]) => (
                              <div key={category} className="flex items-center justify-between gap-2">
                                <span className="truncate">{category}</span>
                                <span className="text-foreground">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
