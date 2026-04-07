"use client"

import { useState, useRef, useEffect } from "react"
import { risks, getRiskLevel, getRegionInfo, type Risk, type Region, REGIONS } from "@/lib/risk-data"
import {
  Sparkles,
  Send,
  FileSearch,
  Bot,
  User,
  Loader2,
  Search,
  Globe,
  Download,
} from "lucide-react"
import { exportAIAnalysis, extractRisksFromResponse } from "@/lib/excel-export"
import { triggerExportToast } from "@/components/dashboard/export-toast"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: string
}

function formatTime() {
  try {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  } catch {
    return "--:--"
  }
}

// ── Deep-search: find risks by keyword across name, category, causes, impacts, region ──
function searchRisks(query: string): Risk[] {
  const q = query.toLowerCase()
  return risks.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.causes.some((c) => c.toLowerCase().includes(q)) ||
      r.impacts.some((i) => i.toLowerCase().includes(q)) ||
      r.controls.some((c) => c.toLowerCase().includes(q)) ||
      (r.sourceDetail?.toLowerCase().includes(q) ?? false) ||
      (r.crossBorderImpact?.toLowerCase().includes(q) ?? false) ||
      r.region.toLowerCase().includes(q)
  )
}

// ── Region-aware search ──
function searchByRegion(region: Region): Risk[] {
  return risks.filter((r) => r.region === region)
}

function formatRiskList(matched: Risk[], label: string): string {
  if (matched.length === 0) return `No risks found matching "${label}".`
  const top = matched.slice(0, 8)
  const lines = top.map((r) => {
    const regionInfo = getRegionInfo(r.region)
    return `- ${regionInfo.flag} **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${getRiskLevel(r.likelihood, r.impact)} -- ${r.source.toUpperCase()} -- ${regionInfo.label}`
  })
  const header = `I found **${matched.length} risk(s)** matching "${label}" across our ${risks.length}-risk universe:\n\n`
  const footer =
    matched.length > 8
      ? `\n\n...and ${matched.length - 8} more. Use the Risk Universe tab with the search bar to browse all results.`
      : ""
  return header + lines.join("\n") + footer
}

function formatRegionReport(region: Region): string {
  const regionRisks = searchByRegion(region)
  const regionInfo = getRegionInfo(region)
  if (regionRisks.length === 0) return `No risks currently tracked for ${regionInfo.label}.`

  const critical = regionRisks.filter((r) => r.likelihood * r.impact >= 20)
  const high = regionRisks.filter((r) => r.likelihood * r.impact >= 12 && r.likelihood * r.impact < 20)
  const opportunities = regionRisks.filter((r) => r.status === "opportunity")
  const activeRisks = regionRisks.filter((r) => r.status !== "opportunity")

  let report = `${regionInfo.flag} **${regionInfo.label} Risk Report**\n\n`
  report += `Tracking **${regionRisks.length} risks** in the ${regionInfo.label} region:\n`
  report += `- **${critical.length}** Critical | **${high.length}** High | **${opportunities.length}** Opportunities\n\n`

  if (critical.length > 0) {
    report += `**Critical Risks:**\n`
    critical.forEach((r) => {
      report += `- **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${r.financialExposure || "Unquantified"}\n`
    })
    report += "\n"
  }

  if (high.length > 0) {
    report += `**High Risks:**\n`
    high.forEach((r) => {
      report += `- **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${r.financialExposure || "Unquantified"}\n`
    })
    report += "\n"
  }

  if (opportunities.length > 0) {
    report += `**Strategic Opportunities:**\n`
    opportunities.forEach((r) => {
      report += `- **${r.name}** (${r.id}) -- ${r.financialExposure || "Unquantified"}\n`
    })
    report += "\n"
  }

  // Cross-border impacts
  const crossBorder = regionRisks.filter((r) => r.crossBorderImpact)
  if (crossBorder.length > 0) {
    report += `**Cross-Border Impact on Ma'aden KSA:**\n`
    crossBorder.slice(0, 3).forEach((r) => {
      report += `- **${r.name}**: ${r.crossBorderImpact}\n`
    })
  }

  return report
}

