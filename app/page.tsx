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

import { Grid3X3, Database, Sparkles } from "lucide-react"

type Tab = "heatmap" | "universe" | "advisor"

/* 🔥 THEMES */
const themes = {
  dark: {
    bg: "bg-background",
    card: "bg-[#111]",
    border: "border-white/10",
    text: "text-white",
    sub: "text-gray-400",
  },
  executive: {
    bg: "bg-[#0b1d2a]",
    card: "bg-[#112e42]",
    border: "border-blue-400/20",
    text: "text-blue-100",
    sub: "text-blue-300",
  },
  light: {
    bg: "bg-white",
    card: "bg-gray-100",
    border: "border-gray-300",
    text: "text-black",
    sub: "text-gray-600",
  },
  bloomberg: {
    bg: "bg-[#0a0a0a]",
    card: "bg-[#111111]",
    border: "border-yellow-400/20",
    text: "text-yellow-300",
    sub: "text-yellow-500",
  },
}

const tabs = [
  { key: "heatmap", label: "Executive Heatmap", icon: Grid3X3 },
  { key: "universe", label: "Risk Universe", icon: Database },
  { key: "advisor", label: "AI Advisor", icon: Sparkles },
]

export default function DashboardPage() {

  const [theme, setTheme] = useState("dark")
  const t = themes[theme as keyof typeof themes]

  const [activeTab, setActiveTab] = useState<Tab>("heatmap")
  const [selectedRisk, setSelectedRisk] = useState<any>(null)
  const [footerCurrency, setFooterCurrency] = useState<Currency>("SAR")

  const [news, setNews] = useState<any[]>([])
  const [selectedSignal, setSelectedSignal] = useState<any>(null)

  const [scenarioLevel, setScenarioLevel] = useState(1)
  const [rateShock, setRateShock] = useState(false)
  const [costShock, setCostShock] = useState(false)

  useEffect(() => {
    fetch("/api/news")
      .then(res => res.json())
      .then(data => setNews(data))
  }, [])

  const handleSelectRisk = useCallback((risk: any) => {
    setSelectedRisk(risk)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedRisk(null)
  }, [])

  return (
    <div className={`flex flex-col h-screen ${t.bg} ${t.text}`}>

      <ExportToast />
      <DashboardHeader />
      <LiveTicker />

      {/* 🔥 THEME SWITCHER */}
      <div className="px-4 pt-2 flex justify-end">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="text-xs border px-2 py-1 bg-black text-white"
        >
          <option value="dark">Dark</option>
          <option value="executive">Executive</option>
          <option value="light">Light</option>
          <option value="bloomberg">Bloomberg</option>
        </select>
      </div>

      {/* NAV */}
      <nav className="flex items-center gap-1 px-4 pt-3">
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
              className="flex items-center gap-2 px-4 py-2 text-xs uppercase"
              style={{
                color: isActive ? "#22c55e" : "#888",
              }}
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
            <motion.div className="h-full p-4 flex flex-col gap-4">

              {activeTab === "heatmap" && (
                <HeatmapTab
                  t={t}
                  onSelectRisk={handleSelectRisk}
                  news={news}
                  onSelectSignal={setSelectedSignal}
                />
              )}

              {activeTab === "universe" && (
                <RiskTable onSelectRisk={handleSelectRisk} />
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

        let multiplier = scenarioLevel
        if (rateShock) multiplier += 0.4
        if (costShock) multiplier += 0.4

        const pct = baseImpact.severe * multiplier
        const sar = (pct / 100) * 120_000_000_000

        return (
          <div className={`fixed right-0 top-0 h-full w-[450px] ${t.card} border-l ${t.border} p-6`}>

            <button onClick={() => setSelectedSignal(null)}>← Back</button>

            <h2 className="text-lg font-bold mt-2">Decision Intelligence Brief</h2>

            <div className="mt-3 text-sm font-semibold">
              {selectedSignal.title}
            </div>

            <div className={`text-xs ${t.sub}`}>
              Source: {selectedSignal.source}
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-400">Why this matters</div>
              <div className="text-sm">{mapping.impact}</div>
            </div>

            <div className="mt-4 text-red-400 font-semibold">
              Impact: {pct.toFixed(1)}% (~SAR {(sar/1e9).toFixed(1)}B)
            </div>

          </div>
        )

      })()}

      <footer className="px-6 py-2 border-t text-xs">
        Global Intelligence Platform | 2026
        <CurrencyToggle currency={footerCurrency} onToggle={setFooterCurrency} />
        <ConnectionStatus />
      </footer>
    </div>
  )
}

/* 🔥 HEATMAP TAB */
function HeatmapTab({ t, onSelectRisk, news, onSelectSignal }: any) {
  return (
    <div className="flex flex-col flex-1">

      <StatsBar onSelectRisk={onSelectRisk} />

      <div className="flex flex-1 gap-4">

        <div className={`flex-[2] border ${t.border} ${t.card} p-4 overflow-x-auto`}>
          <div className="min-w-[900px]">
            <RiskHeatmap onSelectRisk={onSelectRisk} />
          </div>
        </div>

        <div className="flex-[1] flex flex-col gap-4 overflow-y-auto">

          <div className={`border ${t.border} ${t.card} p-4`}>
            <GlobalBenchmarks />
          </div>

          <div className={`border ${t.border} ${t.card} p-4`}>
            <MarketIntelligence />
          </div>

          <div className={`border ${t.border} ${t.card} p-4`}>
            <RiskSignals news={news} onSelect={onSelectSignal} />
          </div>

        </div>

      </div>

      <TopAlerts news={news} onSelect={onSelectSignal} />

    </div>
  )
}