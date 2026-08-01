import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

const PRIVATE_HOST =
  /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i

export async function POST(req) {
  try {
    const { url: rawUrl, keyword } = await req.json()
    if (!rawUrl || !rawUrl.trim()) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 })
    }

    let url = rawUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = "https://" + url

    let parsed
    try {
      parsed = new URL(url)
    } catch {
      return NextResponse.json({ error: "URL tidak valid" }, { status: 400 })
    }
    if (PRIVATE_HOST.test(parsed.hostname)) {
      return NextResponse.json({ error: "Host tidak diizinkan" }, { status: 400 })
    }

    const started = Date.now()
    let res
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 SEOToolkit/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      })
    } catch (e) {
      return NextResponse.json(
        { error: "Gagal mengambil halaman: " + (e?.message || "timeout") },
        { status: 502 },
      )
    }
    const html = await res.text()
    const elapsedMs = Date.now() - started
    const finalUrl = res.url || url
    const $ = cheerio.load(html)

    const checks = []
    const add = (group, label, status, detail) =>
      checks.push({ group, label, status, detail })

    // ---------- Meta & Konten ----------
    const title = ($("title").first().text() || "").trim()
    if (!title) add("Meta & Konten", "Title tag", "fail", "Tidak ada <title>.")
    else if (title.length < 30 || title.length > 60)
      add(
        "Meta & Konten",
        "Title tag",
        "warn",
        `"${title}" (${title.length} karakter — idealnya 30–60).`,
      )
    else
      add("Meta & Konten", "Title tag", "pass", `"${title}" (${title.length} karakter).`)

    const metaDesc = ($('meta[name="description"]').attr("content") || "").trim()
    if (!metaDesc)
      add("Meta & Konten", "Meta description", "fail", "Tidak ada meta description.")
    else if (metaDesc.length < 70 || metaDesc.length > 160)
      add(
        "Meta & Konten",
        "Meta description",
        "warn",
        `${metaDesc.length} karakter — idealnya 70–160.`,
      )
    else
      add("Meta & Konten", "Meta description", "pass", `${metaDesc.length} karakter.`)

    const h1s = $("h1")
    if (h1s.length === 0) add("Meta & Konten", "Heading H1", "fail", "Tidak ada H1.")
    else if (h1s.length > 1)
      add("Meta & Konten", "Heading H1", "warn", `Ada ${h1s.length} H1 — idealnya 1.`)
    else
      add(
        "Meta & Konten",
        "Heading H1",
        "pass",
        `"${$(h1s[0]).text().trim().slice(0, 80)}"`,
      )

    if ($("h2").length === 0)
      add("Meta & Konten", "Heading H2", "warn", "Tidak ada H2 — struktur konten kurang.")
    else add("Meta & Konten", "Heading H2", "pass", `${$("h2").length} H2 ditemukan.`)

    const $body = $("body").clone()
    $body.find("script,style,noscript,svg").remove()
    const bodyText = $body.text().replace(/\s+/g, " ").trim()
    const words = bodyText ? bodyText.split(" ").length : 0
    if (words < 300)
      add("Meta & Konten", "Jumlah kata", "warn", `${words} kata — konten tipis (<300).`)
    else add("Meta & Konten", "Jumlah kata", "pass", `${words} kata.`)

    // ---------- Keyword ----------
    let keywordStats = null
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      const count = (
        bodyText.toLowerCase().match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []
      ).length
      const density = words ? +((count / words) * 100).toFixed(2) : 0
      keywordStats = {
        keyword: keyword.trim(),
        count,
        density,
        inTitle: title.toLowerCase().includes(kw),
        inDescription: metaDesc.toLowerCase().includes(kw),
        inH1: $(h1s[0]).text().toLowerCase().includes(kw),
        inUrl: finalUrl.toLowerCase().includes(kw.replace(/\s+/g, "-")),
      }
      add(
        "Keyword",
        "Keyword di title",
        keywordStats.inTitle ? "pass" : "warn",
        keywordStats.inTitle ? "Ada di title." : "Tidak ada di title.",
      )
      add(
        "Keyword",
        "Keyword di meta description",
        keywordStats.inDescription ? "pass" : "warn",
        keywordStats.inDescription ? "Ada di description." : "Tidak ada di description.",
      )
      add(
        "Keyword",
        "Keyword di H1",
        keywordStats.inH1 ? "pass" : "warn",
        keywordStats.inH1 ? "Ada di H1." : "Tidak ada di H1.",
      )
      add(
        "Keyword",
        "Keyword density",
        density >= 0.5 && density <= 3 ? "pass" : "warn",
        `${count}x (${density}%) — idealnya 0.5–3%.`,
      )
    }

    // ---------- Struktur & Media ----------
    const imgs = $("img")
    const imgsNoAlt = imgs.filter((_, el) => !($(el).attr("alt") || "").trim()).length
    if (imgs.length === 0)
      add("Struktur & Media", "Alt text gambar", "pass", "Tidak ada gambar.")
    else if (imgsNoAlt > 0)
      add(
        "Struktur & Media",
        "Alt text gambar",
        "warn",
        `${imgsNoAlt} dari ${imgs.length} gambar tanpa alt.`,
      )
    else
      add("Struktur & Media", "Alt text gambar", "pass", `Semua ${imgs.length} gambar punya alt.`)

    let internalLinks = 0
    let externalLinks = 0
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || ""
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      try {
        const u = new URL(href, finalUrl)
        if (u.hostname === parsed.hostname) internalLinks++
        else externalLinks++
      } catch {}
    })
    add(
      "Struktur & Media",
      "Internal link",
      internalLinks > 0 ? "pass" : "warn",
      `${internalLinks} internal, ${externalLinks} eksternal.`,
    )

    // ---------- Teknis ----------
    add(
      "Teknis",
      "HTTPS",
      finalUrl.startsWith("https://") ? "pass" : "fail",
      finalUrl.startsWith("https://") ? "Halaman memakai HTTPS." : "Tidak memakai HTTPS.",
    )

    const canonical = $('link[rel="canonical"]').attr("href")
    add(
      "Teknis",
      "Canonical",
      canonical ? "pass" : "warn",
      canonical ? canonical : "Tidak ada link canonical.",
    )

    const viewport = $('meta[name="viewport"]').attr("content")
    add(
      "Teknis",
      "Viewport (mobile-friendly)",
      viewport ? "pass" : "fail",
      viewport ? viewport : "Tidak ada meta viewport.",
    )

    const lang = $("html").attr("lang")
    add("Teknis", "Atribut lang", lang ? "pass" : "warn", lang ? `lang="${lang}"` : "Tidak ada atribut lang di <html>.")

    const robotsMeta = $('meta[name="robots"]').attr("content") || ""
    if (/noindex/i.test(robotsMeta))
      add("Teknis", "Meta robots", "fail", `"${robotsMeta}" — halaman tidak diindeks!`)
    else add("Teknis", "Meta robots", "pass", robotsMeta || "Default (index, follow).")

    const sizeKB = +(Buffer.byteLength(html, "utf8") / 1024).toFixed(1)
    add(
      "Teknis",
      "Ukuran HTML",
      sizeKB < 500 ? "pass" : "warn",
      `${sizeKB} KB${sizeKB >= 500 ? " — cukup besar." : "."}`,
    )
    add(
      "Teknis",
      "Waktu respons",
      elapsedMs < 1500 ? "pass" : elapsedMs < 4000 ? "warn" : "fail",
      `${elapsedMs} ms.`,
    )

    const ldJson = $('script[type="application/ld+json"]').length
    add(
      "Teknis",
      "Structured data (JSON-LD)",
      ldJson > 0 ? "pass" : "warn",
      ldJson > 0 ? `${ldJson} blok JSON-LD ditemukan.` : "Tidak ada JSON-LD — bisa dibuat di tab Generators.",
    )

    // ---------- Sosial ----------
    const ogTitle = $('meta[property="og:title"]').attr("content")
    const ogDesc = $('meta[property="og:description"]').attr("content")
    const ogImage = $('meta[property="og:image"]').attr("content")
    const ogOk = [ogTitle, ogDesc, ogImage].filter(Boolean).length
    add(
      "Sosial",
      "Open Graph",
      ogOk === 3 ? "pass" : ogOk > 0 ? "warn" : "fail",
      `${ogOk}/3 tag utama (og:title, og:description, og:image).`,
    )
    const twCard = $('meta[name="twitter:card"]').attr("content")
    add(
      "Sosial",
      "Twitter card",
      twCard ? "pass" : "warn",
      twCard ? `twitter:card = ${twCard}` : "Tidak ada twitter:card.",
    )

    // ---------- Skor ----------
    const weights = { pass: 1, warn: 0.5, fail: 0 }
    const score = Math.round(
      (checks.reduce((s, c) => s + weights[c.status], 0) / checks.length) * 100,
    )

    return NextResponse.json({
      url: finalUrl,
      statusCode: res.status,
      score,
      stats: {
        words,
        sizeKB,
        elapsedMs,
        internalLinks,
        externalLinks,
        images: imgs.length,
        imagesNoAlt: imgsNoAlt,
        h1Count: h1s.length,
      },
      title,
      metaDescription: metaDesc,
      keywordStats,
      checks,
    })
  } catch (e) {
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (e?.message || "unknown") },
      { status: 500 },
    )
  }
}
