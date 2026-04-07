"use client"

import { type Risk, getRiskColor, getRiskLevel, getSourceLabel, getSourceColor, getRegionInfo, SAR_TO_USD } from "@/lib/risk-data"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Zap,
  ShieldCheck,
  User,
  Calendar,
  Tag,
  Fingerprint,
  Star,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Globe,
} from "lucide-react"
import { GeographicImpactMap } from "./geographic-impact-map"
import { CurrencyToggle, type Currency } from "./currency-toggle"
import { useState } from "react"

interface RiskDetailViewProps {
  risk: Risk
  onBack: () => void
}

function formatCurrency(sarText: string, currency: Currency): string {
  if (currency === "SAR") return sarText
  // Replace SAR amounts with USD equivalents
  return sarText.replace(/SAR\s+([\d,.]+)(B|M|K)?/gi, (match, num, suffix) => {
    const val = parseFloat(num.replace(/,/g, ""))
    const converted = val * SAR_TO_USD
    const formatted = converted >= 1 ? converted.toFixed(1) : converted.toFixed(2)
    return `USD ${formatted}${suffix || ""}`
  })
}

export function RiskDetailView({ risk, onBack }: RiskDetailViewProps) {
  const [currency, setCurrency] = useState<Currency>("SAR")
  const riskColor = getRiskColor(risk.likelihood, risk.impact)
  const riskLevel = getRiskLevel(risk.likelihood, risk.impact)
  const isOpportunity = risk.status === "opportunity"
  const srcLabel = getSourceLabel(risk.source)
  const srcColor = getSourceColor(risk.source)
  const regionInfo = getRegionInfo(risk.region)
  const isInternational = risk.region !== "ksa"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-card/30 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Universe
        </button>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[10px] font-mono text-muted-foreground">{risk.category}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[10px] font-mono text-primary">{risk.name}</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Region badge */}
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1"
            style={{ color: regionInfo.color, backgroundColor: `color-mix(in srgb, ${regionInfo.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${regionInfo.color} 25%, transparent)` }}
          >
            <span className="text-[10px]">{regionInfo.flag}</span>
            {regionInfo.label}
          </span>
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ color: srcColor, backgroundColor: `color-mix(in srgb, ${srcColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${srcColor} 25%, transparent)` }}
          >
            {srcLabel}
          </span>
          <CurrencyToggle currency={currency} onToggle={setCurrency} />
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary/60 hidden md:inline">
            ICMM Member
          </span>
        </div>
      </div>

      {/* Content -- with optional geographic side panel */}
      <div className={`flex-1 overflow-hidden flex ${isInternational ? "flex-col lg:flex-row" : ""}`}>
        {/* Main content */}
        <div className={`flex-1 overflow-y-auto p-6 ${isInternational ? "lg:border-r lg:border-border/30" : ""}`}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-mono text-muted-foreground">{risk.id}</span>
              <span
                className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: isOpportunity ? "var(--gold)" : riskColor,
                  backgroundColor: isOpportunity ? "color-mix(in srgb, var(--gold) 15%, transparent)" : `color-mix(in srgb, ${riskColor} 15%, transparent)`,
                  border: `1px solid ${isOpportunity ? "color-mix(in srgb, var(--gold) 30%, transparent)" : `color-mix(in srgb, ${riskColor} 30%, transparent)`}`,
                }}
              >
                {isOpportunity ? "Strategic Opportunity" : `${riskLevel} Risk`}
              </span>
              {isInternational && (
                <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1"
                  style={{ color: regionInfo.color, backgroundColor: `color-mix(in srgb, ${regionInfo.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${regionInfo.color} 25%, transparent)` }}
                >
                  <Globe className="h-3 w-3" />
                  International
                </span>
              )}
              {risk.sourceDetail && (
                <span className="text-[8px] font-mono text-muted-foreground/60">{risk.sourceDetail}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 text-balance">
              {isOpportunity && <Star className="h-6 w-6 text-gold shrink-0" />}
              {risk.name}
            </h2>
          </motion.div>

          {/* Meta + score row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
          >
            {[
              { icon: Tag, label: "Category", value: risk.category },
              { icon: User, label: "Owner", value: risk.owner },
              { icon: Calendar, label: "Updated", value: risk.lastUpdated },
              { icon: Fingerprint, label: "Source", value: risk.source.toUpperCase() },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <item.icon className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50">{item.label}</p>
                  <p className="text-[11px] font-mono text-foreground/80 truncate">{item.value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: `color-mix(in srgb, ${riskColor} 8%, transparent)`, borderColor: `color-mix(in srgb, ${riskColor} 25%, transparent)` }}>
              <div>
                <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50">Risk Score</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono" style={{ color: riskColor }}>{risk.likelihood * risk.impact}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/40">/25</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 ml-auto">
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-mono text-muted-foreground/50 w-3">L</span>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className="h-1.5 w-4 rounded-sm" style={{ backgroundColor: n <= risk.likelihood ? riskColor : "var(--border)" }} />)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-mono text-muted-foreground/50 w-3">I</span>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className="h-1.5 w-4 rounded-sm" style={{ backgroundColor: n <= risk.impact ? riskColor : "var(--border)" }} />)}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Financial Exposure with currency */}
          {risk.financialExposure && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="mb-6 p-3 rounded-lg border border-primary/20 bg-primary/5"
            >
              <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-1">Financial Exposure ({currency})</p>
              <p className="text-[12px] font-semibold font-mono text-primary">{formatCurrency(risk.financialExposure, currency)}</p>
            </motion.div>
          )}

          {/* Bow-Tie Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${riskColor} 30%, transparent)` }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Bow-Tie Analysis</span>
              <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${riskColor} 30%, transparent)` }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_1fr] gap-4 items-start mb-8">
              {/* Causes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-risk-high" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-risk-high">Root Causes</span>
                </div>
                <div className="flex flex-col gap-2">
                  {risk.causes.map((cause, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border-l-2 text-[12px] text-foreground/80 leading-relaxed"
                      style={{ borderColor: "var(--risk-high)" }}
                    >
                      <ArrowRight className="h-3 w-3 text-risk-high/60 shrink-0 mt-1" />
                      <span>{cause}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Center node */}
              <div className="hidden md:flex flex-col items-center justify-center h-full">
                <div className="w-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${riskColor} 25%, transparent)` }} />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
                  className="h-14 w-14 rounded-full flex items-center justify-center my-3"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${riskColor} 15%, var(--card))`,
                    border: `2px solid ${riskColor}`,
                    boxShadow: `0 0 24px color-mix(in srgb, ${riskColor} 35%, transparent), 0 0 48px color-mix(in srgb, ${riskColor} 12%, transparent)`,
                  }}
                >
                  {isOpportunity ? <Star className="h-6 w-6" style={{ color: riskColor }} /> : <AlertTriangle className="h-6 w-6" style={{ color: riskColor }} />}
                </motion.div>
                <div className="w-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${riskColor} 25%, transparent)` }} />
              </div>

              {/* Impacts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-risk-critical" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-risk-critical">{isOpportunity ? "Outcomes" : `Impacts (${currency})`}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {risk.impacts.map((impact, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border-l-2 text-[12px] text-foreground/80 leading-relaxed"
                      style={{ borderColor: isOpportunity ? "var(--gold)" : "var(--risk-critical)" }}
                    >
                      <ArrowRight className="h-3 w-3 shrink-0 mt-1" style={{ color: isOpportunity ? "var(--gold-dim)" : "var(--risk-critical)" }} />
                      <span>{formatCurrency(impact, currency)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Active Controls */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-risk-low" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-risk-low">Active Controls & Mitigations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {risk.controls.map((control, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="flex items-start gap-2 p-3 rounded-lg text-[12px] font-mono text-risk-low bg-risk-low/5 border border-risk-low/15 leading-relaxed"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-risk-low/60 shrink-0 mt-0.5" />
                  {control}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mitigation Timeline */}
          {risk.mitigationTimeline && risk.mitigationTimeline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Mitigation Timeline</span>
              </div>
              <div className="relative flex items-start gap-0">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border/40 z-0" />
                <div className="grid w-full z-10" style={{ gridTemplateColumns: `repeat(${risk.mitigationTimeline.length}, 1fr)` }}>
                  {risk.mitigationTimeline.map((step, i) => {
                    const isDone = step.status === "done"
                    const isActive = step.status === "active"
                    const color = isDone ? "var(--risk-low)" : isActive ? "var(--gold)" : "var(--muted-foreground)"
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex flex-col items-center text-center"
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center mb-2 border-2"
                          style={{
                            borderColor: color,
                            backgroundColor: isDone ? "color-mix(in srgb, var(--risk-low) 15%, var(--card))" : isActive ? "color-mix(in srgb, var(--gold) 15%, var(--card))" : "var(--card)",
                            boxShadow: isActive ? `0 0 12px color-mix(in srgb, var(--gold) 30%, transparent)` : "none",
                          }}
                        >
                          {isDone ? <CheckCircle2 className="h-4 w-4" style={{ color }} /> : isActive ? <Clock className="h-4 w-4 animate-pulse" style={{ color }} /> : <Circle className="h-4 w-4" style={{ color }} />}
                        </div>
                        <p className="text-[10px] font-semibold" style={{ color }}>{step.phase}</p>
                        <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{step.date}</p>
                        <span
                          className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded mt-1"
                          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                        >
                          {step.status}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wider">
              All financial figures denominated in {currency} {currency === "USD" ? "(converted at 1 SAR = 0.2666 USD)" : "(Saudi Riyal)"} | ICMM Member | 2026 Benchmark Engine | Risk Intelligence + Strategic Insights + FMF | Last Updated: Feb 21, 2026
            </p>
          </div>
        </div>

        {/* Side panel -- Geographic Impact Map for international risks */}
        {isInternational && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-full lg:w-[360px] shrink-0 overflow-y-auto p-4 bg-card/20"
          >
            <GeographicImpactMap risk={risk} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
