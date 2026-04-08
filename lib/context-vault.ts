export type ContextVaultCategory =
  | "Strategic Vision"
  | "Governance & Appetite"
  | "Operational Intelligence"

export interface ContextVaultDocument {
  id: string
  name: string
  category: ContextVaultCategory
  fileType: string
  parseStatus: "parsed" | "partial" | "reference"
  parseNotes?: string
  summary: string
  excerpt: string
  content: string
  uploadedAt: string
  sizeLabel: string
}

export interface PolicyAlignmentAssessment {
  hasGovernanceContext: boolean
  thresholdPercent?: number
  exceedsTolerance: boolean
  status: "market-only" | "within-tolerance" | "exceeds-tolerance" | "context-without-limit"
  summary: string
  matchedGovernanceDocs: ContextVaultDocument[]
}

export const CONTEXT_VAULT_STORAGE_KEY = "maaden-context-vault"
export const CONTEXT_VAULT_UPDATED_EVENT = "maaden-context-vault-updated"

export const CONTEXT_VAULT_CATEGORIES: ContextVaultCategory[] = [
  "Strategic Vision",
  "Governance & Appetite",
  "Operational Intelligence",
]

export function readContextVault(): ContextVaultDocument[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(CONTEXT_VAULT_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((document) => ({
      id: document.id,
      name: document.name,
      category: document.category,
      fileType: document.fileType || "File",
      parseStatus: document.parseStatus || "reference",
      parseNotes: document.parseNotes,
      summary: document.summary || "",
      excerpt: document.excerpt || "",
      content: document.content || "",
      uploadedAt: document.uploadedAt,
      sizeLabel: document.sizeLabel || "Unknown size",
    }))
  } catch {
    return []
  }
}

export function writeContextVault(documents: ContextVaultDocument[]) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(CONTEXT_VAULT_STORAGE_KEY, JSON.stringify(documents))
  window.dispatchEvent(new CustomEvent(CONTEXT_VAULT_UPDATED_EVENT, { detail: documents }))
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function createContextVaultDocument(input: {
  name: string
  category: ContextVaultCategory
  fileType: string
  parseStatus: ContextVaultDocument["parseStatus"]
  parseNotes?: string
  summary: string
  excerpt: string
  content: string
  size: number
}): ContextVaultDocument {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    category: input.category,
    fileType: input.fileType,
    parseStatus: input.parseStatus,
    parseNotes: input.parseNotes,
    summary: input.summary.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content.trim(),
    uploadedAt: new Date().toISOString(),
    sizeLabel: formatFileSize(input.size),
  }
}

export function deriveExcerpt(text: string, maxLength = 280) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) return ""
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized
}

export function deriveSummary(name: string, category: ContextVaultCategory, text: string) {
  const excerpt = deriveExcerpt(text, 180)
  if (excerpt) return excerpt

  switch (category) {
    case "Strategic Vision":
      return `${name} adds internal strategic direction relevant to executive decision framing.`
    case "Governance & Appetite":
      return `${name} adds governance and risk appetite context for escalation decisions.`
    case "Operational Intelligence":
      return `${name} adds operating context relevant to asset-level response and execution.`
    default:
      return `${name} adds internal context to the dashboard.`
  }
}

export function rankContextDocuments(
  documents: ContextVaultDocument[],
  query: string,
  maxResults = 3
) {
  const normalizedQuery = query.toLowerCase()

  const scored = documents
    .map((document) => {
      const haystack = `${document.name} ${document.category} ${document.summary} ${document.excerpt} ${document.content}`.toLowerCase()
      let score = 0

      normalizedQuery.split(/\s+/).forEach((term) => {
        if (!term) return
        if (haystack.includes(term)) score += 1
      })

      if (haystack.includes("risk appetite") || haystack.includes("threshold")) score += 1
      if (haystack.includes("strategy") || haystack.includes("vision")) score += 1
      if (haystack.includes("operation") || haystack.includes("asset")) score += 1

      return { document, score }
    })
    .sort((a, b) => b.score - a.score || Number(new Date(b.document.uploadedAt)) - Number(new Date(a.document.uploadedAt)))

  return scored.filter((item) => item.score > 0).slice(0, maxResults).map((item) => item.document)
}

