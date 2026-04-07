"use client"

import { type Risk, REGIONS, getRegionInfo, type Region } from "@/lib/risk-data"
import { motion } from "framer-motion"
import { Globe, ArrowRight, AlertTriangle, MapPin } from "lucide-react"

interface GeographicImpactMapProps {
  risk: Risk
}

const REGION_POSITIONS: Record<Region, { x: number; y: number }> = {
  ksa: { x: 58, y: 48 },
  europe: { x: 48, y: 28 },
  africa: { x: 48, y: 58 },
  americas: { x: 22, y: 40 },
  global: { x: 50, y: 50 },
}

// Pre-defined cross-border impact flows
const IMPACT_FLOWS: Record<string, { from: Region; to: Region; label: string; impact: string }[]> = {
  europe: [
    { from: "europe", to: "ksa", label: "Revenue Impact", impact: "CBAM tariffs reduce Ma'aden KSA aluminium export revenue" },
    { from: "ksa", to: "europe", label: "Product Flow", impact: "Ma'aden ships aluminium, phosphate & minerals to EU markets" },
  ],
  africa: [
    { from: "africa", to: "ksa", label: "Supply Disruption", impact: "Feedstock delays cascade into Saudi processing facility downtime" },
    { from: "ksa", to: "africa", label: "Capital & Expertise", impact: "Ma'aden KSA provides investment capital and technical expertise" },
  ],
  americas: [
    { from: "americas", to: "ksa", label: "Tariff Pressure", impact: "US/Canada tariffs reduce Ma'aden's export competitiveness from KSA" },
    { from: "ksa", to: "americas", label: "Product Export", impact: "Ma'aden exports critical minerals, phosphate to Americas" },
  ],
  global: [
    { from: "global", to: "ksa", label: "Multi-Region", impact: "Global disruptions affect all Ma'aden KSA operations simultaneously" },
    { from: "ksa", to: "global", label: "Export Hub", impact: "KSA is the primary export hub for all international shipments" },
  ],
  ksa: [
    { from: "ksa", to: "europe", label: "EU Exports", impact: "Products flow from KSA processing to European markets" },
    { from: "ksa", to: "americas", label: "Americas Exports", impact: "Critical minerals exported to US & Latin American buyers" },
  ],
}

export function GeographicImpactMap({ risk }: GeographicImpactMapProps) {
  const regionInfo = getRegionInfo(risk.region)
  const flows = IMPACT_FLOWS[risk.region] || IMPACT_FLOWS.global

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Geographic Impact Map
        </span>
      </div>

      {/* World Map Visualization */}
      <div className="relative rounded-lg border border-border/50 bg-secondary/20 overflow-hidden" style={{ height: 200 }}>
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Background grid */}
          {[20, 40, 60, 80].map((v) => (
            <line key={`h-${v}`} x1="0" y1={v} x2="100" y2={v} stroke="var(--border)" strokeWidth="0.15" strokeOpacity="0.3" />
          ))}
          {[20, 40, 60, 80].map((v) => (
            <line key={`v-${v}`} x1={v} y1="0" x2={v} y2="100" stroke="var(--border)" strokeWidth="0.15" strokeOpacity="0.3" />
          ))}

          {/* Simplified continental outlines */}
          {/* Americas */}
          <path d="M15,15 Q18,20 20,25 L22,30 Q24,35 22,40 L18,50 Q16,55 17,60 L20,68 Q22,72 18,78" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Europe/Africa */}
          <path d="M42,18 Q45,20 48,22 L50,25 Q52,24 55,22" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeOpacity="0.4" />
          <path d="M42,40 Q44,50 46,55 L48,60 Q50,65 48,72 L46,76" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Middle East / KSA */}
          <path d="M54,35 Q57,38 60,40 L62,44 Q64,48 60,52" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Asia */}
          <path d="M65,20 Q70,22 75,25 L80,30 Q85,35 82,42 L78,48" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeOpacity="0.4" />

          {/* Flow arrows between regions */}
          {flows.map((flow, i) => {
            const from = REGION_POSITIONS[flow.from]
            const to = REGION_POSITIONS[flow.to]
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2 - 5

            return (
              <g key={i}>
                <defs>
                  <marker id={`arrow-${i}`} markerWidth="4" markerHeight="3" refX="4" refY="1.5" orient="auto">
                    <polygon points="0 0, 4 1.5, 0 3" fill={regionInfo.color} fillOpacity="0.7" />
                  </marker>
                </defs>
                <motion.path
                  d={`M${from.x},${from.y} Q${midX},${midY} ${to.x},${to.y}`}
                  fill="none"
                  stroke={regionInfo.color}
                  strokeWidth="0.4"
                  strokeDasharray="2 1"
                  strokeOpacity="0.6"
                  markerEnd={`url(#arrow-${i})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.2, duration: 0.8 }}
                />
              </g>
            )
          })}
        </svg>

        {/* Region nodes */}
        {REGIONS.filter(r => r.key !== "global").map((region, i) => {
          const pos = REGION_POSITIONS[region.key]
          const isActive = region.key === risk.region
          const isKSA = region.key === "ksa"

          return (
            <motion.div
              key={region.key}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 200 }}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] border-2 transition-all"
                style={{
                  borderColor: isActive ? regionInfo.color : isKSA ? "var(--primary)" : "var(--border)",
                  backgroundColor: isActive
                    ? `color-mix(in srgb, ${regionInfo.color} 25%, var(--card))`
                    : isKSA ? "color-mix(in srgb, var(--primary) 15%, var(--card))" : "var(--card)",
                  boxShadow: isActive
                    ? `0 0 12px color-mix(in srgb, ${regionInfo.color} 40%, transparent)`
                    : isKSA ? "0 0 8px color-mix(in srgb, var(--primary) 30%, transparent)" : "none",
                }}
              >
                <span className="text-[11px]">{region.flag}</span>
              </div>
              <span
                className="text-[7px] font-mono uppercase tracking-wider mt-0.5 whitespace-nowrap"
                style={{ color: isActive ? regionInfo.color : isKSA ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {region.key === "ksa" ? "KSA" : region.label}
              </span>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -inset-1 rounded-full border"
                  style={{ borderColor: `color-mix(in srgb, ${regionInfo.color} 30%, transparent)` }}
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Cross-Border Impact Flows */}
      <div className="flex flex-col gap-2">
        {flows.map((flow, i) => {
          const fromRegion = getRegionInfo(flow.from)
          const toRegion = getRegionInfo(flow.to)
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.15 }}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30"
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span className="text-[10px]">{fromRegion.flag}</span>
                <ArrowRight className="h-3 w-3" style={{ color: regionInfo.color }} />
                <span className="text-[10px]">{toRegion.flag}</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: regionInfo.color }}>
                  {flow.label}
                </p>
                <p className="text-[10px] text-foreground/70 leading-relaxed mt-0.5">
                  {flow.impact}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Cross-border narrative */}
      {risk.crossBorderImpact && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-3 rounded-lg border border-primary/20 bg-primary/5"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-primary">Cross-Border Impact Analysis</span>
          </div>
          <p className="text-[10px] text-foreground/80 leading-relaxed">{risk.crossBorderImpact}</p>
        </motion.div>
      )}
    </div>
  )
}
