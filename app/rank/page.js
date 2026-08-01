"use client"

import { Fragment, useCallback, useEffect, useState } from "react"

function changeBadge(last, prev) {
  if (last == null) return <span className="badge fail">Tidak ada</span>
  if (prev == null) return <span className="badge info">Baru</span>
  const diff = prev - last // posisi makin kecil = makin bagus
  if (diff > 0) return <span className="badge pass">▲ naik {diff}</span>
  if (diff < 0) return <span className="badge fail">▼ turun {-diff}</span>
  return <span className="badge info">= tetap</span>
}

export default function RankPage() {
  // ---- Quick check ----
  const [keyword, setKeyword] = useState("")
  const [domain, setDomain] = useState("")
  const [engine, setEngine] = useState("duckduckgo")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [tracking, setTracking] = useState(false)

  // ---- Tracked keywords ----
  const [tracked, setTracked] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [busyAll, setBusyAll] = useState(false)
  const [historyFor, setHistoryFor] = useState(null)
  const [history, setHistory] = useState([])

  const loadTracked = useCallback(async () => {
    try {
      const res = await fetch("/api/tracked")
      const json = await res.json()
      setTracked(json.tracked || [])
    } catch {}
  }, [])

  useEffect(() => {
    loadTracked()
  }, [loadTracked])

  async function check(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch("/api/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, domain, engine }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal cek posisi")
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function track() {
    setTracking(true)
    try {
      await fetch("/api/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, domain, engine }),
      })
      await loadTracked()
    } finally {
      setTracking(false)
    }
  }

  async function recheck(id) {
    setBusyId(id)
    try {
      await fetch("/api/tracked/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      await loadTracked()
      if (historyFor === id) await showHistory(id, true)
    } finally {
      setBusyId(null)
    }
  }

  async function checkAll() {
    setBusyAll(true)
    try {
      await fetch("/api/tracked/check", { method: "POST" })
      await loadTracked()
    } finally {
      setBusyAll(false)
    }
  }

  async function remove(id) {
    await fetch("/api/tracked?id=" + id, { method: "DELETE" })
    if (historyFor === id) setHistoryFor(null)
    await loadTracked()
  }

  async function showHistory(id, force) {
    if (historyFor === id && !force) {
      setHistoryFor(null)
      return
    }
    const res = await fetch("/api/tracked/history?id=" + id)
    const json = await res.json()
    setHistory(json.history || [])
    setHistoryFor(id)
  }

  const alreadyTracked =
    data &&
    tracked.some(
      (t) =>
        t.keyword === data.keyword && t.domain === data.domain && t.engine === data.engine,
    )

  return (
    <div>
      <h1>SERP Rank Tracker</h1>
      <p className="subtitle">
        Cek posisi domain untuk sebuah keyword, lalu simpan sebagai keyword
        terpantau — posisinya otomatis dicek ulang tiap hari (jadwal bisa diatur
        lewat RANK_CRON) dan riwayatnya tersimpan di database.
      </p>

      <form onSubmit={check} className="card soft" style={{ marginBottom: 24 }}>
        <div className="row">
          <div className="field">
            <label className="label" htmlFor="kw">
              Keyword
            </label>
            <input
              id="kw"
              className="input"
              placeholder="contoh: sewa mobil jakarta"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="domain">
              Domain kamu
            </label>
            <input
              id="domain"
              className="input"
              placeholder="contoh: situskamu.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="engine">
              Mesin pencari
            </label>
            <select
              id="engine"
              className="input"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
            >
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="bing">Bing</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Mengecek…" : "Cek Posisi"}
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}

      {data && (
        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
          <div className="card score-card">
            <div>
              <div
                className={
                  "score-num " +
                  (data.position === null ? "bad" : data.position <= 10 ? "good" : "mid")
                }
              >
                {data.position === null ? "—" : "#" + data.position}
              </div>
              <div className="muted">Posisi di {data.engine}</div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 600 }}>
                “{data.keyword}” · {data.domain}
              </div>
              <div className="muted">
                {data.position === null
                  ? `Tidak ditemukan di ${data.totalResults} hasil teratas.`
                  : `Ditemukan di posisi ${data.position} dari ${data.totalResults} hasil.`}
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn"
                  type="button"
                  onClick={track}
                  disabled={tracking || alreadyTracked}
                >
                  {alreadyTracked
                    ? "Sudah dipantau \u2713"
                    : tracking
                      ? "Menyimpan…"
                      : "\ud83d\udccc Pantau keyword ini"}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Hasil pencarian</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Judul</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => (
                    <tr key={r.position} className={r.isMatch ? "match" : ""}>
                      <td>{r.position}</td>
                      <td>{r.title}</td>
                      <td>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Keyword terpantau ({tracked.length})</h2>
        {tracked.length === 0 ? (
          <p className="muted">
            Belum ada keyword terpantau. Cek posisi di atas lalu klik “Pantau
            keyword ini”.
          </p>
        ) : (
          <>
            <div className="toolbar">
              <button className="btn" type="button" onClick={checkAll} disabled={busyAll}>
                {busyAll ? "Mengecek semua…" : "Cek semua sekarang"}
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Domain</th>
                    <th>Engine</th>
                    <th>Posisi</th>
                    <th>Perubahan</th>
                    <th>Terakhir dicek</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tracked.map((t) => (
                    <Fragment key={t.id}>
                      <tr>
                        <td>{t.keyword}</td>
                        <td>{t.domain}</td>
                        <td>{t.engine}</td>
                        <td>{t.last_position == null ? "—" : "#" + t.last_position}</td>
                        <td>{changeBadge(t.last_position, t.prev_position)}</td>
                        <td>
                          {t.last_checked_at
                            ? new Date(t.last_checked_at + "Z").toLocaleString("id-ID")
                            : "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              className="btn"
                              type="button"
                              onClick={() => recheck(t.id)}
                              disabled={busyId === t.id}
                            >
                              {busyId === t.id ? "…" : "Cek ulang"}
                            </button>
                            <button className="btn" type="button" onClick={() => showHistory(t.id)}>
                              {historyFor === t.id ? "Tutup" : "Riwayat"}
                            </button>
                            <button className="btn" type="button" onClick={() => remove(t.id)}>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                      {historyFor === t.id && (
                        <tr>
                          <td colSpan={7} style={{ background: "var(--surface)" }}>
                            {history.length === 0 ? (
                              <span className="muted">Belum ada riwayat.</span>
                            ) : (
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Tanggal</th>
                                    <th>Posisi</th>
                                    <th>Total hasil</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.map((h, i) => (
                                    <tr key={i}>
                                      <td>
                                        {new Date(h.checked_at + "Z").toLocaleString("id-ID")}
                                      </td>
                                      <td>{h.position == null ? "—" : "#" + h.position}</td>
                                      <td>{h.total_results}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              Posisi otomatis dicek ulang sesuai jadwal RANK_CRON (default tiap
              hari jam 06:00) selama server berjalan.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
