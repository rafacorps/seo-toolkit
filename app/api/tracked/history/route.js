import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 })
  const db = getDb()
  const history = db
    .prepare(
      "SELECT position, total_results, checked_at FROM rank_checks WHERE tracked_id = ? ORDER BY id DESC LIMIT 60",
    )
    .all(id)
  return NextResponse.json({ history })
}
