"use client"

import { useEffect, useMemo, useRef, useState, type ElementType } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, BookLock, FileText, Upload, X, ShieldCheck, Building2, Factory, Trash2 } from "lucide-react"

import {
  CONTEXT_VAULT_CATEGORIES,
  CONTEXT_VAULT_UPDATED_EVENT,
  createContextVaultDocument,
  deriveExcerpt,
  deriveSummary,
  readContextVault,
  writeContextVault,
  type ContextVaultCategory,
  type ContextVaultDocument,
} from "@/lib/context-vault"
import { parseContextVaultFile } from "@/lib/context-vault-parser"

const categoryIcons: Record<ContextVaultCategory, ElementType> = {
  "Strategic Vision": Building2,
  "Governance & Appetite": ShieldCheck,
  "Operational Intelligence": Factory,
}

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function parseStatusLabel(status: ContextVaultDocument["parseStatus"]) {
  switch (status) {
    case "parsed":
      return "Parsed"
    case "partial":
      return "Partial"
    default:
      return "Reference"
  }
}

export function ContextVault() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [documents, setDocuments] = useState<ContextVaultDocument[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ContextVaultCategory>("Strategic Vision")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setDocuments(readContextVault())

    const handleUpdate = () => {
      setDocuments(readContextVault())
    }

    window.addEventListener(CONTEXT_VAULT_UPDATED_EVENT, handleUpdate as EventListener)
    return () => window.removeEventListener(CONTEXT_VAULT_UPDATED_EVENT, handleUpdate as EventListener)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    if (open) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [open])

  const groupedCounts = useMemo(() => {
    return CONTEXT_VAULT_CATEGORIES.reduce((acc, category) => {
      acc[category] = documents.filter((document) => document.category === category).length
      return acc
    }, {} as Record<ContextVaultCategory, number>)
  }, [documents])

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const newDocuments: ContextVaultDocument[] = []

    for (const file of files) {
      const parsed = await parseContextVaultFile(file)
      const text = parsed.text

      newDocuments.push(
        createContextVaultDocument({
          name: file.name,
          category: selectedCategory,
          fileType: parsed.fileType,
          parseStatus: parsed.parseStatus,
          parseNotes: parsed.parseNotes,
          summary: deriveSummary(file.name, selectedCategory, text),
          excerpt: deriveExcerpt(text),
          content: text,
          size: file.size,
        })
      )
    }

    const next = [...newDocuments, ...documents]
    setDocuments(next)
    writeContextVault(next)
    event.target.value = ""
  }

  function removeDocument(id: string) {
    const next = documents.filter((document) => document.id !== id)
    setDocuments(next)
    writeContextVault(next)
  }

  const modeLabel = documents.length > 0 ? "Context active" : "Market-only mode"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-w-[138px] items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-left transition-colors hover:bg-card/40"
      >
        <BookLock className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Context Vault
          </div>
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
            Open Vault
          </div>
          <div className="mt-0.5 truncate text-[9px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
            {modeLabel}
          </div>
        </div>
      </button>

      {mounted && open && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/82 backdrop-blur-lg"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed inset-y-0 right-0 z-[110] h-screen w-full max-w-[480px] isolate border-l border-border/70 bg-[color:color-mix(in_srgb,var(--card)_100%,black_0%)] shadow-2xl shadow-black/90"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="relative flex h-full min-h-0 flex-col overflow-hidden"
            >
              <div className="shrink-0 border-b border-border/40 bg-[color:color-mix(in_srgb,var(--card)_97%,black_3%)] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                      Internal Knowledge Layer
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                      Context Vault
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Add strategic, governance, and operational context to sharpen executive framing while preserving the baseline market dashboard.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to dashboard
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-border/60 bg-background/40 p-2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Close Context Vault"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex min-h-0 flex-col gap-4 pb-4">
                <div className="rounded-2xl border border-border/50 bg-background/30 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                        Vault Metrics
                      </p>
                      <div className="mt-2 text-lg font-semibold text-foreground">
                        {documents.length} Total Context File{documents.length !== 1 ? "s" : ""}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {documents.length > 0
                          ? "Internal knowledge is loaded and available to influence decision framing."
                          : "No internal documents loaded. The dashboard remains fully operational in Market-only mode."}
                      </p>
                    </div>
                    <div className="rounded-full border border-border/50 bg-background/35 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      {modeLabel}
                    </div>
                  </div>
                </div>

                {documents.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-border/60 bg-background/20 px-5 py-6 text-center">
                    <FileText className="mx-auto h-8 w-8 text-primary/60" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">Market-only mode</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      No internal documents are currently loaded. External market intelligence, benchmarks, and risk signals remain fully functional.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/45 bg-background/24 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                          Stored Documents
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          Internal Context Inventory
                        </h3>
                      </div>
                      <div className="rounded-full border border-border/50 bg-background/35 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                        {documents.length} total
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {CONTEXT_VAULT_CATEGORIES.map((category) => {
                    const Icon = categoryIcons[category]
                    const isActive = selectedCategory === category

                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors"
                        style={{
                          backgroundColor: isActive ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "color-mix(in srgb, var(--background) 40%, transparent)",
                          borderColor: isActive ? "color-mix(in srgb, var(--primary) 25%, transparent)" : "color-mix(in srgb, var(--border) 60%, transparent)",
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-xl border border-border/50 bg-card/35 p-2">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{category}</div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                              {groupedCounts[category]} file{groupedCounts[category] !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary/25 hover:bg-card/20 hover:text-primary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload To {selectedCategory}
                  </button>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    PDF and DOCX are prioritized for parsing. Unsupported or unreadable files are stored safely as reference-only context.
                  </p>
                </div>

                {documents.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {documents.map((document) => {
                      const Icon = categoryIcons[document.category]

                      return (
                        <div
                          key={document.id}
                          className="rounded-2xl border border-border/45 bg-background/26 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-primary">
                                  {document.category}
                                </span>
                                <span className="rounded-full border border-border/50 bg-card/35 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-foreground/75">
                                  {document.fileType}
                                </span>
                                <span className="rounded-full border border-border/50 bg-card/35 px-2 py-0.5 text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
                                  {parseStatusLabel(document.parseStatus)}
                                </span>
                                <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/45">
                                  {document.sizeLabel}
                                </span>
                                <span className="text-[8px] font-mono uppercase tracking-[0.16em] text-muted-foreground/45">
                                  {formatTimestamp(document.uploadedAt)}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Icon className="h-4 w-4 shrink-0 text-primary" />
                                <div className="truncate text-sm font-semibold text-foreground">
                                  {document.name}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => removeDocument(document.id)}
                              className="rounded-full border border-border/60 bg-background/35 p-2 text-muted-foreground transition-colors hover:text-foreground"
                              aria-label={`Remove ${document.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="mt-3 rounded-xl border border-border/35 bg-card/25 p-3">
                            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                              Summary
                            </div>
                            <div className="mt-1 text-sm leading-6 text-foreground/90">
                              {document.summary}
                            </div>
                          </div>

                          {document.parseNotes && (
                            <div className="mt-3 rounded-xl border border-border/35 bg-background/20 p-3 text-sm leading-6 text-muted-foreground">
                              {document.parseNotes}
                            </div>
                          )}

                          {document.excerpt && (
                            <div className="mt-3 text-sm leading-6 text-muted-foreground">
                              {document.excerpt}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
