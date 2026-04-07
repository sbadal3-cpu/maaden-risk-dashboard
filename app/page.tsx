"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Grid3X3, Database, Sparkles, Palette, Globe2, AlertTriangle, TrendingUp } from "lucide-react"

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

type Tab = "heatmap" | "universe" | "advisor"
type ThemeName = "dark" | "light" | "executive" | "bloomberg"

type DashboardSignal = {
  title?: string
  source?: string
  url?: string
  category?: string
  severity?: string
  confidence?: number
  publishedAt?: string
  impact?: string
  score?: number
  business?: string
  type?: "news" | "benchmark" | "market" | "synthetic"
}

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: "heatmap", label: "Executive Heatmap", icon: Grid3X3 },
  { key: "universe", label: "Risk Universe", icon: Database },
  { key: "advisor", label: "AI Advisor", icon: Sparkles },
]

const themeOptions: { key: ThemeName; label: string }[] = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "executive", label: "Executive" },
  { key: "bloomberg", label: "Bloomberg" },
]

function formatSar(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `SAR ${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `SAR ${(value / 1_000_000).toFixed(1)}M`
  return `SAR ${value.toFixed(0)}`
}

function getSeverityFromPct(pct: number) {
  const x = Math.abs(pct)
  if (x >= 8) return "Critical"
  if (x >= 4) return "High"
  if (x >= 2) return "Moderate"
  return "Low"
}

function getSeverityClasses(severity?: string) {
  switch ((severity || "").toLowerCase()) {
    case "critical":
      return "text-risk-critical border-risk-critical/30 bg-risk-critical/10"
    case "high":
      return "text-risk-high border-risk-high/30 bg-risk-high/10"
    case "moderate":
    case "medium":
      return "text-risk-medium border-risk-medium/30 bg-risk-medium/10"
    default:
      return "text-risk-low border-risk-low/30 bg-risk-low/10"
  }
}

function getScenarioNarrative(severity: string, pct: number) {
  if (severity === "Critical") {
    return {
      headline: "Executive attention required immediately.",
      actions: [
        "Activate mitigation plan and reprioritize capital allocation.",
        "Escalate to CFO / COO for hedging and procurement response.",
        "Review supplier resilience and contingency routing within 24–48 hours.",
      ],
      outlook: `In a severe case, EBITDA sensitivity may worsen by roughly ${Math.abs(pct).toFixed(1)}%.`,
    }
  }

  if (severity === "High") {
    return {
      headline: "Management action recommended this cycle.",
      actions: [
        "Increase monitoring cadence and hedge key exposures.",
        "Reassess supplier concentration and contract flexibility.",
        "Prepare scenario response pack for monthly leadership review.",
      ],
      outlook: `Current trajectory indicates material pressure, with downside sensitivity around ${Math.abs(pct).toFixed(1)}%.`,
    }
  }

  if (severity === "Moderate") {
    return {
      headline: "Monitor closely and keep mitigation options ready.",
      actions: [
        "Track leading indicators weekly.",
        "Validate procurement and logistics assumptions.",
        "Keep treasury and operations aligned on thresholds.",
      ],
      outlook: `Current scenario remains manageable but could intensify if external conditions deteriorate.`,
    }
  }

  return {
    headline: "No immediate management action required.",
    actions: [
      "Continue routine monitoring.",
      "Keep watchlist active for escalation triggers.",
      "Maintain source validation and signal quality checks.",
    ],
    outlook: `Current impact remains limited under base assumptions.`,
  }
}

export default function DashboardPage() {
  const [theme, setTheme] = useState<ThemeName>("dark")
  const [activeTab, setActiveTab] = useState<Tab>("heatmap")
  const [selectedRisk, setSelectedRisk] = useState<any>(null)
  const [footerCurrency, setFooterCurrency] = useState<Currency>("SAR")

  const [news, setNews] = useState<DashboardSignal[]>([])
  const [selectedSignal, setSelectedSignal] = useState<DashboardSignal | null>(null)

  const [scenarioLevel, setScenarioLevel] = useState(1)
  const [rateShock, setRateShock] = useState(false)
  const [costShock, setCostShock] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark", "light", "executive", "bloomberg")
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setNews(Array.isArray(data) ? data : []))
      .catch(() => setNews([]))
  }, [])

  const handleSelectRisk = useCallback((risk: any) => {
    setSelectedRisk(risk)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedRisk(null)
  }, [])

  const openBenchmarkPanel = () => {
    setSelectedSignal({
      type: "benchmark",
      title: "Global Benchmark Intelligence",
      source: "Internal benchmark engine",
      category: "Strategic",
      severity: "Moderate",
      confidence: 82,
      impact:
        "Benchmark indicators suggest external macro and sector pressures should be monitored against Ma’aden’s cost base, export exposure, and project execution assumptions.",
      url: "#",
    })
  }

  const openMarketPanel = () => {
    setSelectedSignal({
      type: "market",
      title: "Market Intelligence Summary",
      source: "Internal market feed",
      category: "Market",
      severity: "Moderate",
      confidence: 78,
      impact:
        "Market indicators imply potential variability in commodities, financing assumptions, and procurement costs. Management should compare this with current guidance and treasury assumptions.",
      url: "#",
    })
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <ExportToast />
      <DashboardHeader />
      <LiveTicker />

      <div className="px-4 pt-2 flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
          <Palette className="h-3.5 w-3.5" />
          Client View Modes
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {themeOptions.map((option) => {
            const active = theme === option.key
            return (
              <button
                key={option.key}
                onClick={() => setTheme(option.key)}
                className={`px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wide border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <nav className="flex items-center gap-1 px-4 pt-3 shrink-0">
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
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedRisk ? (
            <RiskDetailView risk={selectedRisk} onBack={handleBack} />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full p-4 flex flex-col gap-4 min-h-0"
            >
              {activeTab === "heatmap" && (
                <HeatmapTab
                  onSelectRisk={handleSelectRisk}
                  selectedRisk={selectedRisk}
                  news={news}
                  onSelectSignal={setSelectedSignal}
                  onOpenBenchmarks={openBenchmarkPanel}
                  onOpenMarket={openMarketPanel}
                />
              )}

              {activeTab === "universe" && (
                <RiskTable onSelectRisk={handleSelectRisk} selectedRisk={selectedRisk} />
              )}

              {activeTab === "advisor" && <AIAdvisor />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {selectedSignal && (() => {
        const mapping = mapToMaaden(selectedSignal)
        const baseImpact = calculateImpact(selectedSignal)

        let multiplier = scenarioLevel
        if (rateShock) multiplier += 0.4
        if (costShock) multiplier += 0.4

        const revenueBase = 120_000_000_000
        const basePct = baseImpact.base * multiplier
        const moderatePct = baseImpact.moderate * multiplier
        const severePct = baseImpact.severe * multiplier

        const baseSar = (basePct / 100) * revenueBase
        const moderateSar = (moderatePct / 100) * revenueBase
        const severeSar = (severePct / 100) * revenueBase

        const severity = selectedSignal.severity || getSeverityFromPct(severePct)
        const severityClass = getSeverityClasses(severity)
        const confidence = selectedSignal.confidence ?? 75
        const story = getScenarioNarrative(severity, severePct)

        return (
          <div className="fixed right-0 top-0 h-full w-[460px] max-w-[95vw] bg-card border-l border-border p-6 z-50 overflow-y-auto animate-slide-in-right">
            <button
              onClick={() => setSelectedSignal(null)}
              className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>

            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Decision Intelligence Brief</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Executive view of exposure, scenarios and recommended action
                </p>
              </div>

              <div className={`text-[11px] px-2.5 py-1 rounded-full border ${severityClass}`}>
                {severity}
              </div>
            </div>

            <div className="mt-5 text-sm font-semibold leading-snug">
              {selectedSignal.title}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              Source: {selectedSignal.source || "Verified intelligence feed"}
              {selectedSignal.publishedAt ? ` • ${selectedSignal.publishedAt}` : ""}
              {` • Confidence ${confidence}%`}
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Why this matters to Ma’aden
              </div>
              <div className="text-sm leading-6">{mapping.impact}</div>
              <div className="mt-3 text-xs text-muted-foreground">
                Exposure mapping: {mapping.business} • {mapping.asset}
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-3">
                <TrendingUp className="h-3.5 w-3.5" />
                Scenario controls
              </div>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scenarioLevel}
                onChange={(e) => setScenarioLevel(Number(e.target.value))}
                className="w-full"
              />

              <div className="mt-2 text-xs text-muted-foreground">
                Stress multiplier: {scenarioLevel.toFixed(1)}x
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setRateShock((v) => !v)}
                  className={`px-3 py-1.5 rounded-md border text-[11px] uppercase tracking-wide ${
                    rateShock
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rate shock
                </button>
                <button
                  onClick={() => setCostShock((v) => !v)}
                  className={`px-3 py-1.5 rounded-md border text-[11px] uppercase tracking-wide ${
                    costShock
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cost shock
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Estimated financial impact
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Base case</span>
                  <span className="font-medium">{basePct.toFixed(1)}% • {formatSar(baseSar)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Stress case</span>
                  <span className="font-medium">{moderatePct.toFixed(1)}% • {formatSar(moderateSar)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Severe case</span>
                  <span className="font-semibold text-risk-critical">
                    {severePct.toFixed(1)}% • {formatSar(severeSar)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-3">
                <AlertTriangle className="h-3.5 w-3.5" />
                Executive storyline
              </div>

              <div className="text-sm font-medium">{story.headline}</div>
              <div className="mt-2 text-sm text-muted-foreground leading-6">{story.outlook}</div>

              <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                Recommended action
              </div>

              <ul className="mt-2 space-y-2 text-sm">
                {story.actions.map((action, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-3">
                <Globe2 className="h-3.5 w-3.5" />
                Source and context
              </div>

              <div className="text-sm">
                {selectedSignal.impact || "Signal analysis derived from the current intelligence feed and scenario engine."}
              </div>

              <div className="mt-4 flex gap-3">
                {selectedSignal.url && selectedSignal.url !== "#" ? (
                  <a
                    href={selectedSignal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    Open original source
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Internal source summary
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <footer className="px-6 py-2 border-t border-border text-xs flex items-center justify-between">
        <span>Global Intelligence Platform | 2026</span>
        <div className="flex items-center gap-3">
          <CurrencyToggle currency={footerCurrency} onToggle={setFooterCurrency} />
          <ConnectionStatus />
        </div>
      </footer>
    </div>
  )
}

function HeatmapTab({
  onSelectRisk,
  selectedRisk,
  news,
  onSelectSignal,
  onOpenBenchmarks,
  onOpenMarket,
}: any) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <StatsBar onSelectRisk={onSelectRisk} />

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex-[2] border border-border rounded-lg p-4 bg-card overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-hidden flex-1">
            <div className="min-w-[920px] h-full">
              <RiskHeatmap onSelectRisk={onSelectRisk} selectedRisk={selectedRisk} />
            </div>
          </div>
        </div>

        <div className="flex-[1] flex flex-col gap-4 overflow-y-auto pr-1">
          <button
            onClick={onOpenBenchmarks}
            className="border border-border rounded-lg p-4 bg-card text-left hover:bg-secondary transition-colors"
          >
            <GlobalBenchmarks />
          </button>

          <button
            onClick={onOpenMarket}
            className="border border-border rounded-lg p-4 bg-card text-left hover:bg-secondary transition-colors"
          >
            <MarketIntelligence />
          </button>

          <div className="border border-border rounded-lg p-4 bg-card">
            <RiskSignals news={news} onSelect={onSelectSignal} />
          </div>
        </div>
      </div>

      <div className="mt-4 max-h-[220px] overflow-y-auto">
        <TopAlerts news={news} onSelect={onSelectSignal} />
      </div>
    </div>
  )
}