"use client"

import { useState } from "react"

const MODIFIERS = {
  id: ["cara", "apa itu", "kenapa", "harga", "terbaik", "gratis", "vs", "untuk", "contoh", "review"],
  en: ["how to", "what is", "why", "price", "best", "free", "vs", "for", "example", "review"],
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("")

async function getSuggestions(q, hl) {
  try {
    const res = await fetch(
      "/api/suggest?q=" + encodeURIComponent(q) + "&hl=" + encodeURIComponent(hl),
    )
    const json = await res.json()
    return Array.isArray(json.suggestions) ? json.suggestions : []
  } catch {
    return []
  }
}

export default function KeywordsPage() {
  const [seed, setSeed] = useState("")
  const [lang, setLang] = useState("id")
  const [useAz, setUseAz] = useState(true)
  const [useModifiers, setUseModifiers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")
  const [results, setResults] = useState(null)

  async function run(e) {
    e.preventDefault()
    const q = seed.trim()
    if (!q) return
    setLoading(true)
    setResults(null)

    const queries = [q]
    if (useAz) for (const l of LETTERS) queries.push(q + " " + l)
    if (useModifiers) for (const m of MODIFIERS[lang]) queries.push(m + " " + q)

    const found = new Map()
    const batchSize = 6
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize)
      setProgress(`${Math.min(i + batchSize, queries.length)}/${queries.length} query…`)
      const lists = await Promise.all(batch.map((b) => getSuggestions(b, lang)))
      lists.flat().forEach((s) => {
        const key = s.toLowerCase().trim()
        if (key && key !== q.toLowerCase()) found.set(key, s)
      })
    }

    setResults([...found.values()].sort((a, b) => a.localeCompare(b)))
    setProgress("")
    setLoading(false)
  }

  function exportCsv() {
    if (!results) return
    const csv = "keyword\n" + results.map((r) => '"' + r.replace(/"/g, '""') + '"').join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "keywords-" + seed.trim().replace(/\s+/g, "-") + ".csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function copyAll() {
    if (results) await navigator.clipboard.writeText(results.join("\n"))
  }

  return (
    <div>
      <h1>Keyword Research</h1>
      <p className="subtitle">
        Temukan ide keyword long-tail dari Google Autocomplete — gratis, tanpa
        API key. Tidak ada data volume, tapi bagus untuk menggali ide konten.
      </p>

      <form onSubmit={run} className="card soft" style={{ marginBottom: 24 }}>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="seed">
              Keyword utama
            </label>
            <input
              id="seed"
              className="input"
              placeholder="contoh: kopi arabika"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="lang">
              Bahasa
            </label>
            <select
              id="lang"
              className="input"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={useAz}
              onChange={(e) => setUseAz(e.target.checked)}
            />{" "}
            Variasi A–Z (keyword + a … z)
          </label>
          <label style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={useModifiers}
              onChange={(e) => setUseModifiers(e.target.checked)}
            />{" "}
            Modifier (cara, harga, terbaik, dll.)
          </label>
        </div>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Mencari… " + progress : "Cari Keyword"}
        </button>
      </form>

      {results && (
        <div className="card">
          <h2>
            {results.length} keyword ditemukan untuk “{seed.trim()}”
          </h2>
          <div className="toolbar">
            <button className="btn" onClick={copyAll} type="button">
              Copy semua
            </button>
            <button className="btn" onClick={exportCsv} type="button">
              Export CSV
            </button>
          </div>
          {results.length === 0 ? (
            <p className="muted">
              Tidak ada hasil. Coba keyword lain atau tunggu beberapa menit
              (kemungkinan kena rate limit).
            </p>
          ) : (
            <div className="chip-list">
              {results.map((r) => (
                <span key={r} className="chip">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
