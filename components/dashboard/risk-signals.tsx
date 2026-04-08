import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

type SignalSeverityGroup = "Critical" | "High" | "Moderate / Low"

const GROUP_ORDER: SignalSeverityGroup[] = ["Critical", "High", "Moderate / Low"]
const DEFAULT_OPEN: Record<SignalSeverityGroup, boolean> = {
  Critical: true,
  High: true,
  "Moderate / Low": false,
}

function normalizeSeverity(severity?: string): SignalSeverityGroup {
  if (severity === "Critical") return "Critical"
  if (severity === "High") return "High"
  return "Moderate / Low"
}

function severityTone(severity?: string) {
  if (severity === "Critical") return "text-risk-critical"
  if (severity === "High") return "text-risk-high"
  if (severity === "Medium") return "text-risk-medium"
  return "text-risk-low"
}

function groupSignals(signals: any[]) {
  return GROUP_ORDER.map((group) => ({
    key: group,
    items: signals.filter((signal) => normalizeSeverity(signal.severity) === group),
  })).filter((group) => group.items.length > 0)
}

function SignalCard({ signal, onSelect }: { signal: any; onSelect: (signal: any) => void }) {
  return (
    <button
      onClick={() => onSelect(signal)}
      className="rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-all duration-200 hover:border-border/65 hover:bg-card/25"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/50">
            {signal.sourceLabel || signal.source}
            {signal.sourceType ? ` • ${signal.sourceType}` : ""}
          </div>
          <div className="mt-1 text-[13px] font-semibold leading-tight text-foreground">
            {signal.title}
          </div>
        </div>
        <div className={`shrink-0 text-[8px] font-mono uppercase tracking-[0.16em] ${severityTone(signal.severity)}`}>
          {signal.severity || "Low"}
        </div>
      </div>

      {signal.business && (
        <div className="mt-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-primary/65">
          {signal.business}
        </div>
      )}

      <div className="mt-1.5 text-[13px] leading-tight text-muted-foreground">
        {signal.businessImpact || signal.impact || signal.summary || "Potential signal requiring executive monitoring."}
      </div>
    </button>
  )
}

export default function RiskSignals({ news, onSelect }: any) {
  const surfacedSignals = [...news].slice(0, 8)
  const [openSections, setOpenSections] = useState<Record<SignalSeverityGroup, boolean>>(DEFAULT_OPEN)
  const [showMore, setShowMore] = useState(false)

  const primarySignals = surfacedSignals.slice(0, 4)
  const extraSignals = surfacedSignals.slice(4)
  const primaryGroups = useMemo(() => groupSignals(primarySignals), [primarySignals])
  const extraGroups = useMemo(() => groupSignals(extraSignals), [extraSignals])

  function toggleSection(section: SignalSeverityGroup) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/35 pb-3">
        <div>
          <p className="dashboard-section-kicker">
            Signal Monitor
          </p>
          <h2 className="dashboard-section-title mt-1">
            Live Risk Signals
          </h2>
        </div>
        <div className="rounded-full border border-border/50 bg-background/35 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {surfacedSignals.length} surfaced
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <div className="flex flex-col gap-2">
          {primaryGroups.map((group) => {
            const isOpen = openSections[group.key]

            return (
              <div key={group.key} className="rounded-2xl border border-border/35 bg-background/20">
                <button
                  onClick={() => toggleSection(group.key)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`text-[10px] font-mono uppercase tracking-[0.16em] ${severityTone(group.key === "Moderate / Low" ? "Medium" : group.key)}`}>
                      {group.key}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground/55">
                      {group.items.length}
                    </div>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 border-t border-border/30 px-2.5 py-2.5">
                        {group.items.map((signal, index) => (
                          <SignalCard key={`${group.key}-${index}`} signal={signal} onSelect={onSelect} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {extraSignals.length > 0 && (
            <div className="rounded-2xl border border-border/35 bg-background/16">
              <button
                onClick={() => setShowMore((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-primary/70">
                    View More
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {extraSignals.length} additional signal{extraSignals.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showMore ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {showMore && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 border-t border-border/30 px-2.5 py-2.5">
                      {extraGroups.map((group) => (
                        <div key={`more-${group.key}`} className="rounded-xl border border-border/30 bg-card/18 p-2.5">
                          <div className={`text-[9px] font-mono uppercase tracking-[0.16em] ${severityTone(group.key === "Moderate / Low" ? "Medium" : group.key)}`}>
                            {group.key}
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            {group.items.map((signal, index) => (
                              <SignalCard key={`more-${group.key}-${index}`} signal={signal} onSelect={onSelect} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
