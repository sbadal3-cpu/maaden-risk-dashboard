"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, X } from "lucide-react"

let showToastFn: ((message: string) => void) | null = null

export function triggerExportToast(message: string) {
  showToastFn?.(message)
}

export function ExportToast() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState("")

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
  }, [])

  useEffect(() => {
    showToastFn = show
    return () => { showToastFn = null }
  }, [show])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-in-right">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "color-mix(in srgb, var(--risk-low) 40%, var(--border))",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 12px color-mix(in srgb, var(--risk-low) 20%, transparent)",
        }}
      >
        <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "color-mix(in srgb, var(--risk-low) 15%, transparent)" }}
        >
          <CheckCircle2 className="h-4 w-4 text-risk-low" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground">{message}</p>
          <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
            {"Ma'aden"} Corporate Format | SAR Values | ICMM Aligned
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-2 p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
