"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved preference or system preference
    const saved = localStorage.getItem("maaden-theme") as "dark" | "light" | null
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle("light", saved === "light")
      document.documentElement.classList.toggle("dark", saved === "dark")
    }
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("maaden-theme", next)
    document.documentElement.classList.toggle("light", next === "light")
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  if (!mounted) {
    return (
      <div className="h-7 w-14 rounded-full bg-secondary border border-border" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center h-7 w-14 rounded-full transition-colors duration-300 border"
      style={{
        backgroundColor: theme === "dark" ? "var(--secondary)" : "var(--gold)",
        borderColor: theme === "dark" ? "var(--border)" : "var(--gold-dim)",
      }}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span
        className="absolute flex items-center justify-center h-5 w-5 rounded-full bg-card shadow-sm transition-transform duration-300"
        style={{
          transform: theme === "dark" ? "translateX(4px)" : "translateX(32px)",
        }}
      >
        {theme === "dark" ? (
          <Moon className="h-3 w-3 text-primary" />
        ) : (
          <Sun className="h-3 w-3 text-primary-foreground" style={{ color: "#6B5D3A" }} />
        )}
      </span>
      <span className="sr-only">
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </button>
  )
}
