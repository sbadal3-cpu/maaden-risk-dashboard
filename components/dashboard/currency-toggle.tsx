"use client"

import { motion } from "framer-motion"

export type Currency = "SAR" | "USD"

interface CurrencyToggleProps {
  currency: Currency
  onToggle: (c: Currency) => void
}

export function CurrencyToggle({ currency, onToggle }: CurrencyToggleProps) {
  return (
    <div className="flex items-center gap-1.5 p-0.5 rounded bg-secondary/60 border border-border/50">
      {(["SAR", "USD"] as const).map((c) => (
        <button
          key={c}
          onClick={() => onToggle(c)}
          className="relative px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all duration-200"
          style={{
            color: currency === c ? "var(--primary-foreground)" : "var(--muted-foreground)",
          }}
        >
          {currency === c && (
            <motion.div
              layoutId="currency-toggle-bg"
              className="absolute inset-0 rounded"
              style={{ backgroundColor: "var(--primary)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">
            {c === "SAR" ? "SAR" : "USD"}
          </span>
        </button>
      ))}
    </div>
  )
}