// Region keyword detection
function detectRegion(text: string): Region | null {
  const lower = text.toLowerCase()
  if (lower.includes("europe") || lower.includes("eu ") || lower.includes("dutch") || lower.includes("netherlands") || lower.includes("rotterdam") || lower.includes("cbam") || lower.includes("european")) return "europe"
  if (lower.includes("africa") || lower.includes("african") || lower.includes("meridian") || lower.includes("sub-saharan") || lower.includes("saharan") || lower.includes("mombasa")) return "africa"
  if (lower.includes("america") || lower.includes("us ") || lower.includes("usa") || lower.includes("brazil") || lower.includes("manara") || lower.includes("vale") || lower.includes("canadian") || lower.includes("canada") || lower.includes("latin") || lower.includes("ira ")) return "americas"
  if (lower.includes("global") || lower.includes("worldwide") || lower.includes("international") || lower.includes("shipping lane") || lower.includes("cyber")) return "global"
  if (lower.includes("saudi") || lower.includes("ksa") || lower.includes("riyadh")) return "ksa"
  return null
}

function getInitialMessage(): Message {
  return {
    id: "init-1",
    role: "assistant",
    content: `Assalam alaikum. I am your Ma'aden AI Risk Advisor, powered by the **2026 Benchmark Engine** integrating **Top 10 Mining Risks 2026**, **Global Materials Perspective**, and the **FMF Barometer**.

I am tracking **${risks.length} risks** across our **Global Enterprise Risk Universe**, spanning **${REGIONS.length} regions**: ${REGIONS.map(r => `${r.flag} ${r.label}`).join(" | ")}.

**Intelligence Modules Active:**
- **Project Deep-Dive:** "Analyze Ar Rjum project risks" or "Phosphate 3 risk assessment"
- **Regional Intelligence:** "European market risks" or "Americas tariff exposure"
- **Cross-Border Cascade:** "How do international risks affect Saudi operations?"
- **Global Benchmarks:** "What do Global Risk Reports 2026 say about decarbonization?"
- **Stage-Gate Filter:** "Show me all Execution phase risks"

I can **deep-search** all ${risks.length} risks by topic, project, region, or benchmark source. How may I assist you today?`,
    timestamp: "",
  }
}

const ANALYZE_PHOSPHATE_RESPONSE = `**Phosphate 3 Project -- Risk Pre-Assessment Complete**

I have analyzed the Phosphate 3 expansion project against our **${risks.length}-risk universe** with **international dimension assessment**:

**Critical Findings (Stage: Pre-Feasibility / FEL 2):**

1. **Process Water Scarcity (R-043)** -- Score 20/25 -- CRITICAL -- SAR 320M revenue loss/month if production halts
   - Arid climate with <80mm annual rainfall
   - Desalination pipeline delay creates 18-month gap
   - Mitigation: Jabal Sayid partnership (done), pipeline commissioning (Q4 2026)

2. **Saudi Vision 2030 Local Content (R-048)** -- Score 12/25 -- HIGH -- SAR 380M procurement premium
   - IKTVA targets increasing to 70%
   - Limited local manufacturing for mining equipment

2. **Risk Intelligence: Geopolitical Supply Chain Disruption (R-045)** -- Score 12/25 -- HIGH -- SAR 420M procurement risk
   - Red Sea corridor shipping disruptions
   - Single-source dependency for critical equipment

**International Exposure (Cross-Border Cascade):**
- EU CBAM tariffs on phosphate exports to Europe (R-201): SAR 890M exposure
- Sub-Saharan feedstock from Meridian JV (R-209): SAR 380M FX exposure
- US IRA domestic content rules redirecting Americas sales (R-217): SAR 520M displacement
- Global shipping disruption through Red Sea/Suez (R-222): SAR 940M freight exposure

**Stage-Gate Position:** Pre-Feasibility (FEL 2) -- Gate 3 approval pending
**Total project risk exposure: SAR 3.58B** including international dimensions.
**Recommendation:** Cross-border scenario analysis within 14 business days. Water security plan mandatory before Gate 3 submission.`

