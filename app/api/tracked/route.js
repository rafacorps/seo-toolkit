import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { checkRank, cleanDomain } from "@/lib/serp"

export async function GET() {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT t.id, t.keyword, t.domain, t.engine, t.created_at,
        (SELECT c.position FROM rank_checks c WHERE c.tracked_id = t.id ORDER BY c.id DESC LIMIT 1) AS last_position,
        (SELECT c.checked_at FROM rank_checks c WHERE c.tracked_id = t.id ORDER BY c.id DESC LIMIT 1) AS last_checked_at,
        (SELECT c.position FROM rank_checks c WHERE c.tracked_id = t.id ORDER BY c.id DESC LIMIT 1 OFFSET 1) AS prev_position
      FROM tracked_keywords t
      ORDER BY t.id DESC`,
    )
    .all()
  return NextResponse.json({ tracked: rows })
}

export async function POST(req) {
  try {
    const { keyword, domain, engine } = await req.json()
    if (!keyword?.trim() || !domain?.trim()) {
      return NextResponse.json(
        { error: "Keyword dan domain wajib diisi" },
        { status: 400 },
      )
    }
    const db = getDb()
    const eng = engine === "bing" ? "bing" : "duckduckgo"
    const dom = cleanDomain(domain)
    const info = db
      .prepare(
        "INSERT OR IGNORE INTO tracked_keywords (keyword, domain, engine) VALUES (?, ?, ?)",
      )
      .run(keyword.trim(), dom, eng)
    const row = db
      .prepare(
        "SELECT * FROM tracked_keywords WHERE keyword = ? AND domain = ? AND engine = ?",
      )
      .get(keyword.trim(), dom, eng)

    // langsung cek posisi pertama kali (hanya jika baru ditambahkan)
    if (info.changes > 0) {
      try {
        const r = await checkRank(row)
        db.prepare(
          "INSERT INTO rank_checks (tracked_id, position, total_results) VALUES (?, ?, ?)",
        ).run(row.id, r.position, r.totalResults)
      } catch {}
    }

    return NextResponse.json({ ok: true, id: row.id, added: info.changes > 0 })
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal menambah keyword: " + (e?.message || "unknown") },
      { status: 500 },
    )
  }
}

export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 })
  const db = getDb()
  db.prepare("DELETE FROM rank_checks WHERE tracked_id = ?").run(id)
  db.prepare("DELETE FROM tracked_keywords WHERE id = ?").run(id)
  return NextResponse.json({ ok: true })
}
