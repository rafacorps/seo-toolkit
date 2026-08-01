import Link from "next/link"

const tools = [
  {
    href: "/analyzer",
    icon: "\u{1F50E}",
    title: "On-Page SEO Analyzer",
    desc: "Audit title, meta, heading, alt text, link, HTTPS, structured data — lengkap dengan skor.",
  },
  {
    href: "/keywords",
    icon: "\u{1F4A1}",
    title: "Keyword Research",
    desc: "Cari ide keyword dari Google Autocomplete: long-tail, pertanyaan, dan variasi A–Z.",
  },
  {
    href: "/rank",
    icon: "\u{1F4C8}",
    title: "SERP Rank Tracker",
    desc: "Cek posisi domain kamu untuk keyword tertentu di DuckDuckGo/Bing, dengan riwayat.",
  },
  {
    href: "/generators",
    icon: "\u{1F9F0}",
    title: "Generators",
    desc: "Meta tags + preview Google, Schema JSON-LD, sitemap.xml, dan robots.txt.",
  },
]

export default function Home() {
  return (
    <div>
      <h1>All-in-One SEO Dashboard</h1>
      <p className="subtitle">
        Kumpulan tools SEO gratis tanpa API berbayar. Pilih tool di bawah untuk
        mulai audit, riset keyword, cek ranking, atau generate meta &amp; schema.
      </p>

      <div className="grid grid-2">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="card tool-card">
            <div className="icon" aria-hidden="true">
              {t.icon}
            </div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </Link>
        ))}
      </div>

      <div className="section">
        <h2>Cara pakai singkat</h2>
        <div className="card soft">
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
            <li>
              Mulai dari <b>Keyword Research</b> untuk menemukan keyword target.
            </li>
            <li>
              Tulis/optimasi halaman, lalu audit dengan <b>On-Page Analyzer</b>{" "}
              (masukkan keyword target agar dicek juga).
            </li>
            <li>
              Lengkapi meta tags, schema, sitemap, dan robots.txt lewat{" "}
              <b>Generators</b>.
            </li>
            <li>
              Pantau perkembangan posisi secara berkala di <b>Rank Tracker</b>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