const ANALYZE_ARRJUM_RESPONSE = `**Ar Rjum Project -- Comprehensive Risk Pre-Assessment**

Ar Rjum is a critical phosphate mining project in Ma'aden's northern development corridor. I have identified **24 directly applicable risks** from our ${risks.length}-risk universe:

**Critical-Level Risks (Score >= 20/25):**

1. **Process Water Scarcity -- Phosphate 3 (R-043)** -- Score 20/25 -- CRITICAL
   - Directly applicable: Ar Rjum shares the Northern Region water infrastructure
   - SAR 320M/month production halt risk
   - Desalination pipeline gap of 18 months

2. **Deep-Mine Operational Complexity (R-054)** -- Score 16/25 -- HIGH
   - Extraction depth challenges applicable to Ar Rjum deposit geometry
   - SAR 85M/yr additional operational cost

**High-Level Risks (Score >= 12/25):**

3. **Saudi Vision 2030 Local Content (R-048)** -- Score 12/25 -- SAR 380M procurement premium
4. **Risk Intelligence: Geopolitical Supply Chain (R-045)** -- Score 12/25 -- SAR 420M procurement risk
5. **Strategic Insights: Mining Productivity Gap (R-047)** -- Score 9/25 -- SAR 180M gap
6. **Regional Water Scarcity (R-034)** -- Score 12/25 -- SAR 180M water infrastructure
7. **Risk Intelligence: Decarbonization Pathway (R-037)** -- Score 12/25 -- SAR 2.1B retrofit exposure

**Stage-Gate Analysis for Ar Rjum:**
- Current Gate: FEL 2 (Pre-Feasibility)
- Gate 3 Requirements: Water security plan, EIA approval, IKTVA compliance plan, cost estimate +/-25%
- 7 gate-blocking risks identified requiring resolution before advancement

**International Exposure Impacting Ar Rjum:**
- EU CBAM on phosphate exports (R-201): SAR 890M -- affects Ar Rjum offtake pricing
- Global shipping disruption (R-222): SAR 940M -- threatens export logistics
- Currency fluctuation in African markets (R-209): SAR 380M -- Meridian JV feedstock impact

**Global 2026 Benchmark Alignment:**
- Global Risk Reports: Ar Rjum's water risk aligns with Risk Intelligence's #2 mining risk (infrastructure dependency)
- Global Risk Reports: Productivity gap benchmarking shows Ar Rjum must target first-quartile performance
- Global Risk Reports: Energy transition metal demand supports long-term phosphate fundamentals

**Total Ar Rjum risk exposure: SAR 4.82B** across all dimensions.
**Immediate Actions:** Prioritize water security (R-043), local content strategy (R-048), and Gate 3 cost estimate validation (R-041).`

const PORTFOLIO_RESPONSE = `Based on analysis of Ma'aden's **${risks.length}-risk** Global Enterprise Risk Universe:

**Portfolio Health Score: 62/100** (integrating Global Risk Reports 2026 benchmarks)

**Regional Breakdown:**
${REGIONS.map(reg => {
  const count = risks.filter(r => r.region === reg.key).length
  const critCount = risks.filter(r => r.region === reg.key && r.likelihood * r.impact >= 20).length
  return `- ${reg.flag} **${reg.label}**: ${count} risks (${critCount} critical)`
}).join("\n")}

**Top 5 Risks by Score:**
1. **EU Environmental Policy Shifts (R-201)** -- 16/25 -- Europe -- SAR 890M CBAM exposure
2. **Critical Mineral Trade Tariffs (R-215)** -- 16/25 -- Americas -- SAR 760M tariff exposure
3. **Global Shipping Lane Disruption (R-222)** -- 16/25 -- Global -- SAR 940M freight exposure
4. **Global Cybersecurity Threat (R-224)** -- 16/25 -- Global -- SAR 750M ransomware exposure
5. **Currency Fluctuation in Export Markets (R-209)** -- 12/25 -- Africa -- SAR 380M FX exposure

**By Source:** ${risks.filter((r) => r.source === "internal").length} Internal | ${risks.filter((r) => r.source === "regional").length} Regional | ${risks.filter((r) => r.source === "riskIntelligence").length} Risk Intelligence | ${risks.filter((r) => r.source === "strategicInsights").length} Strategic Insights

Shall I drill into a specific region or run a cross-border scenario analysis?`

