import { getDb } from "./db"

const AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const API_BASE = "https://www.googleapis.com/webmasters/v3"
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"

export function getConfig() {
  const appUrl = process.env.APP_URL || "http://localhost:3000"
  return {
    appUrl,
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || appUrl + "/api/gsc/callback",
  }
}

export function isConfigured() {
  const { clientId, clientSecret } = getConfig()
  return !!(clientId && clientSecret)
}

export function getAuthUrl() {
  const { clientId, redirectUri } = getConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  })
  return AUTH_BASE + "?" + params.toString()
}

export function getTokens() {
  return getDb().prepare("SELECT * FROM gsc_tokens WHERE id = 1").get() || null
}

export function isConnected() {
  const t = getTokens()
  return !!(t && t.refresh_token)
}

export function disconnect() {
  getDb().prepare("DELETE FROM gsc_tokens WHERE id = 1").run()
}

function saveTokens({ access_token, refresh_token, expires_in }) {
  const old = getTokens()
  getDb()
    .prepare(
      `INSERT INTO gsc_tokens (id, access_token, refresh_token, expires_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at`,
    )
    .run(
      access_token,
      refresh_token || old?.refresh_token || null,
      Date.now() + ((expires_in || 3600) * 1000 - 60000),
    )
}

export async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = getConfig()
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "OAuth gagal")
  }
  saveTokens(data)
  return data
}

async function getAccessToken() {
  const t = getTokens()
  if (!t) throw new Error("Belum terhubung ke Google Search Console")
  if (t.access_token && t.expires_at > Date.now()) return t.access_token
  if (!t.refresh_token) throw new Error("Refresh token tidak ada — hubungkan ulang")
  const { clientId, clientSecret } = getConfig()
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: t.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error("Gagal refresh token: " + (data.error_description || data.error || res.status))
  }
  saveTokens(data)
  return data.access_token
}

async function gscFetch(path, options = {}) {
  const token = await getAccessToken()
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(20000),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || "GSC API error " + res.status)
  }
  return data
}

export async function listSites() {
  const data = await gscFetch("/sites")
  return (data.siteEntry || [])
    .filter((s) => s.permissionLevel !== "siteUnverifiedUser")
    .map((s) => s.siteUrl)
    .sort()
}

export async function queryAnalytics(siteUrl, { startDate, endDate, dimension, rowLimit }) {
  const data = await gscFetch(
    "/sites/" + encodeURIComponent(siteUrl) + "/searchAnalytics/query",
    {
      method: "POST",
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: [dimension || "query"],
        rowLimit: rowLimit || 100,
      }),
    },
  )
  return (data.rows || []).map((r) => ({
    key: r.keys?.[0] || "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: +(r.ctr * 100).toFixed(2),
    position: +r.position.toFixed(1),
  }))
}
