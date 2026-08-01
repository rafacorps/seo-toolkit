import { NextResponse } from "next/server"
import { isConfigured, isConnected, listSites, disconnect } from "@/lib/gsc"

export async function GET() {
  const configured = isConfigured()
  const connected = configured && isConnected()
  let sites = []
  let error = null
  if (connected) {
    try {
      sites = await listSites()
    } catch (e) {
      error = e?.message || "Gagal memuat daftar situs"
    }
  }
  return NextResponse.json({ configured, connected, sites, error })
}

export async function DELETE() {
  disconnect()
  return NextResponse.json({ ok: true })
}
