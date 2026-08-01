import { NextResponse } from "next/server"

const SUGGEST_BASE = "https://suggestqueries.google.com/complete/search"

// Proxy ke Google Suggest (gratis, tanpa API key) supaya tidak kena CORS di browser.
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const hl = searchParams.get("hl") || "id"
  if (!q) {
    return NextResponse.json({ error: "Parameter q wajib diisi" }, { status: 400 })
  }
  try {
    const target =
      SUGGEST_BASE +
      "?client=firefox&hl=" +
      encodeURIComponent(hl) +
      "&q=" +
      encodeURIComponent(q)
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return NextResponse.json({
      query: q,
      suggestions: Array.isArray(data?.[1]) ? data[1] : [],
    })
  } catch (e) {
    return NextResponse.json(
      {
        error: "Gagal mengambil saran: " + (e?.message || "unknown"),
        query: q,
        suggestions: [],
      },
      { status: 502 },
    )
  }
}
