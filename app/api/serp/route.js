import { NextResponse } from "next/server"
import { checkRank } from "@/lib/serp"

export async function POST(req) {
  try {
    const { keyword, domain, engine } = await req.json()
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "Keyword wajib diisi" }, { status: 400 })
    }
    const data = await checkRank({ keyword: keyword.trim(), domain, engine })
    return NextResponse.json({ ...data, checkedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal cek SERP: " + (e?.message || "unknown") },
      { status: 500 },
    )
  }
}
