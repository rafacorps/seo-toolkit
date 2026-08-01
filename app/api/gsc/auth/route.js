import { NextResponse } from "next/server"
import { isConfigured, getAuthUrl } from "@/lib/gsc"

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET belum diisi di .env.local" },
      { status: 400 },
    )
  }
  return NextResponse.redirect(getAuthUrl())
}
