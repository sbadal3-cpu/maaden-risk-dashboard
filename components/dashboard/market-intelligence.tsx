"use client"

import { useEffect, useMemo, useState } from "react"
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
  sourceLabel?: string
  sourceType?: string
  publishedAt: string
  url: string
  category: string
  severity?: string
  severityLabel?: string
  business?: string
  businessImpact?: string
  aiEnriched?: boolean
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
  financial: "var(--chart-4)",
  operational: "var(--chart-3)",
  regulatory: "var(--risk-high)",
  esg: "var(--risk-low)",
  geopolitical: "var(--chart-5)",
  general: "var(--primary)",
}

function getSeverityTone(severity?: string) {
  if (severity === "Critical") {
    return {
      color: "var(--risk-critical)",
      bg: "color-mix(in srgb, var(--risk-critical) 10%, transparent)",
      border: "color-mix(in srgb, var(--risk-critical) 25%, transparent)",
    }
  }
  if (severity === "High") {
    return {
      color: "var(--risk-high)",
      bg: "color-mix(in srgb, var(--risk-high) 10%, transparent)",
      border: "color-mix(in srgb, var(--risk-high) 25%, transparent)",
    }
  }
  if (severity === "Medium") {
    return {
      color: "var(--risk-medium)",
      bg: "color-mix(in srgb, var(--risk-medium) 10%, transparent)",
      border: "color-mix(in srgb, var(--risk-medium) 25%, transparent)",
    }
  }
  return {
    color: "var(--risk-low)",
    bg: "color-mix(in srgb, var(--risk-low) 10%, transparent)",
    border: "color-mix(in srgb, var(--risk-low) 25%, transparent)",
  }
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

function stripHtml(value?: string) {
  if (!value) return ""

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export function MarketIntelligence() {
  const { data, isLoading, mutate } = useSWR<NewsResponse>("/api/news", fetcher, {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: true,
  })
  const [mounted, setMounted] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null)
  const [showAll, setShowAll] = useState(false)

  const articles = useMemo(() => (Array.isArray(data) ? data : data?.articles || []), [data])
  const visibleArticles = useMemo(() => (showAll ? articles : articles.slice(0, 3)), [articles, showAll])

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
    <div className="flex min-h-0 flex-col gap-3">
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
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 border-b border-border/35 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Newspaper className="h-4 w-4 text-primary" />
                <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" />
              </div>
              <p className="dashboard-section-kicker">
                Live Intelligence
              </p>
            </div>
            <h2 className="dashboard-section-title mt-1.5">
              Intelligence Feed
            </h2>
            <p className="dashboard-section-copy mt-1 text-sm leading-tight">
              External signals relevant to Ma&apos;aden, KSA mining, and commodity risk conditions.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => mutate()}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
              title="Refresh news"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <span className="flex items-center gap-1 rounded-full border border-risk-low/20 bg-risk-low/10 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.16em] text-risk-low">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[9px]">
        <span className="font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
          {articles.length} live item{articles.length !== 1 ? "s" : ""}
        </span>
        <span className="font-mono uppercase tracking-[0.16em] text-primary/60">
          Real-Time Feed
        </span>
      </div>

      {/* Google Sheets Sync Button */}
      <button
        onClick={handleSyncSheets}
        disabled={syncing}
        className="group relative mb-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border py-2 text-[9px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 disabled:cursor-not-allowed"
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

      {syncResult && (
        <div
          className="animate-fade-in-up mb-2 flex items-start gap-2 rounded-xl border p-2.5 text-[9px] font-mono transition-all"
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

      <div className="min-h-0 flex-1">
        <div className="flex flex-col gap-2">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border/30 bg-secondary/20 p-2.5">
                <div className="mb-2 h-3 w-3/4 rounded bg-secondary/40 animate-pulse" />
                <div className="mb-1 h-2 w-full rounded bg-secondary/20 animate-pulse" />
                <div className="h-2 w-2/3 rounded bg-secondary/20 animate-pulse" />
              </div>
            ))
          : visibleArticles.map((article, i) => {
              const catColor = CATEGORY_COLORS[article.category?.toLowerCase()] || "var(--muted-foreground)"
              const severityTone = getSeverityTone(article.severity)
              const cleanTitle = stripHtml(article.title) || "Untitled signal"
              const cleanSummary = stripHtml(article.summary || article.description || "No summary available for this signal.")
              const cleanImpact = stripHtml(article.businessImpact)
              const cleanBusiness = stripHtml(article.business)
              return (
                <div
                  key={i}
                  className="group rounded-2xl border border-border/35 bg-background/30 p-3 transition-all duration-200 hover:border-border/65 hover:bg-card/30"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
                      <span
                        className="rounded-full px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em]"
                        style={{
                          color: catColor,
                          backgroundColor: `color-mix(in srgb, ${catColor} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${catColor} 20%, transparent)`,
                        }}
                      >
                        <Tag className="mr-0.5 inline h-2 w-2" />
                        {article.category}
                      </span>
                      {article.severity && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em]"
                          style={{
                            color: severityTone.color,
                            backgroundColor: severityTone.bg,
                            border: `1px solid ${severityTone.border}`,
                          }}
                        >
                          {article.severity}
                        </span>
                      )}
                      <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground/55">
                        {article.sourceLabel || article.source}
                      </span>
                      {article.sourceType && (
                        <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-muted-foreground/40">
                          {article.sourceType}
                        </span>
                      )}
                    </div>
                    {article.url !== "#" && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-full p-1 text-muted-foreground/35 transition-colors hover:text-primary"
                        aria-label={`Open source for ${cleanTitle}`}
                        title="Open source"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <p className="mb-1.5 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {cleanTitle}
                  </p>

                  {cleanBusiness && (
                    <div className="mb-2 rounded-xl border border-primary/10 bg-primary/5 px-2.5 py-2">
                      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                        Business Exposure
                      </div>
                      <div className="mt-1 text-[13px] font-medium leading-tight text-foreground">
                        {cleanBusiness}
                      </div>
                    </div>
                  )}

                  <p className="line-clamp-3 text-[13px] leading-tight text-muted-foreground">
                    {cleanSummary}
                  </p>

                  {cleanImpact && (
                    <div className="mt-2 rounded-xl border border-border/35 bg-card/25 px-2.5 py-2">
                      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                        Business Impact
                      </div>
                      <div className="mt-1 line-clamp-2 text-[13px] leading-tight text-foreground/85">
                        {cleanImpact}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1.5 border-t border-border/30 pt-2">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground/45">
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                    {article.aiEnriched && (
                      <span className="ml-auto text-[8px] font-mono uppercase tracking-[0.14em] text-primary/65">
                        AI Enriched
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          {!isLoading && articles.length > 3 && (
            <button
              onClick={() => setShowAll((current) => !current)}
              className="rounded-xl border border-border/35 bg-background/24 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:border-border/60 hover:bg-card/24"
            >
              {showAll ? "Show Fewer Signals" : `View More (${articles.length - 3})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
