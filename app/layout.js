import "./globals.css"
import Nav from "./components/Nav"

export const metadata = {
  title: "SEO Toolkit — All-in-One SEO Dashboard",
  description:
    "Tools SEO gratis: on-page analyzer, keyword research, rank tracker, dan generator meta/schema/sitemap.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  )
}
