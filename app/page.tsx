"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { DashboardHeader } from "@/components/dashboard/header"
import { StatsBar } from "@/components/dashboard/stats-bar"
import { RiskHeatmap } from "@/components/dashboard/risk-heatmap"
import { GlobalBenchmarks } from "@/components/dashboard/global-benchmarks"
import { AIAdvisor } from "@/components/dashboard/ai-advisor"
import { RiskTable } from "@/components/dashboard/risk-table"
import { RiskDetailView } from "@/components/dashboard/risk-detail-view"
import { CurrencyToggle, type Currency } from "@/components/dashboard/currency-toggle"
import { LiveTicker } from "@/components/dashboard/live-ticker"
import { MarketIntelligence } from "@/components/dashboard/market-intelligence"
import { ConnectionStatus } from "@/components/dashboard/connection-status"
import { ExportToast } from "@/components/dashboard/export-toast"

import TopAlerts from "@/components/dashboard/top-alerts"
import RiskSignals from "@/components/dashboard/risk-signals"

import { mapToMaaden } from "@/lib/intelligence"
import { calculateImpact } from "@/lib/impact-engine"
import {
  assessPolicyAlignment,
  calculateContextInfluence,
  CONTEXT_VAULT_UPDATED_EVENT,
  readContextVault,
  rankContextDocuments,
  type ContextVaultDocument,
} from "@/lib/context-vault"

import { Grid3X3, Database, Sparkles } from "lucide-react"

type Tab = "heatmap" | "universe" | "advisor"

const tabs = [
  { key: "heatmap", label: "Executive Heatmap", icon: Grid3X3 },
  { key: "universe", label: "The Risk Universe", icon: Database },
  { key: "advisor", label: "AI Advisor", icon: Sparkles },
]