export function calculateContextInfluence(
  allDocuments: ContextVaultDocument[],
  matchedDocuments: ContextVaultDocument[]
) {
  if (allDocuments.length === 0 || matchedDocuments.length === 0) {
    return {
      internal: 0,
      market: 100,
      status: "Market-only mode",
    }
  }

  const categoryWeights: Record<ContextVaultCategory, number> = {
    "Strategic Vision": 28,
    "Governance & Appetite": 40,
    "Operational Intelligence": 32,
  }

  const internalRaw = matchedDocuments.reduce((total, document, index) => {
    const weight = categoryWeights[document.category] || 25
    const rankingAdjustment = Math.max(1, 1 - index * 0.18)
    return total + weight * rankingAdjustment
  }, 0)

  const internal = Math.min(88, Math.max(18, Math.round(internalRaw / 2.1)))
  const market = Math.max(12, 100 - internal)

  return {
    internal,
    market,
    status: internal >= 50 ? "Context-informed mode" : "Market-led mode",
  }
}

function extractTolerancePercent(document: ContextVaultDocument) {
  const haystack = `${document.summary} ${document.excerpt} ${document.content}`.toLowerCase()
  const explicitPattern =
    /(?:risk appetite|policy tolerance|tolerance|threshold|limit|maximum|max(?:imum)? exposure)[^.%\d]{0,60}(\d{1,2}(?:\.\d+)?)\s*%/g

  const matches = [...haystack.matchAll(explicitPattern)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value))

  if (matches.length > 0) {
    return Math.min(...matches)
  }

  return undefined
}

export function assessPolicyAlignment(
  documents: ContextVaultDocument[],
  severeImpactPercent: number
): PolicyAlignmentAssessment {
  const governanceDocs = documents.filter((document) => document.category === "Governance & Appetite")

  if (governanceDocs.length === 0) {
    return {
      hasGovernanceContext: false,
      exceedsTolerance: false,
      status: "market-only",
      summary: "No governance or appetite documents are loaded. Policy alignment cannot be evaluated in Market-only mode.",
      matchedGovernanceDocs: [],
    }
  }

  const thresholdCandidates = governanceDocs
    .map((document) => ({
      document,
      threshold: extractTolerancePercent(document),
    }))
    .filter((item) => typeof item.threshold === "number") as { document: ContextVaultDocument; threshold: number }[]

  if (thresholdCandidates.length === 0) {
    return {
      hasGovernanceContext: true,
      exceedsTolerance: false,
      status: "context-without-limit",
      summary: "Governance context is available, but no explicit numeric tolerance was detected in the loaded appetite documents.",
      matchedGovernanceDocs: governanceDocs.slice(0, 3),
    }
  }

  const tightest = thresholdCandidates.sort((a, b) => a.threshold - b.threshold)[0]
  const exceedsTolerance = severeImpactPercent > tightest.threshold

  return {
    hasGovernanceContext: true,
    thresholdPercent: tightest.threshold,
    exceedsTolerance,
    status: exceedsTolerance ? "exceeds-tolerance" : "within-tolerance",
    summary: exceedsTolerance
      ? `Current severe scenario impact of ${severeImpactPercent.toFixed(1)}% exceeds the clearest detected policy tolerance of ${tightest.threshold.toFixed(1)}%.`
      : `Current severe scenario impact of ${severeImpactPercent.toFixed(1)}% remains within the clearest detected policy tolerance of ${tightest.threshold.toFixed(1)}%.`,
    matchedGovernanceDocs: thresholdCandidates.slice(0, 3).map((item) => item.document),
  }
}
