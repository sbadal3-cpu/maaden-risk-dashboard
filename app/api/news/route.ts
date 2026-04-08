import { NextResponse } from "next/server"

const NEWS_API_KEY = process.env.NEWS_API_KEY
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

// 🔥 GEO + MACRO QUERY
const QUERY = `
(mining OR metals OR commodities OR copper OR phosphate OR saudi mining)
AND
(geopolitics OR war OR sanctions OR china OR trade OR inflation OR interest rates OR energy crisis OR supply chain OR oil)
`

type IntelligenceArticle = {
  title: string
  source: string
  sourceLabel: string
  sourceType: string
  url: string
  publishedAt: string
  description: string
  summary: string
  category: string
  business: string
  businessImpact: string
  impact: string
  severity: "Low" | "Medium" | "High" | "Critical"
  severityLabel: string
  confidence: number
  score: number
  aiEnriched: boolean
}

type AIEnrichment = {
  category?: string
  business?: string
  impact?: string
  summary?: string
  severity?: string
  confidence?: number
}

function safeJsonParse(text: string | undefined): AIEnrichment | null {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function normalizeSeverity(value: string | undefined, score: number): IntelligenceArticle["severity"] {
  const normalized = (value || "").trim().toLowerCase()
  if (normalized === "critical") return "Critical"
  if (normalized === "high") return "High"
  if (normalized === "medium") return "Medium"
  if (normalized === "low") return "Low"

  if (score >= 8) return "Critical"
  if (score >= 6) return "High"
  if (score >= 3) return "Medium"
  return "Low"
}

function severityLabel(severity: IntelligenceArticle["severity"]) {
  switch (severity) {
    case "Critical":
      return "Immediate executive attention"
    case "High":
      return "Priority monitoring"
    case "Medium":
      return "Watchlist signal"
    default:
      return "Background signal"
  }
}

function normalizeSourceLabel(source: unknown) {
  if (typeof source === "string" && source.trim()) return source.trim()
  if (typeof source === "object" && source && "name" in source && typeof source.name === "string") {
    return source.name.trim() || "Unknown"
  }
  return "Unknown"
}

function normalizeSourceType(label: string) {
  const source = label.toLowerCase()
  if (source.includes("reuters") || source.includes("bloomberg") || source.includes("financial times") || source.includes("wsj")) {
    return "Financial Press"
  }
  if (source.includes("newsapi") || source.includes("google news")) return "Aggregator"
  if (source.includes("mining") || source.includes("metal") || source.includes("commodity")) return "Sector Press"
  return "General Press"
}

function fallbackBusiness(title: string) {
  const text = title.toLowerCase()
  if (text.includes("phosphate")) return "Phosphate"
  if (text.includes("aluminium") || text.includes("aluminum")) return "Aluminium"
  if (text.includes("gold")) return "Gold"
  if (text.includes("copper")) return "Copper"
  if (text.includes("energy") || text.includes("power")) return "Energy and utilities"
  if (text.includes("shipping") || text.includes("logistics") || text.includes("port")) return "Logistics and exports"
  return "Enterprise portfolio"
}

function fallbackCategory(title: string) {
  const text = title.toLowerCase()
  if (text.includes("war") || text.includes("sanction") || text.includes("china") || text.includes("trade")) return "Geopolitical"
  if (text.includes("regulation") || text.includes("policy") || text.includes("cbam")) return "Regulatory"
  if (text.includes("energy") || text.includes("supply chain") || text.includes("shipping")) return "Operational"
  if (text.includes("emissions") || text.includes("climate") || text.includes("esg")) return "ESG"
  return "Financial"
}

function fallbackImpact(title: string, business: string) {
  const text = title.toLowerCase()
  if (text.includes("war") || text.includes("red sea") || text.includes("shipping")) {
    return `${business} exposure may tighten through logistics disruption and export delays.`
  }
  if (text.includes("rate") || text.includes("inflation") || text.includes("cost")) {
    return `${business} margins may compress as macro conditions pressure cost and funding assumptions.`
  }
  if (text.includes("china") || text.includes("trade") || text.includes("sanction")) {
    return `${business} planning may need adjustment as trade flows and customer demand shift.`
  }
  return `${business} operations may face pressure if the signal develops further.`
}

function fallbackSummary(title: string, description: string, impact: string) {
  if (description.trim()) return description.trim()
  return `${title.trim()}. ${impact}`
}

// 🔹 CLAUDE AI ENRICHMENT (REAL INTELLIGENCE)
async function enrichWithAI(article: { title: string; description?: string }) {
  if (!CLAUDE_API_KEY) return null

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `
You are a mining and geopolitical risk analyst for Ma’aden.

Analyze this news headline:

"${article.title}"

Context:
"${article.description || "No source summary available."}"

Return ONLY JSON:
{
  "category": "Financial | Operational | Regulatory | ESG | Geopolitical",
  "business": "Which Ma’aden business is impacted",
  "impact": "Short explanation",
  "summary": "One-sentence executive summary",
  "severity": "Low | Medium | High | Critical",
  "confidence": number
}
`
          }
        ]
      })
    })

    if (!res.ok) return null

    const data = await res.json()
    return safeJsonParse(data?.content?.[0]?.text)
  } catch {
    return null
  }
}