function formatStageReport(stageKey: string): string {
  const stageRisks = risks.filter((r) => r.stage === stageKey)
  const stageInfo = { exploration: "Exploration (Gate 1)", fel1: "Scoping / FEL 1 (Gate 2)", fel2: "Pre-Feasibility / FEL 2 (Gate 3)", fel3: "Feasibility / FEL 3 (Gate 4)", execution: "Execution (Gate 5)", operations: "Operations / Closure (Post-Gate)" }[stageKey] || stageKey

  if (stageRisks.length === 0) return `No risks found for stage "${stageKey}".`

  const critical = stageRisks.filter((r) => r.likelihood * r.impact >= 20)
  const high = stageRisks.filter((r) => r.likelihood * r.impact >= 12 && r.likelihood * r.impact < 20)
  const opps = stageRisks.filter((r) => r.status === "opportunity")

  let report = `**${stageInfo} -- Stage-Gate Risk Report**\n\n`
  report += `Tracking **${stageRisks.length} risks** in this stage-gate phase:\n`
  report += `- **${critical.length}** Critical | **${high.length}** High | **${opps.length}** Opportunities\n\n`

  if (critical.length > 0) {
    report += `**Critical Risks:**\n`
    critical.forEach((r) => { report += `- **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${r.financialExposure || "Unquantified"}\n` })
    report += "\n"
  }
  if (high.length > 0) {
    report += `**High Risks (Top 5):**\n`
    high.slice(0, 5).forEach((r) => { report += `- **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${r.financialExposure || "Unquantified"}\n` })
    if (high.length > 5) report += `...and ${high.length - 5} more high risks.\n`
    report += "\n"
  }
  if (opps.length > 0) {
    report += `**Strategic Opportunities:**\n`
    opps.forEach((r) => { report += `- **${r.name}** (${r.id}) -- ${r.financialExposure || "Unquantified"}\n` })
    report += "\n"
  }

  // Gate requirements summary
  const gateItems = stageRisks.filter((r) => r.gateRequirement).slice(0, 5)
  if (gateItems.length > 0) {
    report += `**Gate Requirements (from risk register):**\n`
    gateItems.forEach((r) => { report += `- ${r.gateRequirement}\n` })
  }

  return report
}

