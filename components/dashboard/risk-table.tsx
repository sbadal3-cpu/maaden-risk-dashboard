"use client"

import { useState, useMemo } from "react"
import {
  risks,
  getRiskColor,
  getRiskLevel,
  getSourceLabel,
  getSourceColor,
  getRegionInfo,
  REGIONS,
  type Risk,
  type RiskSource,
  type Region,
} from "@/lib/risk-data"
import { ChevronRight, Search, ChevronLeft, Star, Globe, Download } from "lucide-react"
import { exportMasterRiskRegister } from "@/lib/excel-export"
import { triggerExportToast } from "@/components/dashboard/export-toast"

interface RiskTableProps {
  onSelectRisk: (risk: Risk) => void
  selectedRisk: Risk | null
}

type CategoryTab = "all" | "benchmarkSources" | "regional" | "internal"

const ITEMS_PER_PAGE = 10

export function RiskTable({ onSelectRisk, selectedRisk }: RiskTableProps) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<CategoryTab>("all")
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let list = risks

    // Tab filter
    if (tab === "benchmarkSources") {
      list = list.filter((r) => r.source === "riskIntelligence" || r.source === "strategicInsights")
    } else if (tab === "regional") {
      list = list.filter((r) => r.source === "regional")
    } else if (tab === "internal") {
      list = list.filter((r) => r.source === "internal")
    }

    // Region filter
    if (regionFilter !== "all") {
      list = list.filter((r) => r.region === regionFilter)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          getRegionInfo(r.region).label.toLowerCase().includes(q)
      )
    }

    return list
  }, [tab, regionFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  )

  const handleTabChange = (t: CategoryTab) => {
    setTab(t)
    setPage(1)
  }

  const handleRegionChange = (r: Region | "all") => {
    setRegionFilter(r)
    setPage(1)
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const tabs: { key: CategoryTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: risks.length },
    {
      key: "benchmarkSources",
      label: "Benchmark Sources",
      count: risks.filter((r) => r.source === "riskIntelligence" || r.source === "strategicInsights").length,
    },
    {
      key: "regional",
      label: "KSA Regional",
      count: risks.filter((r) => r.source === "regional").length,
    },
    {
      key: "internal",
      label: "Internal",
      count: risks.filter((r) => r.source === "internal").length,
    },
  ]

  const intlCount = risks.filter((r) => r.region !== "ksa").length

  return (
    <div className="flex flex-col h-full">
      {/* Title row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
          Risk Register
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportMasterRiskRegister(risks)
              triggerExportToast("Master Risk Register downloaded successfully")
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 border"
            style={{
              color: "var(--primary)",
              backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
              borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--primary) 20%, transparent)"
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 50%, transparent)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--primary) 10%, transparent)"
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 30%, transparent)"
            }}
          >
            <Download className="h-3 w-3" />
            Download Master Risk Register
          </button>
          <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {intlCount} International
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">
            {filtered.length} of {risks.length} entries
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search risks by name, ID, category, owner, or region..."
          className="w-full h-8 pl-8 pr-3 rounded bg-secondary/60 border border-border text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
        />
      </div>

      {/* Category tabs + Region filter */}
      <div className="flex items-center gap-3 mb-2 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200"
              style={{
                color: tab === t.key ? "var(--primary-foreground)" : "var(--muted-foreground)",
                backgroundColor: tab === t.key ? "var(--primary)" : "transparent",
                border: `1px solid ${tab === t.key ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {t.label}
              <span
                className="text-[8px] px-1 py-px rounded"
                style={{
                  backgroundColor: tab === t.key
                    ? "rgba(28,28,27,0.3)"
                    : "color-mix(in srgb, var(--border) 50%, transparent)",
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border/50 shrink-0" />

        {/* Region filter */}
        <div className="flex gap-1">
          <button
            onClick={() => handleRegionChange("all")}
            className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200"
            style={{
              color: regionFilter === "all" ? "var(--primary-foreground)" : "var(--muted-foreground)",
              backgroundColor: regionFilter === "all" ? "var(--primary)" : "transparent",
              border: `1px solid ${regionFilter === "all" ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            All Regions
          </button>
          {REGIONS.filter(r => r.key !== "global").map((region) => (
            <button
              key={region.key}
              onClick={() => handleRegionChange(region.key)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200"
              style={{
                color: regionFilter === region.key ? "var(--primary-foreground)" : region.color,
                backgroundColor: regionFilter === region.key ? region.color : "transparent",
                border: `1px solid ${regionFilter === region.key ? region.color : "var(--border)"}`,
              }}
            >
              <span className="text-[10px]">{region.flag}</span>
              {region.key === "ksa" ? "KSA" : region.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2">
                ID
              </th>
              <th className="text-left text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2">
                Risk
              </th>
              <th className="text-center text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2 hidden sm:table-cell">
                Region
              </th>
              <th className="text-left text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2 hidden lg:table-cell">
                Source
              </th>
              <th className="text-left text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2 hidden md:table-cell">
                Category
              </th>
              <th className="text-center text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2">
                Score
              </th>
              <th className="text-center text-[8px] font-mono uppercase tracking-wider text-muted-foreground/70 pb-2 pr-2">
                Level
              </th>
              <th className="pb-2 w-6" />
            </tr>
          </thead>
          <tbody>
            {paginated.map((risk) => {
              const color = getRiskColor(risk.likelihood, risk.impact)
              const level = getRiskLevel(risk.likelihood, risk.impact)
              const isSelected = selectedRisk?.id === risk.id
              const score = risk.likelihood * risk.impact
              const srcColor = getSourceColor(risk.source)
              const srcLabel = getSourceLabel(risk.source)
              const isOpportunity = risk.status === "opportunity"
              const regionInfo = getRegionInfo(risk.region)
              const isInternational = risk.region !== "ksa"

              return (
                <tr
                  key={risk.id}
                  onClick={() => onSelectRisk(risk)}
                  className={`border-b border-border/20 cursor-pointer transition-all duration-150 hover:bg-secondary/30 ${
                    isSelected ? "bg-secondary/40" : ""
                  }`}
                >
                  <td className="py-1.5 pr-2">
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {risk.id}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      {isOpportunity && (
                        <Star className="h-3 w-3 shrink-0" style={{ color: "var(--gold)" }} />
                      )}
                      {isInternational && (
                        <span className="text-[10px] shrink-0" title={regionInfo.label}>{regionInfo.flag}</span>
                      )}
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: isOpportunity ? "var(--gold)" : "var(--foreground)" }}
                      >
                        {risk.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 text-center hidden sm:table-cell">
                    <span
                      className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{
                        color: regionInfo.color,
                        backgroundColor: `color-mix(in srgb, ${regionInfo.color} 10%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${regionInfo.color} 20%, transparent)`,
                      }}
                    >
                      <span className="text-[9px]">{regionInfo.flag}</span>
                      {risk.region === "ksa" ? "KSA" : risk.region === "americas" ? "AMER" : risk.region.slice(0, 3).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 hidden lg:table-cell">
                    <span
                      className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: srcColor,
                        backgroundColor: `color-mix(in srgb, ${srcColor} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${srcColor} 25%, transparent)`,
                      }}
                    >
                      {srcLabel}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 hidden md:table-cell">
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {risk.category}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <span className="text-xs font-bold font-mono" style={{ color }}>
                      {score}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <span
                      className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color,
                        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                      }}
                    >
                      {level}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <ChevronRight
                      className="h-3 w-3 transition-colors"
                      style={{
                        color: isSelected ? "var(--gold)" : "var(--muted-foreground)",
                      }}
                    />
                  </td>
                </tr>
              )
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[11px] text-muted-foreground font-mono">
                  No risks match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-3 w-3" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {(() => {
              const pages: (number | "...")[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push("...")
                for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="text-[9px] font-mono text-muted-foreground/50 px-1">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="h-6 w-6 flex items-center justify-center rounded text-[9px] font-mono transition-all"
                    style={{
                      color: p === safePage ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      backgroundColor: p === safePage ? "var(--primary)" : "transparent",
                    }}
                  >
                    {p}
                  </button>
                )
              )
            })()}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
