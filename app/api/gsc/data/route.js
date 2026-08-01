import { NextResponse } from "next/server"
import { queryAnalytics } from "@/lib/gsc"

export async function POST(req) {
  try {
    const { siteUrl, startDate, endDate, dimension } = await req.json()
    if (!siteUrl || !startDate || !endDate) {
      return NextResponse.json(
        { error: "siteUrl, startDate, dan endDate wajib diisi" },
        { status: 400 },
      )
    }
    const rows = await queryAnalytics(siteUrl, {
      startDate,
      endDate,
      dimension: dimension || "query",
      rowLimit: 250,
    })
    return NextResponse.json({ rows })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Gagal mengambil data GSC" },
      { status: 500 },
    )
  }
}