function formatBenchmarkReport(source: string): string {
  const lower = source.toLowerCase()
  const isRiskIntelligence = lower.includes("risk intelligence") || lower.includes("global risk reports") || lower.includes("risk reports")
  const isStrategicInsights = lower.includes("strategic insights") || lower.includes("strategic insight")

  const benchRisks = risks.filter((r) => {
    if (isRiskIntelligence && isStrategicInsights) return r.source === "riskIntelligence" || r.source === "strategicInsights"
    if (isRiskIntelligence) return r.source === "riskIntelligence"
    if (isStrategicInsights) return r.source === "strategicInsights"
    return r.source === "riskIntelligence" || r.source === "strategicInsights"
  })

  const label = isRiskIntelligence && isStrategicInsights ? "Global Risk Reports 2026" : isRiskIntelligence ? "Risk Intelligence 2026" : isStrategicInsights ? "Strategic Insights Global Materials 2026" : "Global Benchmarks"

  let report = `**${label} -- Benchmark Intelligence Report**\n\n`
  report += `**${benchRisks.length} risks** sourced from ${label} are tracked in Ma'aden's risk universe:\n\n`

  const critical = benchRisks.filter((r) => r.likelihood * r.impact >= 20)
  const high = benchRisks.filter((r) => r.likelihood * r.impact >= 12)

  if (critical.length > 0) {
    report += `**Critical Benchmark Risks:**\n`
    critical.forEach((r) => {
      const ri = getRegionInfo(r.region)
      report += `- ${ri.flag} **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${r.financialExposure || "Unquantified"}\n`
    })
    report += "\n"
  }

  report += `**High Benchmark Risks (Top 8):**\n`
  high.filter((r) => r.likelihood * r.impact < 20).slice(0, 8).forEach((r) => {
    const ri = getRegionInfo(r.region)
    report += `- ${ri.flag} **${r.name}** (${r.id}) -- Score ${r.likelihood * r.impact}/25 -- ${r.financialExposure || "Unquantified"}\n`
  })

  report += `\n**Key 2026 Themes:**\n`
  if (isRiskIntelligence || (!isRiskIntelligence && !isStrategicInsights)) {
    report += `- **Social License:** Risk Intelligence's #1 mining risk -- community opposition delaying $12B+ globally\n`
    report += `- **Decarbonization Capital:** $200-250B sector investment needed by 2035\n`
    report += `- **Geopolitical Fragmentation:** Critical minerals subject to export controls\n`
  }
  if (isStrategicInsights || (!isRiskIntelligence && !isStrategicInsights)) {
    report += `- **Productivity Decline:** 28% sector-wide decline since 2004 (Strategic Insights)\n`
    report += `- **Critical Minerals Gap:** 35% supply shortfall projected by 2030\n`
    report += `- **Climate Physical Risk:** $140B mining asset value at risk by 2035\n`
  }

  return report
}

// Stage detection
function detectStage(text: string): string | null {
  const lower = text.toLowerCase()
  if (lower.includes("exploration")) return "exploration"
  if (lower.includes("scoping") || lower.includes("fel 1") || lower.includes("fel1")) return "fel1"
  if (lower.includes("pre-feasibility") || lower.includes("prefeasibility") || lower.includes("fel 2") || lower.includes("fel2")) return "fel2"
  if (lower.includes("feasibility") || lower.includes("fel 3") || lower.includes("fel3") || lower.includes("bankable")) return "fel3"
  if (lower.includes("execution") || lower.includes("construction") || lower.includes("commissioning")) return "execution"
  if (lower.includes("operation") || lower.includes("closure") || lower.includes("steady-state") || lower.includes("steady state")) return "operations"
  return null
}

