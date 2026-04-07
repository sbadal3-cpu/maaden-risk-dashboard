export function mapToMaaden(signal: any) {
  const text = signal.title.toLowerCase()

  if (text.includes("phosphate"))
    return {
      business: "Phosphate Division",
      asset: "Ras Al Khair",
      impact: "Fertilizer export pricing risk",
    }

  if (text.includes("aluminum"))
    return {
      business: "Aluminum",
      asset: "Ma’aden Aluminium",
      impact: "Metal price volatility",
    }

  if (text.includes("logistics") || text.includes("shipping"))
    return {
      business: "Supply Chain",
      asset: "Global Export Routes",
      impact: "Delivery delays and cost escalation",
    }

  if (text.includes("energy") || text.includes("fuel"))
    return {
      business: "Operations",
      asset: "Mining Sites",
      impact: "Production cost increase",
    }

  return {
    business: "Corporate",
    asset: "Group Level",
    impact: "General market exposure",
  }
}