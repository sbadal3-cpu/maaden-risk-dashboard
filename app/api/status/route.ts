import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    news: !!process.env.NEWS_API_KEY,
    stock: !!process.env.STOCK_API_KEY,
    sheets: !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SHEETS_API_KEY),
    timestamp: new Date().toISOString(),
  })
}
