export default function TopAlerts({ news, onSelect }: any) {
  const top = [...news].slice(0, 5)

  const severityTone = (severity: string) => {
    if (severity === "Critical" || severity === "High") {
      return {
        color: "var(--risk-critical)",
        bg: "color-mix(in srgb, var(--risk-critical) 10%, transparent)",
        border: "color-mix(in srgb, var(--risk-critical) 25%, transparent)",
      }
    }
    if (severity === "Medium") {
      return {
        color: "var(--risk-high)",
        bg: "color-mix(in srgb, var(--risk-high) 10%, transparent)",
        border: "color-mix(in srgb, var(--risk-high) 25%, transparent)",
      }
    }
    return {
      color: "var(--risk-low)",
      bg: "color-mix(in srgb, var(--risk-low) 10%, transparent)",
      border: "color-mix(in srgb, var(--risk-low) 25%, transparent)",
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/35 pb-3">
        <div>
          <p className="dashboard-section-kicker">
            Monitoring Strip
          </p>
          <h2 className="dashboard-section-title mt-1">
            Live Risk Signals
          </h2>
        </div>
        <div className="rounded-full border border-border/50 bg-background/35 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {top.length} active
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {top.map((n: any, i: number) => {
          const tone = severityTone(n.severity)
          return (
            <button
              key={i}
              onClick={() => onSelect(n)}
              className="group flex h-full min-h-[148px] flex-col rounded-2xl border border-border/40 bg-background/28 p-3 text-left transition-all duration-200 hover:border-border/70 hover:bg-card/30"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="rounded-full px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em]"
                  style={{
                    color: tone.color,
                    backgroundColor: tone.bg,
                    border: `1px solid ${tone.border}`,
                  }}
                >
                  {n.severity}
                </span>
                <div className="text-right">
                  <span className="block text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/50">
                    {n.category}
                  </span>
                  {n.sourceType && (
                    <span className="mt-1 block text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/35">
                      {n.sourceType}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm font-semibold leading-6 text-foreground">
                {n.title}
              </div>

              {n.business && (
                <div className="mt-2 text-[9px] font-mono uppercase tracking-[0.16em] text-primary/65">
                  {n.business}
                </div>
              )}

              <div className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {n.businessImpact || n.impact || "Potential signal requiring executive monitoring."}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/30 pt-3">
                <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/55">
                  {n.sourceLabel || n.source}
                </span>
                <div className="text-right">
                  {n.severityLabel && (
                    <span className="block text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/45">
                      {n.severityLabel}
                    </span>
                  )}
                  <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-primary transition-colors group-hover:text-primary/80">
                    Review →
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
