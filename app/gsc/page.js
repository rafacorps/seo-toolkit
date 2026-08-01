"use client"

import { useEffect, useState } from "react"

function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000)
  return d.toISOString().slice(0, 10)
}

export default function GscPage() {
  const [status, setStatus] = useState(null)
  const [siteUrl, setSiteUrl] = useState("")
  const [startDate, setStartDate] = useState(daysAgo(28))
  const [endDate, setEndDate] = useState(daysAgo(1))
  const [dimension, setDimension] = useState("query")
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("connected")) setNotice("Berhasil terhubung ke Google Search Console \u2713")
    if (params.get("error")) setError("OAuth gagal: " + params.get("error"))
    fetch("/api/gsc/status")
      .then((r) => r.json())
      .then((s) => {
        setStatus(s)
        if (s.sites?.length) setSiteUrl(s.sites[0])
        if (s.error) setError(s.error)
      })
      .catch(() => setStatus({ configured: false, connected: false, sites: [] }))
  }, [])

  async function loadData(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRows(null)
    try {
      const res = await fetch("/api/gsc/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl, startDate, endDate, dimension }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal mengambil data")
      setRows(json.rows)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    await fetch("/api/gsc/status", { method: "DELETE" })
    setStatus((s) => ({ ...s, connected: false, sites: [] }))
    setRows(null)
  }

  function exportCsv() {
    if (!rows) return
    const head = dimension + ",clicks,impressions,ctr,position\n"
    const csv =
      head +
      rows
        .map(
          (r) =>
            '"' + r.key.replace(/"/g, '""') + '",' + [r.clicks, r.impressions, r.ctr, r.position].join(","),
        )
        .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "gsc-" + dimension + "-" + startDate + "-" + endDate + ".csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <h1>Google Search Console</h1>
      <p className="subtitle">
        Data performa asli dari Google: klik, impresi, CTR, dan posisi rata-rata
        per keyword atau halaman. Gratis — hanya perlu OAuth Google sekali.
      </p>

      {notice && <div className="alert info">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      {!status ? (
        <p className="muted">Memuat…</p>
      ) : !status.configured ? (
        <div className="card soft">
          <h2>Setup dulu (sekali saja)</h2>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
            <li>
              Buka <b>Google Cloud Console</b> → buat project → aktifkan{" "}
              <b>Google Search Console API</b>.
            </li>
            <li>
              Buat <b>OAuth Client ID</b> (tipe: Web application) dengan redirect
              URI: <code>http://localhost:3000/api/gsc/callback</code>
            </li>
            <li>
              Salin <code>.env.example</code> jadi <code>.env.local</code>, isi{" "}
              <code>GOOGLE_CLIENT_ID</code> dan <code>GOOGLE_CLIENT_SECRET</code>.
            </li>
            <li>Restart server, lalu buka halaman ini lagi.</li>
          </ol>
        </div>
      ) : !status.connected ? (
        <div className="card soft" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ marginTop: 0 }}>
            Kredensial OAuth sudah terpasang. Tinggal hubungkan akun Google yang
            punya akses Search Console.
          </p>
          <a className="btn btn-primary" href="/api/gsc/auth">
            Hubungkan Google Search Console
          </a>
        </div>
      ) : (
        <>
          <form onSubmit={loadData} className="card soft" style={{ marginBottom: 24 }}>
            <div className="row">
              <div className="field">
                <label className="label" htmlFor="site">
                  Properti / situs
                </label>
                <select
                  id="site"
                  className="input"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                >
                  {(status.sites || []).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="dim">
                  Tampilkan per
                </label>
                <select
                  id="dim"
                  className="input"
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                >
                  <option value="query">Keyword (query)</option>
                  <option value="page">Halaman</option>
                  <option value="country">Negara</option>
                  <option value="device">Perangkat</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="start">
                  Dari
                </label>
                <input
                  id="start"
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="end">
                  Sampai
                </label>
                <input
                  id="end"
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={loading || !siteUrl}>
                {loading ? "Memuat…" : "Tampilkan Data"}
              </button>
              <button className="btn" type="button" onClick={disconnect}>
                Putuskan koneksi
              </button>
            </div>
          </form>

          {rows && (
            <div className="card">
              <h2>
                {rows.length} baris · {startDate} s/d {endDate}
              </h2>
              <div className="toolbar">
                <button className="btn" type="button" onClick={exportCsv}>
                  Export CSV
                </button>
              </div>
              {rows.length === 0 ? (
                <p className="muted">Tidak ada data untuk rentang tanggal ini.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{dimension === "page" ? "Halaman" : dimension === "query" ? "Keyword" : dimension}</th>
                        <th>Klik</th>
                        <th>Impresi</th>
                        <th>CTR</th>
                        <th>Posisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.key}</td>
                          <td>{r.clicks}</td>
                          <td>{r.impressions}</td>
                          <td>{r.ctr}%</td>
                          <td>{r.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
