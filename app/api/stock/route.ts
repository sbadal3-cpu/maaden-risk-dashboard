import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/1211.SR"
    )

    const data = await res.json()

    const price = data.chart.result[0].meta.regularMarketPrice
    const change = data.chart.result[0].meta.regularMarketChangePercent

    return NextResponse.json({
      price,
      change,
    })
  } catch {
    return NextResponse.json({
      price: "N/A",
      change: 0,
    })
  }
}