"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Palette } from "lucide-react"

type ThemeName = "executive" | "dark" | "light" | "bloomberg" | "oasis" | "mist"

const THEMES: { value: ThemeName; label: string }[] = [
  { value: "executive", label: "Executive" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "bloomberg", label: "Bloomberg" },
  { value: "oasis", label: "Oasis" },
  { value: "mist", label: "Mist" },
]

const DARK_THEMES: ThemeName[] = ["executive", "dark", "bloomberg"]

function applyTheme(next: ThemeName) {
  const root = document.documentElement
  root.dataset.theme = next
  root.classList.toggle("dark", DARK_THEMES.includes(next))
  root.classList.toggle("light", !DARK_THEMES.includes(next))
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("executive")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("maaden-theme") as ThemeName | null
    const nextTheme = saved && THEMES.some((option) => option.value === saved) ? saved : "executive"
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }, [])

  function handleChange(next: ThemeName) {
    setTheme(next)
    localStorage.setItem("maaden-theme", next)
    applyTheme(next)
  }

  if (!mounted) {
    return (
      <div className="h-10 w-full rounded-xl border border-border bg-secondary/60" />
    )
  }

  return (
    <label className="relative flex w-full min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
      <Palette className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        Theme
      </span>
      <select
        value={theme}
        onChange={(e) => handleChange(e.target.value as ThemeName)}
        className="min-w-0 flex-1 appearance-none bg-transparent pr-6 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground outline-none"
        aria-label="Select dashboard theme"
      >
        {THEMES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  )
}
