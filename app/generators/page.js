"use client"

import { useState } from "react"

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? "Tersalin \u2713" : "Copy"}
    </button>
  )
}

function Field({ label, value, onChange, textarea, placeholder }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

/* ---------------- Meta tags ---------------- */
function MetaTab() {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [url, setUrl] = useState("")
  const [siteName, setSiteName] = useState("")
  const [ogImage, setOgImage] = useState("")

  const code = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    url && `<link rel="canonical" href="${url}" />`,
    "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    url && `<meta property="og:url" content="${url}" />`,
    siteName && `<meta property="og:site_name" content="${siteName}" />`,
    ogImage && `<meta property="og:image" content="${ogImage}" />`,
    "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    ogImage && `<meta name="twitter:image" content="${ogImage}" />`,
  ]
    .filter((l) => l !== false && l !== undefined && l !== null)
    .join("\n")

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card soft">
        <Field label={`Title (${title.length}/60)`} value={title} onChange={setTitle} placeholder="Judul halaman" />
        <Field
          label={`Meta description (${desc.length}/160)`}
          value={desc}
          onChange={setDesc}
          textarea
          placeholder="Deskripsi singkat halaman…"
        />
        <Field label="URL halaman" value={url} onChange={setUrl} placeholder="https://situskamu.com/halaman" />
        <Field label="Nama situs" value={siteName} onChange={setSiteName} placeholder="Nama brand/situs" />
        <Field label="URL gambar OG (1200×630)" value={ogImage} onChange={setOgImage} placeholder="https://…/og.jpg" />
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <div className="label">Preview di Google</div>
          <div className="serp-preview">
            <div className="s-url">{url || "https://situskamu.com › halaman"}</div>
            <div className="s-title">{title || "Judul halaman kamu tampil di sini"}</div>
            <div className="s-desc">
              {desc || "Meta description kamu akan tampil di sini. Buat 70–160 karakter yang menarik untuk diklik."}
            </div>
          </div>
        </div>
        <div>
          <div className="toolbar" style={{ justifyContent: "space-between" }}>
            <div className="label" style={{ margin: 0 }}>
              Kode HTML
            </div>
            <CopyButton text={code} />
          </div>
          <pre className="code">{code}</pre>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Schema JSON-LD ---------------- */
function SchemaTab() {
  const [type, setType] = useState("Article")
  const [f, setF] = useState({})
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))
  const g = (k) => f[k] || ""

  let obj = { "@context": "https://schema.org" }
  if (type === "Article") {
    obj = {
      ...obj,
      "@type": "Article",
      headline: g("headline"),
      description: g("description"),
      image: g("image") || undefined,
      datePublished: g("datePublished") || undefined,
      author: g("author") ? { "@type": "Person", name: g("author") } : undefined,
    }
  } else if (type === "Product") {
    obj = {
      ...obj,
      "@type": "Product",
      name: g("name"),
      description: g("description"),
      image: g("image") || undefined,
      brand: g("brand") ? { "@type": "Brand", name: g("brand") } : undefined,
      offers:
        g("price") &&
        {
          "@type": "Offer",
          price: g("price"),
          priceCurrency: g("currency") || "IDR",
          availability: "https://schema.org/InStock",
        },
    }
  } else if (type === "FAQPage") {
    const qa = g("faq")
      .split("\n")
      .map((l) => l.split("|"))
      .filter((p) => p.length >= 2)
    obj = {
      ...obj,
      "@type": "FAQPage",
      mainEntity: qa.map(([q, a]) => ({
        "@type": "Question",
        name: q.trim(),
        acceptedAnswer: { "@type": "Answer", text: a.trim() },
      })),
    }
  } else if (type === "Organization") {
    obj = {
      ...obj,
      "@type": "Organization",
      name: g("name"),
      url: g("url") || undefined,
      logo: g("logo") || undefined,
      sameAs: g("sameAs")
        ? g("sameAs").split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    }
  } else if (type === "LocalBusiness") {
    obj = {
      ...obj,
      "@type": "LocalBusiness",
      name: g("name"),
      address: g("address") || undefined,
      telephone: g("phone") || undefined,
      url: g("url") || undefined,
      openingHours: g("hours") || undefined,
    }
  }
  const clean = JSON.parse(JSON.stringify(obj, (k, v) => (v === "" || v === false ? undefined : v)))
  const code = `<script type="application/ld+json">\n${JSON.stringify(clean, null, 2)}\n</script>`

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card soft">
        <div className="field">
          <label className="label">Tipe schema</label>
          <select className="input" value={type} onChange={(e) => { setType(e.target.value); setF({}) }}>
            <option>Article</option>
            <option>Product</option>
            <option>FAQPage</option>
            <option>Organization</option>
            <option>LocalBusiness</option>
          </select>
        </div>
        {type === "Article" && (
          <>
            <Field label="Headline" value={g("headline")} onChange={set("headline")} />
            <Field label="Deskripsi" value={g("description")} onChange={set("description")} textarea />
            <Field label="Nama penulis" value={g("author")} onChange={set("author")} />
            <Field label="Tanggal publish (YYYY-MM-DD)" value={g("datePublished")} onChange={set("datePublished")} />
            <Field label="URL gambar" value={g("image")} onChange={set("image")} />
          </>
        )}
        {type === "Product" && (
          <>
            <Field label="Nama produk" value={g("name")} onChange={set("name")} />
            <Field label="Deskripsi" value={g("description")} onChange={set("description")} textarea />
            <Field label="Brand" value={g("brand")} onChange={set("brand")} />
            <Field label="Harga" value={g("price")} onChange={set("price")} placeholder="150000" />
            <Field label="Mata uang" value={g("currency")} onChange={set("currency")} placeholder="IDR" />
            <Field label="URL gambar" value={g("image")} onChange={set("image")} />
          </>
        )}
        {type === "FAQPage" && (
          <Field
            label="Daftar FAQ (satu per baris: Pertanyaan | Jawaban)"
            value={g("faq")}
            onChange={set("faq")}
            textarea
            placeholder={"Apa itu SEO? | SEO adalah…\nBerapa biayanya? | Mulai dari…"}
          />
        )}
        {type === "Organization" && (
          <>
            <Field label="Nama organisasi" value={g("name")} onChange={set("name")} />
            <Field label="URL situs" value={g("url")} onChange={set("url")} />
            <Field label="URL logo" value={g("logo")} onChange={set("logo")} />
            <Field label="Profil sosial (pisahkan koma)" value={g("sameAs")} onChange={set("sameAs")} />
          </>
        )}
        {type === "LocalBusiness" && (
          <>
            <Field label="Nama bisnis" value={g("name")} onChange={set("name")} />
            <Field label="Alamat" value={g("address")} onChange={set("address")} textarea />
            <Field label="Telepon" value={g("phone")} onChange={set("phone")} />
            <Field label="URL situs" value={g("url")} onChange={set("url")} />
            <Field label="Jam buka" value={g("hours")} onChange={set("hours")} placeholder="Mo-Fr 09:00-17:00" />
          </>
        )}
      </div>
      <div>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="label" style={{ margin: 0 }}>
            JSON-LD
          </div>
          <CopyButton text={code} />
        </div>
        <pre className="code">{code}</pre>
      </div>
    </div>
  )
}

