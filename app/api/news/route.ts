import { NextResponse } from "next/server"

const NEWS_API_KEY = process.env.NEWS_API_KEY!
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!// 🔥 replace this

// 🔥 GEO + MACRO QUERY
const QUERY = `
(mining OR metals OR commodities OR copper OR phosphate OR saudi mining)
AND
(geopolitics OR war OR sanctions OR china OR trade OR inflation OR interest rates OR energy crisis OR supply chain OR oil)
`

// 🔹 CLAUDE AI ENRICHMENT (REAL INTELLIGENCE)
async function enrichWithAI(article: any) {
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

Return ONLY JSON:
{
  "category": "Financial | Operational | Regulatory | ESG | Geopolitical",
  "business": "Which Ma’aden business is impacted",
  "impact": "Short explanation",
  "severity": "Low | Medium | High | Critical",
  "confidence": number
}
`
          }
        ]
      })
    })

    const data = await res.json()
    const text = data?.content?.[0]?.text

    try {
      return JSON.parse(text)
    } catch {
      return null
    }
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

      return {
        title,
        source: "Google News",
        url: link,
      }
    })
  } catch {
    return []
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
    const enriched = await Promise.all(
      combined.map(async (a: any) => {
        const ai = await enrichWithAI(a)

        const score = fallbackScore(a.title)

        return {
          title: a.title,
          source: a.source?.name || a.source || "Unknown",
          url: a.url,

          category: ai?.category || "General",
          business: ai?.business || "Mining",
          impact: ai?.impact || "Potential impact on operations",
          severity: ai?.severity || (score > 5 ? "High" : "Medium"),

          confidence: ai?.confidence || 60,
          score,
        }
      })
    )

    // 🔹 FILTER + SORT
    const filtered = enriched
      .filter(
        n =>
          !n.title.toLowerCase().includes("bitcoin") &&
          !n.title.toLowerCase().includes("celebrity")
      )
      .sort((a, b) => b.score - a.score)

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
        url: "#",
        category: "Financial",
        business: "Mining",
        impact: "Macroeconomic pressure impacting margins",
        severity: "High",
        confidence: 50,
        score: 5,
      },
    ])
  }
}