# SEO Toolkit v2 — All-in-One SEO Dashboard (Gratis, Tanpa API Berbayar)

Web app Next.js berisi 5 tools SEO:

| Tool | Halaman | Cara kerja |
| --- | --- | --- |
| On-Page SEO Analyzer | `/analyzer` | Fetch URL di server, parse HTML (cheerio), skor + checklist |
| Keyword Research | `/keywords` | Google Autocomplete/Suggest API (gratis, tanpa key) |
| SERP Rank Tracker | `/rank` | Scrape DuckDuckGo/Bing + **database SQLite** + **auto-check harian (cron)** |
| Google Search Console | `/gsc` | Data asli Google (klik, impresi, CTR, posisi) via OAuth — gratis |
| Generators | `/generators` | Meta tags + preview SERP, Schema JSON-LD, sitemap.xml, robots.txt |

## Baru di v2

- **Database SQLite** (`seo.db`, otomatis dibuat) — riwayat rank tersimpan permanen, bukan lagi di localStorage browser.
- **Keyword terpantau** — simpan keyword+domain, lihat posisi terbaru, perubahan naik/turun, dan riwayat lengkap.
- **Auto rank check terjadwal** — cron di server (default tiap hari jam 06:00, atur lewat `RANK_CRON`).
- **Integrasi Google Search Console** — hubungkan sekali via OAuth, lalu lihat performa asli dari Google per keyword/halaman/negara/perangkat + export CSV.

## Cara Menjalankan

```bash
# butuh Node.js 18+
npm install
cp .env.example .env.local   # opsional, untuk cron & GSC
npm run dev
# buka http://localhost:3000
```

Build production:

```bash
npm run build
npm start
```

## Setup Google Search Console (opsional, sekali saja)

1. Buka [Google Cloud Console](https://console.cloud.google.com) → buat project baru.
2. **APIs & Services → Library** → aktifkan **Google Search Console API**.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/gsc/callback` (ganti host jika sudah dideploy)
4. Isi `.env.local`:
   ```
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   APP_URL=http://localhost:3000
   ```
5. Restart server → buka `/gsc` → klik **Hubungkan Google Search Console**.

> Scope yang diminta hanya `webmasters.readonly` (baca saja).

## Jadwal auto-check rank

Atur di `.env.local` dengan format cron:

```
RANK_CRON=0 6 * * *    # tiap hari jam 06:00 (default)
RANK_CRON=0 */6 * * *  # tiap 6 jam
```

Scheduler jalan selama proses server hidup (`npm run dev` / `npm start`).

## Deploy

**Penting:** karena v2 memakai SQLite (file lokal) + cron (proses jangka panjang), deploy terbaik adalah server yang selalu hidup:

- **VPS** (Hetzner/DO/dll.): `npm run build && npm start` di belakang Caddy/Nginx, atau pakai PM2/Docker.
- **Railway / Render / Fly.io**: jalan normal, pastikan disk persistent untuk `seo.db`.
- **Vercel**: TIDAK cocok untuk fitur tracking (filesystem ephemeral, tidak ada proses jangka panjang). Tools lain (analyzer, keywords, generators, GSC dengan DB eksternal) tetap jalan.

## Catatan & Batasan

- Keyword research memakai endpoint Google Suggest tidak resmi — tanpa data volume/difficulty.
- Rank tracker scrape DuckDuckGo/Bing — indikasi tren, bukan posisi Google persis. Untuk data Google asli, pakai halaman **Search Console**.
- Ada jeda 4–5 detik antar keyword saat auto-check untuk menghindari rate limit.
- `seo.db` dibuat otomatis di root project saat pertama dipakai.

## Struktur

```
app/
  page.js                     → Dashboard
  analyzer/page.js            → On-page analyzer (UI)
  keywords/page.js            → Keyword research (UI)
  rank/page.js                → Rank tracker + keyword terpantau (UI)
  gsc/page.js                 → Google Search Console (UI)
  generators/page.js          → Meta/Schema/Sitemap/Robots generator
  api/analyze/route.js        → Analisis on-page
  api/suggest/route.js        → Proxy Google Suggest
  api/serp/route.js           → Cek SERP sekali jalan
  api/tracked/route.js        → CRUD keyword terpantau
  api/tracked/check/route.js  → Cek ulang (satu/semua)
  api/tracked/history/route.js→ Riwayat posisi
  api/gsc/*                   → OAuth + data Search Console
lib/
  db.js                       → SQLite (better-sqlite3)
  serp.js                     → Engine scraping DDG/Bing
  scheduler.js                → Cron auto-check (node-cron)
  gsc.js                      → OAuth + API Search Console
instrumentation.js            → Start scheduler saat server boot
```