/* ---------------- Sitemap ---------------- */
function SitemapTab() {
  const [urls, setUrls] = useState("")
  const [freq, setFreq] = useState("weekly")
  const [priority, setPriority] = useState("0.8")

  const today = new Date().toISOString().slice(0, 10)
  const list = urls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean)
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    list
      .map(
        (u) =>
          `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
      )
      .join("\n") +
    `\n</urlset>`

  function download() {
    const blob = new Blob([xml], { type: "application/xml" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "sitemap.xml"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card soft">
        <Field
          label={`Daftar URL (${list.length} URL, satu per baris)`}
          value={urls}
          onChange={setUrls}
          textarea
          placeholder={"https://situskamu.com/\nhttps://situskamu.com/tentang"}
        />
        <div className="row">
          <div className="field">
            <label className="label">Change frequency</label>
            <select className="input" value={freq} onChange={(e) => setFreq(e.target.value)}>
              <option>always</option>
              <option>hourly</option>
              <option>daily</option>
              <option>weekly</option>
              <option>monthly</option>
              <option>yearly</option>
              <option>never</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["1.0", "0.9", "0.8", "0.7", "0.6", "0.5"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="label" style={{ margin: 0 }}>
            sitemap.xml
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <CopyButton text={xml} />
            <button className="btn" type="button" onClick={download} disabled={list.length === 0}>
              Download
            </button>
          </div>
        </div>
        <pre className="code">{xml}</pre>
      </div>
    </div>
  )
}

/* ---------------- Robots.txt ---------------- */
function RobotsTab() {
  const [disallow, setDisallow] = useState("/admin\n/api")
  const [allow, setAllow] = useState("")
  const [sitemap, setSitemap] = useState("")

  const lines = ["User-agent: *"]
  disallow
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => lines.push("Disallow: " + l))
  allow
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => lines.push("Allow: " + l))
  if (sitemap.trim()) {
    lines.push("")
    lines.push("Sitemap: " + sitemap.trim())
  }
  const txt = lines.join("\n")

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card soft">
        <Field label="Disallow (satu path per baris)" value={disallow} onChange={setDisallow} textarea />
        <Field label="Allow (opsional)" value={allow} onChange={setAllow} textarea placeholder="/blog" />
        <Field label="URL sitemap" value={sitemap} onChange={setSitemap} placeholder="https://situskamu.com/sitemap.xml" />
      </div>
      <div>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="label" style={{ margin: 0 }}>
            robots.txt
          </div>
          <CopyButton text={txt} />
        </div>
        <pre className="code">{txt}</pre>
      </div>
    </div>
  )
}

const TABS = [
  { id: "meta", label: "Meta Tags", el: <MetaTab /> },
  { id: "schema", label: "Schema JSON-LD", el: <SchemaTab /> },
  { id: "sitemap", label: "Sitemap XML", el: <SitemapTab /> },
  { id: "robots", label: "Robots.txt", el: <RobotsTab /> },
]

export default function GeneratorsPage() {
  const [tab, setTab] = useState("meta")
  return (
    <div>
      <h1>Generators</h1>
      <p className="subtitle">
        Generate meta tags dengan preview Google, schema JSON-LD, sitemap.xml,
        dan robots.txt. Semua diproses di browser — tanpa server, tanpa API.
      </p>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={"tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TABS.find((t) => t.id === tab).el}
    </div>
  )
}
