"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { TrendingUp, TrendingDown, Minus, Radio, BarChart3 } from "lucide-react"

interface StockData {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  previousClose: number
  volume: number
  marketCap: string
  currency: string
  lastUpdated: string
  isLive: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveTicker() {
  const { data, isLoading } = useSWR<StockData>("/api/stock", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-4 px-4 py-1.5 bg-card/60 border-b border-border/30">
        <div className="h-4 w-48 rounded bg-secondary/40 animate-pulse" />
      </div>
    )
  }

  const isPositive = (data?.change ?? 0) > 0
  const isNegative = (data?.change ?? 0) < 0
  const changeColor = isPositive
    ? "var(--risk-low)"
    : isNegative
      ? "var(--risk-critical)"
      : "var(--muted-foreground)"

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-card/60 border-b border-border/30 overflow-x-auto shrink-0">
      {/* Stock ticker */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-primary">
              Tadawul
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/50">|</span>
          <span className="text-[10px] font-mono font-semibold text-foreground">
            {data?.symbol ?? "1211.SR"}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {"Ma'aden"}
          </span>
        </div>

        {isLoading ? (
          <div className="h-4 w-24 rounded bg-secondary/40 animate-pulse" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-foreground tabular-nums">
              {data?.currency ?? "SAR"} {data?.price?.toFixed(2) ?? "--"}
            </span>
            <div className="flex items-center gap-1" style={{ color: changeColor }}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-[10px] font-mono font-semibold tabular-nums">
                {isPositive ? "+" : ""}
                {data?.change?.toFixed(2) ?? "0.00"}
              </span>
              <span className="text-[9px] font-mono tabular-nums">
                ({isPositive ? "+" : ""}
                {data?.changePercent?.toFixed(2) ?? "0.00"}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border/30 shrink-0" />

      {/* Day range */}
      {data && !isLoading && (
        <div className="hidden md:flex items-center gap-3 text-[9px] font-mono text-muted-foreground/60">
          <span>
            H <span className="text-foreground/70 tabular-nums">{data.high?.toFixed(2)}</span>
          </span>
          <span>
            L <span className="text-foreground/70 tabular-nums">{data.low?.toFixed(2)}</span>
          </span>
          <span>
            Vol <span className="text-foreground/70 tabular-nums">{(data.volume / 1000000).toFixed(1)}M</span>
          </span>
          <span>
            MCap <span className="text-foreground/70">{data.marketCap}</span>
          </span>
        </div>
      )}

      {/* Status badge */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-risk-low/10 border border-risk-low/20 text-risk-low">
          <Radio className="h-2.5 w-2.5 animate-pulse" />
          Real-Time
        </span>
      </div>
    </div>
  )
}
