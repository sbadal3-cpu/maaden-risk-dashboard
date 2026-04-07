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

  // 🔥 SCENARIO CONTROLS
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
    <div className="flex flex-col h-screen bg-background text-white">

      <ExportToast />
      <DashboardHeader />
      <LiveTicker />

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
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase"
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
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

        return (
          <div className="fixed right-0 top-0 h-full w-[450px] bg-[#111] border-l border-white/10 p-6 z-50 overflow-y-auto">

            <button onClick={() => setSelectedSignal(null)} className="mb-4 text-sm text-gray-400">
              ← Back
            </button>

            <h2 className="text-lg font-bold mb-4">Decision Intelligence</h2>

            <div className="text-sm font-semibold mb-2">{selectedSignal.title}</div>

            <div className="text-xs text-gray-400 mb-4">
              {selectedSignal.source} | {severity}
            </div>

            {/* 🔥 SCENARIO CONTROLS */}
            <div className="mb-4 border border-white/10 p-3 rounded bg-black/30">

              <div className="text-xs text-gray-400 mb-2">Scenario Controls</div>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scenarioLevel}
                onChange={(e) => setScenarioLevel(Number(e.target.value))}
                className="w-full"
              />

              <div className="text-xs mt-2">Stress Level: {scenarioLevel.toFixed(1)}x</div>

              <div className="flex gap-2 mt-2 text-xs">
                <button onClick={() => setRateShock(!rateShock)} className="px-2 py-1 border rounded">
                  Interest Shock
                </button>
                <button onClick={() => setCostShock(!costShock)} className="px-2 py-1 border rounded">
                  Cost Shock
                </button>
              </div>

            </div>

            {/* MAADEN */}
            <div className="mb-4 border border-white/10 p-3 rounded bg-black/30">
              <div className="text-xs text-gray-400 mb-1">Ma’aden Exposure</div>
              <div className="text-sm">{mapping.business} | {mapping.asset}</div>
              <div className="text-sm text-red-400">{mapping.impact}</div>
            </div>

            {/* IMPACT */}
            <div className="mb-4 border border-white/10 p-3 rounded bg-black/30">
              <div className="text-xs text-gray-400 mb-2">Financial Impact</div>
              <div className="text-sm text-red-400">Base: {impact.base.toFixed(1)}%</div>
              <div className="text-sm text-orange-400">Moderate: {impact.moderate.toFixed(1)}%</div>
              <div className="text-sm text-red-500 font-bold">Severe: {impact.severe.toFixed(1)}%</div>
            </div>

            {/* DECISION */}
            <div className="mb-4">
              <div className="text-sm font-bold text-green-400 mb-2">Recommended Action</div>
              {severity === "Critical" && <div>Immediate mitigation required. Adjust capital allocation.</div>}
              {severity === "High" && <div>Monitor closely and hedge exposure.</div>}
              {severity === "Moderate" && <div>Track trend, no immediate action.</div>}
            </div>

            <a href={selectedSignal.url} target="_blank" className="text-blue-400 underline">
              View Source →
            </a>

          </div>
        )

      })()}

      <footer className="flex items-center justify-between px-6 py-2 border-t text-xs">
        Global Risk Intelligence Dashboard | 2026
        <CurrencyToggle currency={footerCurrency} onToggle={setFooterCurrency} />
        <ConnectionStatus />
      </footer>
    </div>
  )
}

function HeatmapTab({ onSelectRisk, selectedRisk, news, onSelectSignal }: any) {
  return (
    <div className="flex flex-col flex-1 min-h-0">

      <StatsBar onSelectRisk={onSelectRisk} />

      <div className="flex flex-1 gap-4 min-h-0">

        <div className="flex-[2] border border-white/10 rounded p-4 bg-[#111] flex flex-col">
          <RiskHeatmap onSelectRisk={onSelectRisk} selectedRisk={selectedRisk} />
        </div>

        <div className="flex-[1] flex flex-col gap-4 overflow-y-auto pr-2">

          <div className="border border-white/10 rounded p-4 bg-[#111]">
            <GlobalBenchmarks />
          </div>

          <div className="border border-white/10 rounded p-4 bg-[#111]">
            <MarketIntelligence />
          </div>

          <div className="border border-white/10 rounded p-4 bg-[#111]">
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