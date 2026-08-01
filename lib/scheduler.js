import cron from "node-cron"
import { getDb } from "./db"
import { checkRank } from "./serp"

let started = false

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function runAllChecks() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM tracked_keywords").all()
  let checked = 0
  for (const row of rows) {
    try {
      const r = await checkRank(row)
      db.prepare(
        "INSERT INTO rank_checks (tracked_id, position, total_results) VALUES (?, ?, ?)",
      ).run(row.id, r.position, r.totalResults)
      checked++
    } catch (e) {
      console.error(`[scheduler] gagal cek "${row.keyword}":`, e?.message)
    }
    // jeda antar request supaya tidak kena rate limit
    if (rows.length > 1) await sleep(5000)
  }
  console.log(`[scheduler] selesai: ${checked}/${rows.length} keyword dicek`)
  return { checked, total: rows.length }
}

export function startScheduler() {
  if (started) return
  started = true
  const expr = process.env.RANK_CRON || "0 6 * * *"
  if (!cron.validate(expr)) {
    console.error(`[scheduler] RANK_CRON tidak valid: ${expr}`)
    return
  }
  cron.schedule(expr, runAllChecks)
  console.log(`[scheduler] auto rank check aktif (cron: ${expr})`)
}
