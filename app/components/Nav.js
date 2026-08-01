"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/analyzer", label: "On-Page Analyzer" },
  { href: "/keywords", label: "Keyword Research" },
  { href: "/rank", label: "Rank Tracker" },
  { href: "/gsc", label: "Search Console" },
  { href: "/generators", label: "Generators" },
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          SEO<span>Toolkit</span>
        </Link>
        <div className="nav-links">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={path === l.href ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
