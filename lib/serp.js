import * as cheerio from "cheerio"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const DDG_BASE = "https://html.duckduckgo.com/html/?q="
const BING_BASE = "https://www.bing.com/search?count=30&q="

export async function searchDuckDuckGo(keyword) {
  const res = await fetch(DDG_BASE + encodeURIComponent(keyword), {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15000),
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  const results = []
  $(".result__a").each((_, el) => {
    let href = $(el).attr("href") || ""
    if (href.includes("uddg=")) {
      try {
        href = decodeURIComponent(href.split("uddg=")[1].split("&")[0])
      } catch {}
    }
    if (href.startsWith("//")) href = "https:" + href
    const title = $(el).text().trim()
    if (href && title) results.push({ position: results.length + 1, title, url: href })
  })
  return results
}

export async function searchBing(keyword) {
  const res = await fetch(BING_BASE + encodeURIComponent(keyword), {
    headers: { "User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9,en;q=0.8" },
    signal: AbortSignal.timeout(15000),
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  const results = []
  $("li.b_algo").each((_, el) => {
    const a = $(el).find("h2 a").first()
    const href = a.attr("href") || ""
    const title = a.text().trim()
    if (href && title) results.push({ position: results.length + 1, title, url: href })
  })
  return results
}

export function cleanDomain(domain) {
  return (domain || "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase()
}

export async function checkRank({ keyword, domain, engine }) {
  const results =
    engine === "bing" ? await searchBing(keyword) : await searchDuckDuckGo(keyword)
  const clean = cleanDomain(domain)
  let position = null
  for (const r of results) {
    try {
      const h = new URL(r.url).hostname.replace(/^www\./i, "").toLowerCase()
      r.isMatch = !!clean && (h === clean || h.endsWith("." + clean))
      if (r.isMatch && position === null) position = r.position
    } catch {
      r.isMatch = false
    }
  }
  return {
    keyword,
    domain: clean,
    engine: engine === "bing" ? "bing" : "duckduckgo",
    position,
    totalResults: results.length,
    results,
  }
}
