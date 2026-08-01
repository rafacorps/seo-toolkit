"use client"

import { useState } from "react"

export default function AnalyzerPage() {
  const [url, setUrl] = useState("")
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  async function analyze(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, keyword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal menganalisis halaman")
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groups = data ? [...new Set(data.checks.map((c) => c.group))] : []
  const scoreClass = data
    ? data.score >= 80
      ? "good"
      : data.score >= 50
        ? "mid"
        : "bad"
    : ""

  return (
    <div>
      <h1>On-Page SEO Analyzer</h1>
      <p className="subtitle">
        Masukkan URL halaman untuk audit on-page: meta tags, heading, gambar,
        link, HTTPS, structured data, dan lainnya.
      </p>

      <form onSubmit={analyze} className="card soft" style={{ marginBottom: 24 }}>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="url">
              URL halaman
            </label>
            <input
              id="url"
              className="input"
              placeholder="contoh: https://situskamu.com/artikel"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="kw">
              Keyword target (opsional)
            </label>
            <input
              id="kw"
              className="input"
              placeholder="contoh: sewa mobil jakarta"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Menganalisis…" : "Analisis Sekarang"}
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}

      {data && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card score-card">
            <div>
              <div className={"score-num " + scoreClass}>{data.score}</div>
              <div className="muted">Skor SEO / 100</div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="name" style={{ fontWeight: 600 }}>
                {data.title || "(tanpa title)"}
              </div>
              <div className="muted" style={{ wordBreak: "break-all" }}>
                {data.url} — HTTP {data.statusCode}
              </div>
              {data.keywordStats && (
                <div className="muted" style={{ marginTop: 8 }}>
                  Keyword “{data.keywordStats.keyword}”: {data.keywordStats.count}x
                  ({data.keywordStats.density}% density)
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-4">
            <div className="card kpi">
              <div className="value">{data.stats.words.toLocaleString("id")}</div>
              <div className="name">Kata</div>
            </div>
            <div className="card kpi">
              <div className="value">{data.stats.elapsedMs} ms</div>
              <div className="name">Waktu respons</div>
            </div>
            <div className="card kpi">
              <div className="value">{data.stats.sizeKB} KB</div>
              <div className="name">Ukuran HTML</div>
            </div>
            <div className="card kpi">
              <div className="value">
                {data.stats.internalLinks + data.stats.externalLinks}
              </div>
              <div className="name">Total link</div>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g} className="card">
              <h2>{g}</h2>
              {data.checks
                .filter((c) => c.group === g)
                .map((c, i) => (
                  <div key={i} className="check-row">
                    <span className={"badge " + c.status}>
                      {c.status === "pass"
                        ? "OK"
                        : c.status === "warn"
                          ? "Perbaiki"
                          : "Gagal"}
                    </span>
                    <div>
                      <div className="name">{c.label}</div>
                      <div className="detail">{c.detail}</div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
