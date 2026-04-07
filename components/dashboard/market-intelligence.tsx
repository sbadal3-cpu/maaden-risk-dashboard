"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import {
  Newspaper,
  ExternalLink,
  Radio,
  RefreshCw,
  Clock,
  Tag,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface NewsArticle {
  title: string
  description: string
  source: string
  publishedAt: string
  url: string
  category: string
}

interface NewsResponse {
  articles: NewsArticle[]
  isLive: boolean
  lastUpdated: string
}

interface SyncResponse {
  success: boolean
  isLive: boolean
  rowCount: number
  lastSynced: string
  message?: string
  error?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORY_COLORS: Record<string, string> = {
  discovery: "var(--gold)",
  vision2030: "var(--risk-low)",
  strategic: "var(--chart-5)",
  regulatory: "var(--risk-high)",
  benchmark: "var(--primary)",
  operations: "var(--chart-3)",
  market: "var(--chart-4)",
  mining: "var(--primary)",
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  } catch {
    return "recently"
  }
}

export function MarketIntelligence() {
  const { data, isLoading, mutate } = useSWR<NewsResponse>("/api/news", fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: true,
  })
  const [mounted, setMounted] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSyncSheets() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/sync-sheets", { method: "POST" })
      const result = await res.json()
      setSyncResult(result)
    } catch {
      setSyncResult({ success: false, isLive: false, rowCount: 0, lastSynced: "", error: "Network error" })
    } finally {
      setSyncing(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex flex-col h-full gap-3">
        <div className="h-6 w-40 rounded bg-secondary/40 animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded bg-secondary/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Newspaper className="h-4 w-4 text-primary" />
            <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Market Intelligence
            </h2>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
              Real-Time Feed | {"Ma'aden"} + KSA Mining
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => mutate()}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
            title="Refresh news"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-risk-low/10 border border-risk-low/20 text-risk-low">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Google Sheets Sync Button */}
      <button
        onClick={handleSyncSheets}
        disabled={syncing}
        className="group relative flex items-center justify-center gap-2 w-full py-2 mb-3 rounded border text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 overflow-hidden disabled:cursor-not-allowed"
        style={{
          color: syncing ? "var(--risk-low)" : "var(--chart-5)",
          backgroundColor: syncing ? "color-mix(in srgb, var(--risk-low) 8%, transparent)" : "color-mix(in srgb, var(--chart-5) 8%, transparent)",
          borderColor: syncing ? "color-mix(in srgb, var(--risk-low) 30%, transparent)" : "color-mix(in srgb, var(--chart-5) 25%, transparent)",
        }}
      >
        {syncing && (
          <span className="absolute inset-0 bg-risk-low/5 animate-pulse" />
        )}
        {syncing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3 w-3" />
        )}
        <span className="relative z-10">
          {syncing ? "Live Syncing 245 Risks..." : "Sync Data from Google Sheets"}
        </span>
        {syncing && (
          <span className="relative z-10 flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-risk-low animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1 w-1 rounded-full bg-risk-low animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1 w-1 rounded-full bg-risk-low animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </button>

      {/* Sync result notification */}
      {syncResult && (
        <div
          className="flex items-start gap-2 p-2 mb-3 rounded text-[10px] font-mono border transition-all animate-fade-in-up"
          style={{
            backgroundColor: syncResult.success
              ? "color-mix(in srgb, var(--risk-low) 10%, transparent)"
              : "color-mix(in srgb, var(--risk-critical) 10%, transparent)",
            borderColor: syncResult.success
              ? "color-mix(in srgb, var(--risk-low) 25%, transparent)"
              : "color-mix(in srgb, var(--risk-critical) 25%, transparent)",
            color: syncResult.success ? "var(--risk-low)" : "var(--risk-critical)",
          }}
        >
          {syncResult.success ? (
            <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {syncResult.success ? (
              <>
                <span className="font-semibold">
                  Risk Universe Synchronized
                </span>
                <span className="block text-[9px] mt-0.5 opacity-70">
                  {syncResult.rowCount} risks loaded into Risk Universe
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">Sync Failed</span>
                <span className="block text-[9px] mt-0.5 opacity-70">{syncResult.error}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* News articles */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="p-2.5 rounded border border-border/30 bg-secondary/20">
                <div className="h-3 w-3/4 rounded bg-secondary/40 animate-pulse mb-2" />
                <div className="h-2 w-full rounded bg-secondary/20 animate-pulse mb-1" />
                <div className="h-2 w-2/3 rounded bg-secondary/20 animate-pulse" />
              </div>
            ))
          : data?.articles?.map((article, i) => {
              const catColor = CATEGORY_COLORS[article.category] || "var(--muted-foreground)"
              return (
                <a
                  key={i}
                  href={article.url !== "#" ? article.url : undefined}
                  target={article.url !== "#" ? "_blank" : undefined}
                  rel={article.url !== "#" ? "noopener noreferrer" : undefined}
                  className="group p-2.5 rounded border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-border/60 transition-all duration-200 cursor-default"
                >
                  {/* Meta row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[7px] font-mono uppercase tracking-wider px-1 py-0.5 rounded"
                        style={{
                          color: catColor,
                          backgroundColor: `color-mix(in srgb, ${catColor} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${catColor} 20%, transparent)`,
                        }}
                      >
                        <Tag className="h-2 w-2 inline mr-0.5" />
                        {article.category}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground/50">
                        {article.source}
                      </span>
                    </div>
                    {article.url !== "#" && (
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/20 group-hover:text-primary/50 transition-colors shrink-0" />
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-[11px] font-medium text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                    {article.title}
                  </p>

                  {/* Description */}
                  <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">
                    {article.description}
                  </p>

                  {/* Time */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />
                    <span className="text-[8px] font-mono text-muted-foreground/40">
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                  </div>
                </a>
              )
            })}
      </div>
    </div>
  )
}