// 🔹 FALLBACK SCORING
function fallbackScore(title: string) {
  const t = title.toLowerCase()
  let score = 0

  if (t.includes("mining")) score += 3
  if (t.includes("metal")) score += 2
  if (t.includes("commodity")) score += 2
  if (t.includes("china") || t.includes("war") || t.includes("sanction")) score += 3
  if (t.includes("price") || t.includes("cost")) score += 2

  return score
}

// 🔹 NewsAPI
async function fetchNewsAPI() {
  if (!NEWS_API_KEY) return []

  try {
    const url = `https://newsapi.org/v2/everything?q=${QUERY}&sortBy=publishedAt&pageSize=15&language=en&apiKey=${NEWS_API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    return data.articles || []
  } catch {
    return []
  }
}

// 🔹 Google News RSS (UPDATED GEO)
async function fetchGoogleNews() {
  try {
    const url =
      "https://news.google.com/rss/search?q=mining+commodities+geopolitics+china+energy+crisis+oil+war+interest+rates&hl=en&gl=US&ceid=US:en"

    const res = await fetch(url)
    const text = await res.text()

    const matches = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)]

    return matches.slice(0, 10).map(match => {
      const item = match[1]

      const title =
        item.match(/<title>(.*?)<\/title>/)?.[1] || "No title"

      const link =
        item.match(/<link>(.*?)<\/link>/)?.[1] || "#"

      const pubDate =
        item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ""

      const description =
        item.match(/<description>(.*?)<\/description>/)?.[1]?.replace(/<[^>]+>/g, "").trim() || ""

      return {
        title,
        source: "Google News",
        url: link,
        publishedAt: pubDate,
        description,
      }
    })
  } catch {
    return []
  }
}

function normalizeArticle(article: any, ai: AIEnrichment | null): IntelligenceArticle {
  const sourceLabel = normalizeSourceLabel(article.source)
  const sourceType = normalizeSourceType(sourceLabel)
  const title = article.title || "Untitled signal"
  const description = typeof article.description === "string" ? article.description.trim() : ""
  const score = fallbackScore(title)
  const business = ai?.business?.trim() || fallbackBusiness(title)
  const impact = ai?.impact?.trim() || fallbackImpact(title, business)
  const summary = ai?.summary?.trim() || fallbackSummary(title, description, impact)
  const severity = normalizeSeverity(ai?.severity, score)
  const publishedAt = article.publishedAt || new Date().toISOString()
  const category = ai?.category?.trim() || fallbackCategory(title)

  return {
    title,
    source: sourceLabel,
    sourceLabel,
    sourceType,
    url: article.url || "#",
    publishedAt,
    description: summary,
    summary,
    category,
    business,
    businessImpact: impact,
    impact,
    severity,
    severityLabel: severityLabel(severity),
    confidence: typeof ai?.confidence === "number" ? ai.confidence : 60,
    score,
    aiEnriched: Boolean(ai),
  }
}

// 🔹 MAIN API
export async function GET() {
  try {
    const [news1, news2] = await Promise.all([
      fetchNewsAPI(),
      fetchGoogleNews(),
    ])

    const combined = [...news1, ...news2]

    // 🔥 AI ENRICHMENT (CLAUDE)
    const enriched: IntelligenceArticle[] = await Promise.all(
      combined.map(async (a: any) => {
        const ai = await enrichWithAI(a)
        return normalizeArticle(a, ai)
      })
    )

    // 🔹 FILTER + SORT
    const filtered = enriched
      .filter(
        n =>
          !n.title.toLowerCase().includes("bitcoin") &&
          !n.title.toLowerCase().includes("celebrity")
      )
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })

    // 🔹 REMOVE DUPLICATES
    const unique = Array.from(
      new Map(filtered.map(item => [item.title, item])).values()
    )

    return NextResponse.json(unique.slice(0, 12))

  } catch {
    return NextResponse.json([
      {
        title: "Fallback: Global mining risk from macroeconomic pressure",
        source: "System",
        sourceLabel: "System",
        sourceType: "System",
        url: "#",
        publishedAt: new Date().toISOString(),
        description: "Macroeconomic pressure is creating broad cost and margin pressure across the mining sector.",
        summary: "Macroeconomic pressure is creating broad cost and margin pressure across the mining sector.",
        category: "Financial",
        business: "Mining",
        businessImpact: "Macroeconomic pressure impacting margins",
        impact: "Macroeconomic pressure impacting margins",
        severity: "High",
        severityLabel: "Priority monitoring",
        confidence: 50,
        score: 5,
        aiEnriched: false,
      },
    ])
  }
}
