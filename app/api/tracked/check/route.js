import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { checkRank } from "@/lib/serp"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// POST { id? } — cek satu keyword (id) atau semua keyword terpantau.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const db = getDb()
    const rows = body.id
      ? db.prepare("SELECT * FROM tracked_keywords WHERE id = ?").all(body.id)
      : db.prepare("SELECT * FROM tracked_keywords").all()

    let checked = 0
    for (const row of rows) {
      try {
        const r = await checkRank(row)
        db.prepare(
          "INSERT INTO rank_checks (tracked_id, position, total_results) VALUES (?, ?, ?)",
        ).run(row.id, r.position, r.totalResults)
        checked++
      } catch {}
      if (rows.length > 1) await sleep(4000)
    }
    return NextResponse.json({ ok: true, checked, total: rows.length })
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal cek: " + (e?.message || "unknown") },
      { status: 500 },
    )
  }
}