export default function DashboardPage() {

  const [activeTab, setActiveTab] = useState<Tab>("heatmap")
  const [selectedRisk, setSelectedRisk] = useState<any>(null)
  const [footerCurrency, setFooterCurrency] = useState<Currency>("SAR")

  const [news, setNews] = useState<any[]>([])
  const [selectedSignal, setSelectedSignal] = useState<any>(null)
  const [contextDocuments, setContextDocuments] = useState<ContextVaultDocument[]>([])

  // 🔥 SCENARIO CONTROLS
  const [scenarioLevel, setScenarioLevel] = useState(1)
  const [rateShock, setRateShock] = useState(false)
  const [costShock, setCostShock] = useState(false)

  useEffect(() => {
    fetch("/api/news")
      .then(res => res.json())
      .then(data => setNews(data))
  }, [])

  useEffect(() => {
    setContextDocuments(readContextVault())

    const handleContextUpdate = () => {
      setContextDocuments(readContextVault())
    }

    window.addEventListener(CONTEXT_VAULT_UPDATED_EVENT, handleContextUpdate as EventListener)
    return () => window.removeEventListener(CONTEXT_VAULT_UPDATED_EVENT, handleContextUpdate as EventListener)
  }, [])

  const handleSelectRisk = useCallback((risk: any) => {
    setSelectedRisk(risk)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedRisk(null)
  }, [])

  return (
    <div className="dashboard-shell relative z-0 flex h-screen flex-col overflow-hidden bg-background text-foreground">

      <ExportToast />
      <DashboardHeader />
      <LiveTicker />

      {/* NAV */}
      <div className="shrink-0 border-b border-border/40 bg-card/35">
        <nav className="mx-auto flex w-full max-w-[1680px] items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSelectedRisk(null)
                }}
                className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors"
                style={{
                  color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  backgroundColor: isActive ? "var(--primary)" : "color-mix(in srgb, var(--card) 68%, transparent)",
                  borderColor: isActive ? "var(--primary)" : "color-mix(in srgb, var(--border) 60%, transparent)",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 overflow-hidden px-4 py-2.5 sm:px-6 sm:py-3">
        <AnimatePresence mode="wait">
          {selectedRisk ? (
            <RiskDetailView risk={selectedRisk} onBack={handleBack} />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-0 w-full flex-col gap-3 lg:gap-4"
            >

              {activeTab === "heatmap" && (
                <HeatmapTab
                  onSelectRisk={handleSelectRisk}
                  selectedRisk={selectedRisk}
                  news={news}
                  onSelectSignal={setSelectedSignal}
                />
              )}

              {activeTab === "universe" && (
                <RiskTable
                  onSelectRisk={handleSelectRisk}
                  selectedRisk={selectedRisk}
                />
              )}

              {activeTab === "advisor" && <AIAdvisor />}

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 🔥 DECISION PANEL */}
      {selectedSignal && (() => {

        const mapping = mapToMaaden(selectedSignal)
        const baseImpact = calculateImpact(selectedSignal)

        // 🔥 APPLY SCENARIO
        let multiplier = scenarioLevel
        if (rateShock) multiplier += 0.5
        if (costShock) multiplier += 0.5

        const impact = {
          base: baseImpact.base * multiplier,
          moderate: baseImpact.moderate * multiplier,
          severe: baseImpact.severe * multiplier,
        }

        const severity =
          Math.abs(impact.severe) > 5 ? "Critical" :
          Math.abs(impact.severe) > 3 ? "High" :
          "Moderate"

        const matchedContext = rankContextDocuments(
          contextDocuments,
          `${selectedSignal.title} ${selectedSignal.category || ""} ${mapping.business} ${mapping.impact}`
        )
        const contextModeLabel = matchedContext.length > 0 ? "Context-informed mode" : "Market-only mode"
        const contextInfluence = calculateContextInfluence(contextDocuments, matchedContext)
        const policyAlignment = assessPolicyAlignment(contextDocuments, Math.abs(impact.severe))
        const executiveCitations = matchedContext.slice(0, 3).map((document, index) => ({
          citation: `CV-${String(index + 1).padStart(2, "0")}`,
          document,
        }))

        return (
          <div className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-[460px] overflow-y-auto border-l border-border/60 bg-[color:color-mix(in_srgb,var(--card)_94%,var(--background))] shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="sticky top-0 z-10 border-b border-border/50 bg-[color:color-mix(in_srgb,var(--card)_94%,var(--background))] px-5 py-5 backdrop-blur-xl sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setSelectedSignal(null)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  ← Back
                </button>
                <div
                  className="rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]"
                  style={{
                    color:
                      severity === "Critical"
                        ? "var(--risk-critical)"
                        : severity === "High"
                          ? "var(--risk-high)"
                          : "var(--risk-medium)",
                    backgroundColor:
                      severity === "Critical"
                        ? "color-mix(in srgb, var(--risk-critical) 10%, transparent)"
                        : severity === "High"
                          ? "color-mix(in srgb, var(--risk-high) 10%, transparent)"
                          : "color-mix(in srgb, var(--risk-medium) 10%, transparent)",
                    borderColor:
                      severity === "Critical"
                        ? "color-mix(in srgb, var(--risk-critical) 25%, transparent)"
                        : severity === "High"
                          ? "color-mix(in srgb, var(--risk-high) 25%, transparent)"
                          : "color-mix(in srgb, var(--risk-medium) 25%, transparent)",
                  }}
                >
                  {severity} Priority
                </div>
              </div>

              <div className="mt-5">
                <p className="dashboard-section-kicker">
                  Executive Action HUD
                </p>
                <h2 className="mt-1 text-[1.8rem] font-semibold tracking-[-0.04em] text-foreground">
                  Decision Required
                </h2>
                <p className="mt-2 text-[0.95rem] leading-7 text-muted-foreground">
                  Assess the external signal, exposure pathway, and recommended course of action before it cascades into operating performance.
                </p>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      Signal
                    </div>
                    <div className="mt-2 text-base font-semibold leading-6 text-foreground">
                      {selectedSignal.title}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-card/40 px-2.5 py-1">
                    {selectedSignal.source}
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-primary">
                    {selectedSignal.category || "General"}
                  </span>
                  <span className="rounded-full border border-border/60 bg-card/40 px-2.5 py-1">
                    {contextModeLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                    Priority
                  </div>
                  <div
                    className="mt-2 text-xl font-semibold"
                    style={{
                      color:
                        severity === "Critical"
                          ? "var(--risk-critical)"
                          : severity === "High"
                            ? "var(--risk-high)"
                            : "var(--risk-medium)",
                    }}
                  >
                    {severity}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Current scenario-adjusted urgency for executive review.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                    Ma&apos;aden Exposure
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">
                    {mapping.business} | {mapping.asset}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-red-400">
                    {mapping.impact}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      Context Meter
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {contextInfluence.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      Internal Influence
                    </div>
                    <div className="mt-1 text-lg font-semibold text-primary">
                      {contextInfluence.internal}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-card/50">
                    <div className="flex h-full w-full">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${contextInfluence.internal}%` }}
                      />
                      <div
                        className="h-full bg-secondary"
                        style={{ width: `${contextInfluence.market}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Internal context {contextInfluence.internal}%</span>
                    <span>Market baseline {contextInfluence.market}%</span>
                  </div>
                </div>
              </div>

              {matchedContext.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary/6 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                    Context Vault Framing
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    Internal Ma&apos;aden context available
                  </div>
                  <div className="mt-3 space-y-3">
                    {matchedContext.map((document) => (
                      <div key={document.id} className="rounded-xl border border-border/35 bg-card/25 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-primary">
                            {document.category}
                          </span>
                          <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/45">
                            {document.name}
                          </span>
                        </div>
                        <div className="mt-2 text-sm leading-6 text-foreground/90">
                          {document.summary}
                        </div>
                        {document.excerpt && (
                          <div className="mt-2 text-sm leading-6 text-muted-foreground">
                            {document.excerpt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor:
                    policyAlignment.status === "exceeds-tolerance"
                      ? "color-mix(in srgb, var(--risk-critical) 28%, transparent)"
                      : policyAlignment.status === "within-tolerance"
                        ? "color-mix(in srgb, var(--risk-low) 28%, transparent)"
                        : "color-mix(in srgb, var(--border) 60%, transparent)",
                  backgroundColor:
                    policyAlignment.status === "exceeds-tolerance"
                      ? "color-mix(in srgb, var(--risk-critical) 8%, transparent)"
                      : policyAlignment.status === "within-tolerance"
                        ? "color-mix(in srgb, var(--risk-low) 8%, transparent)"
                        : "color-mix(in srgb, var(--background) 40%, transparent)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      Policy Alignment
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {policyAlignment.status === "market-only" && "No internal governance benchmark"}
                      {policyAlignment.status === "context-without-limit" && "Governance context loaded"}
                      {policyAlignment.status === "within-tolerance" && "Within policy tolerance"}
                      {policyAlignment.status === "exceeds-tolerance" && "Exceeds policy tolerance"}
                    </div>
                  </div>
                  {typeof policyAlignment.thresholdPercent === "number" && (
                    <div className="rounded-full border border-border/60 bg-card/35 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/80">
                      Limit {policyAlignment.thresholdPercent.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div className="mt-3 text-sm leading-6 text-muted-foreground">
                  {policyAlignment.summary}
                </div>

                {policyAlignment.matchedGovernanceDocs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {policyAlignment.matchedGovernanceDocs.map((document) => (
                      <span
                        key={document.id}
                        className="rounded-full border border-border/50 bg-card/35 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/75"
                      >
                        {document.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 🔥 SCENARIO CONTROLS */}
              <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      Scenario Controls
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      Stress Level: {scenarioLevel.toFixed(1)}x
                    </div>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scenarioLevel}
                  onChange={(e) => setScenarioLevel(Number(e.target.value))}
                  className="mt-4 w-full"
                />

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setRateShock(!rateShock)}
                    className="rounded-full border border-border/70 px-3 py-1.5 transition-colors hover:bg-secondary/50"
                    style={{
                      backgroundColor: rateShock ? "color-mix(in srgb, var(--risk-high) 12%, transparent)" : "transparent",
                      borderColor: rateShock ? "color-mix(in srgb, var(--risk-high) 35%, transparent)" : undefined,
                    }}
                  >
                    Interest Shock
                  </button>
                  <button
                    onClick={() => setCostShock(!costShock)}
                    className="rounded-full border border-border/70 px-3 py-1.5 transition-colors hover:bg-secondary/50"
                    style={{
                      backgroundColor: costShock ? "color-mix(in srgb, var(--risk-critical) 10%, transparent)" : "transparent",
                      borderColor: costShock ? "color-mix(in srgb, var(--risk-critical) 35%, transparent)" : undefined,
                    }}
                  >
                    Cost Shock
                  </button>
                </div>
              </div>

              {/* IMPACT */}
              <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      Financial Exposure
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      Scenario-adjusted impact view
                    </div>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                    Percentage effect
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-border/50 bg-card/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Base Case</span>
                      <span className="text-base font-semibold text-red-400">{impact.base.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Moderate Stress</span>
                      <span className="text-base font-semibold text-orange-400">{impact.moderate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-risk-critical/20 bg-risk-critical/8 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">Severe Stress</span>
                      <span className="text-lg font-semibold text-red-500">{impact.severe.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DECISION */}
              <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                  Executive Storyline
                </div>
                <div className="mt-2 text-lg font-semibold text-foreground">
                  {severity === "Critical" && "Immediate executive intervention"}
                  {severity === "High" && "Active monitoring and hedge posture"}
                  {severity === "Moderate" && "Observe trend and maintain readiness"}
                </div>
                <div className="mt-3 text-sm leading-6 text-muted-foreground">
                  {severity === "Critical" && <div>Immediate mitigation required. Adjust capital allocation.</div>}
                  {severity === "High" && <div>Monitor closely and hedge exposure.</div>}
                  {severity === "Moderate" && <div>Track trend, no immediate action.</div>}
                </div>

                <div className="mt-4 rounded-xl border border-border/35 bg-card/25 p-3">
                  <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                    Citation Placeholders
                  </div>
                  {executiveCitations.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {executiveCitations.map(({ citation, document }) => (
                        <div key={citation} className="flex items-start justify-between gap-3 text-sm leading-6">
                          <span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-primary">
                            [{citation}]
                          </span>
                          <div className="min-w-0 flex-1 text-foreground/90">
                            {document.name}
                            <span className="ml-2 text-muted-foreground">({document.category})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                      No internal citations available. Executive storyline is currently driven by market intelligence only.
                    </div>
                  )}
                </div>

                <a
                  href={selectedSignal.url}
                  target="_blank"
                  className="mt-4 inline-flex rounded-full border border-primary/25 bg-card/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary/12"
                >
                  View Source →
                </a>
              </div>

            </div>
          </div>
        )

      })()}

      <footer className="shrink-0 border-t border-border/40 bg-card/35">
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-[11px] sm:px-6">
          <span className="text-muted-foreground">
            Global Risk Intelligence Dashboard | 2026
          </span>
          <div className="flex items-center gap-3">
            <CurrencyToggle currency={footerCurrency} onToggle={setFooterCurrency} />
            <ConnectionStatus />
          </div>
        </div>
      </footer>
    </div>
  )
}

function HeatmapTab({ onSelectRisk, selectedRisk, news, onSelectSignal }: any) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">

      <StatsBar onSelectRisk={onSelectRisk} />

      <div className="grid min-h-0 h-[clamp(500px,60vh,65vh)] max-h-[65vh] flex-1 grid-cols-1 gap-2.5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">

        <div className="dashboard-panel flex min-h-0 max-h-[65vh] flex-col overflow-auto rounded-2xl p-3 sm:p-3.5">
          <RiskHeatmap onSelectRisk={onSelectRisk} selectedRisk={selectedRisk} />
        </div>

        <div className="min-h-0 max-h-full overflow-y-auto pr-1">
          <div className="flex min-h-0 flex-col gap-2.5">

            <div className="dashboard-panel dashboard-density min-h-0 overflow-hidden rounded-2xl p-3 sm:p-3.5">
              <GlobalBenchmarks />
            </div>

            <div className="dashboard-panel dashboard-density min-h-0 overflow-hidden rounded-2xl p-3 sm:p-3.5">
              <MarketIntelligence />
            </div>

            <div className="dashboard-panel dashboard-density min-h-0 overflow-hidden rounded-2xl p-3 sm:p-3.5">
              <RiskSignals news={news} onSelect={onSelectSignal} />
            </div>

          </div>
        </div>

      </div>

      <div className="dashboard-panel dashboard-density h-[176px] shrink-0 overflow-y-auto rounded-2xl p-3 sm:p-3.5">
        <TopAlerts news={news} onSelect={onSelectSignal} />
      </div>

    </div>
  )
}