export function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>(() => [getInitialMessage()])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const extractSearchTerms = (text: string): string[] => {
    const keywords = [
      "safety","seismic","water","cyber","gold","phosphate","aluminium","tailings",
      "workforce","labor","decarbonization","carbon","climate","environmental",
      "financial","operational","strategic","technology","legal","regulatory",
      "supply chain","community","social","security","deep-mine","risk intelligence","strategic insights",
      "vision 2030","saudization","rare earth","copper","lithium","flood",
      "heat","sandstorm","equipment","conveyor","crusher","ventilation",
      "pit wall","collapse","blasting","ore grade","power","fuel",
      "autonomous","drone","shipping","export","insurance","fraud",
      "biodiversity","circular","productivity","infrastructure",
      "tariff","cbam","rotterdam","logistics","currency","fx","sanctions",
      "eu","european","dutch","netherlands","africa","african","meridian",
      "americas","manara","vale","brazil","canada","ira","mining code",
      "port","shipping lane","suez","panama","ar rjum","phosphate 3",
      "northern region","pipeline","railway","resettlement","ocp","rare earth byproduct",
      "war","conflict","military","armed","attack","missile","drone","houthi",
      "red sea","iran","nuclear","sanctions","ukraine","terrorism","cyber warfare",
      "conscription","insurance","refugee","displaced","defense","geopolitical",
      "escalation","blockade","evacuation","sabotage","ransomware","weaponization",
    ]
    const lower = text.toLowerCase()
    return keywords.filter((kw) => lower.includes(kw))
  }

  async function handleSend(content?: string) {
    const text = content || input.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: formatTime(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1400 + Math.random() * 1000))

    const lower = text.toLowerCase()
    let responseText: string

    // Route 0: Region-specific queries
    const detectedRegion = detectRegion(text)
    const isRegionQuery = detectedRegion && (
      lower.includes("risk") || lower.includes("what") || lower.includes("show") ||
      lower.includes("list") || lower.includes("market") || lower.includes("exposure") ||
      lower.includes("issue") || lower.includes("challenge") || lower.includes("tell")
    )

    if (lower.includes("ar rjum") || lower.includes("arrjum") || lower.includes("ar-rjum")) {
      responseText = ANALYZE_ARRJUM_RESPONSE
    } else if (lower.includes("analyze") && (lower.includes("project") || lower.includes("phosphate"))) {
      responseText = ANALYZE_PHOSPHATE_RESPONSE
    } else if (lower.includes("phosphate 3") || lower.includes("phosphate3")) {
      responseText = ANALYZE_PHOSPHATE_RESPONSE
    } else if (
      lower.includes("portfolio") ||
      lower.includes("overview") ||
      lower.includes("summary") ||
      lower.includes("top risk") ||
      lower.includes("benchmark") ||
      lower.includes("7.8")
    ) {
      responseText = PORTFOLIO_RESPONSE
    } else if ((lower.includes("risk intelligence") || lower.includes("global risk reports") || lower.includes("strategic insights") || lower.includes("risk reports") || lower.includes("benchmark")) && (lower.includes("risk") || lower.includes("say") || lower.includes("report") || lower.includes("what") || lower.includes("show") || lower.includes("2026") || lower.includes("decarbon") || lower.includes("product"))) {
      responseText = formatBenchmarkReport(text)
    } else if ((lower.includes("stage") || lower.includes("gate") || lower.includes("phase") || lower.includes("fel")) && (lower.includes("risk") || lower.includes("show") || lower.includes("what") || lower.includes("list") || lower.includes("all"))) {
      const detectedStage = detectStage(text)
      if (detectedStage) {
        responseText = formatStageReport(detectedStage)
      } else {
        // Show all stages summary
        const stageKeys = ["exploration", "fel1", "fel2", "fel3", "execution", "operations"] as const
        responseText = `**Stage-Gate Risk Distribution**\n\n`
        stageKeys.forEach((sk) => {
          const count = risks.filter((r) => r.stage === sk).length
          const critCount = risks.filter((r) => r.stage === sk && r.likelihood * r.impact >= 20).length
          const label = { exploration: "Exploration (Gate 1)", fel1: "Scoping / FEL 1 (Gate 2)", fel2: "Pre-Feasibility / FEL 2 (Gate 3)", fel3: "Feasibility / FEL 3 (Gate 4)", execution: "Execution (Gate 5)", operations: "Operations / Closure (Post-Gate)" }[sk]
          responseText += `- **${label}**: ${count} risks (${critCount} critical)\n`
        })
        responseText += `\n**Total: ${risks.length} risks** across 6 Stage-Gates.\nAsk about a specific stage: "Show me all Execution phase risks" or "FEL 2 risk assessment"`
      }
    } else if (isRegionQuery && detectedRegion) {
      // Generate region-specific report
      responseText = formatRegionReport(detectedRegion)

      // Also search for specific terms in the query for context
      const terms = extractSearchTerms(text)
      if (terms.length > 0) {
        const termMatched = new Map<string, Risk>()
        for (const term of terms) {
          for (const r of searchRisks(term)) {
            if (r.region === detectedRegion) termMatched.set(r.id, r)
          }
        }
        if (termMatched.size > 0) {
          responseText += `\n\n**Specific matches for "${terms.join(", ")}" in ${getRegionInfo(detectedRegion).label}:**\n`
          Array.from(termMatched.values()).slice(0, 5).forEach((r) => {
            responseText += `- **${r.name}** (${r.id}) -- ${r.financialExposure || "Unquantified"}\n`
          })
        }
      }
    } else if (lower.includes("cross-border") || lower.includes("cross border") || lower.includes("cascade") || lower.includes("how does") || lower.includes("impact saudi")) {
      // Cross-border impact query
      const intlRisks = risks.filter((r) => r.region !== "ksa" && r.crossBorderImpact)
      responseText = `**Cross-Border Risk Cascade Analysis**\n\n`
      responseText += `Tracking **${intlRisks.length} international risks** with documented impact pathways to Ma'aden KSA operations:\n\n`
      intlRisks.slice(0, 6).forEach((r) => {
        const ri = getRegionInfo(r.region)
        responseText += `${ri.flag} **${r.name}** (${r.id}):\n${r.crossBorderImpact}\n\n`
      })
      responseText += `All cross-border impacts ultimately affect Ma'aden's Saudi Arabian revenue, cost structure, or strategic positioning. Click any international risk in the Risk Universe to see the full Geographic Impact Map.`
    } else {
      // Deep-search mode
      const terms = extractSearchTerms(text)
      if (terms.length > 0) {
        const allMatched = new Map<string, Risk>()
        for (const term of terms) {
          for (const r of searchRisks(term)) {
            allMatched.set(r.id, r)
          }
        }
        const matched = Array.from(allMatched.values()).sort(
          (a, b) => b.likelihood * b.impact - a.likelihood * a.impact
        )
        responseText = formatRiskList(matched, terms.join(", "))

        if (matched.length > 0) {
          const criticalCount = matched.filter((r) => r.likelihood * r.impact >= 20).length
          const intlCount = matched.filter((r) => r.region !== "ksa").length
          const sarMatches = matched.flatMap((r) => r.impacts).filter((i) => i.includes("SAR"))
          responseText += `\n\n**Analysis:** ${criticalCount} critical-level risk(s) found. ${intlCount} international risk(s). ${sarMatches.length} impact(s) have quantified SAR exposure. Click any risk in the Risk Universe tab to view the full Bow-Tie analysis, Geographic Impact Map, and mitigation timeline.`
        }
      } else {
        responseText = `I can help with that. Let me search across our **${risks.length}-risk** universe spanning **${REGIONS.length} regions**.\n\n**Quick Commands:**\n- **Regional:** "What are our risks in the European market?" or "Africa exposure"\n- **Topic:** "What are the safety risks?" or "Show me water risks"\n- **Cross-border:** "How do international risks affect Saudi operations?"\n- **Overview:** "Show me the top risks" or "Portfolio summary"\n- **Analyze:** "Analyze the Phosphate 3 project"\n\n**Regional Breakdown:** ${REGIONS.map(r => `${r.flag} ${r.label}: ${risks.filter(ri => ri.region === r.key).length}`).join(" | ")} | Total: **${risks.length}**`
      }
    }

    const assistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: "assistant",
      content: responseText,
      timestamp: formatTime(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsLoading(false)
  }

  function handleAnalyzeNewProject() {
    handleSend("Analyze the Phosphate 3 expansion project: Run a comprehensive risk pre-assessment with international dimensions and Stage-Gate mapping.")
  }

  function renderMessageContent(content: string) {
    return content.split("\n").map((line, i) => {
      const trimmed = line.trim()
      if (trimmed === "") return <br key={i} />
      if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.indexOf("**", 2) === trimmed.length - 2) {
        return <p key={i} className="font-semibold text-foreground my-1">{trimmed.slice(2, -2)}</p>
      }
      if (/^\d+\./.test(trimmed)) return <p key={i} className="ml-3 my-0.5 text-foreground/80">{renderInlineBold(trimmed)}</p>
      if (trimmed.startsWith("- ")) return <p key={i} className="ml-3 my-0.5 text-foreground/80">{renderInlineBold(trimmed)}</p>
      return <p key={i} className="my-0.5">{renderInlineBold(trimmed)}</p>
    })
  }

  function renderInlineBold(text: string) {
    const parts = text.split("**")
    return parts.map((part, j) =>
      j % 2 === 1 ? <span key={j} className="font-semibold text-primary">{part}</span> : <span key={j}>{part}</span>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">{"Ma'aden"} AI Advisor</h2>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
              2026 Benchmark Engine | {REGIONS.length}-Region Intelligence | {risks.length} risks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="h-3 w-3 text-risk-low/60" />
          <span className="text-[8px] font-mono text-risk-low uppercase">Global Search Active</span>
        </div>
      </div>

      {/* Quick region buttons */}
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {REGIONS.filter(r => r.key !== "global").map((region) => (
          <button
            key={region.key}
            onClick={() => handleSend(`What are our risks in the ${region.label} market?`)}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all whitespace-nowrap disabled:opacity-50"
            style={{ color: region.color }}
          >
            <span className="text-[10px]">{region.flag}</span>
            {region.label}
          </button>
        ))}
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={handleAnalyzeNewProject}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5 rounded border text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSearch className="h-3.5 w-3.5" />
          Phosphate 3 Assessment
        </button>
        <button
          onClick={() => handleSend("Analyze Ar Rjum project risks with Stage-Gate mapping and international exposure")}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5 rounded border text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-3.5 w-3.5" />
          Ar Rjum Risk Analysis
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 mb-3 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${msg.role === "assistant" ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "bg-secondary text-muted-foreground ring-1 ring-border"}`}>
              {msg.role === "assistant" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
            </div>
            <div className={`flex-1 p-3 rounded-lg text-[11px] leading-relaxed ${msg.role === "assistant" ? "bg-secondary/40 border border-border/40 text-foreground/90" : "bg-primary/10 border border-primary/20 text-foreground/90"}`}>
              {renderMessageContent(msg.content)}
              {/* Export button for assistant messages with risk analysis */}
              {msg.role === "assistant" && msg.id !== "init-1" && (
                <button
                  onClick={() => {
                    const matched = extractRisksFromResponse(msg.content, risks)
                    if (matched.length > 0) {
                      const title = msg.content.split("\n")[0].replace(/\*\*/g, "").slice(0, 60)
                      exportAIAnalysis(matched, title)
                      triggerExportToast(`Exported ${matched.length} risk(s) to Excel`)
                    } else {
                      triggerExportToast("No specific risks found in this analysis to export")
                    }
                  }}
                  className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 border"
                  style={{
                    color: "var(--primary)",
                    backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                    borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--primary) 18%, transparent)"
                    e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 45%, transparent)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--primary) 8%, transparent)"
                    e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 25%, transparent)"
                  }}
                >
                  <Download className="h-3 w-3" />
                  Export this Analysis to Excel
                </button>
              )}
              {mounted && msg.timestamp && (
                <span className="block text-[8px] text-muted-foreground/40 font-mono mt-2">{msg.timestamp}</span>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 animate-fade-in-up">
            <div className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-primary/20 text-primary ring-1 ring-primary/30">
              <Bot className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/40 border border-border/40">
              <Loader2 className="h-3 w-3 text-primary animate-spin" />
              <span className="text-[10px] font-mono text-muted-foreground">Searching {risks.length} risks across {REGIONS.length} regions...</span>
              <span className="flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Try: 'What are our risks in the European market?' or 'Africa supply chain'..."
          className="flex-1 h-9 px-3 rounded-lg bg-secondary/60 border border-border text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
