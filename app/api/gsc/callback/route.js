import { NextResponse } from "next/server"
import { exchangeCode, getConfig } from "@/lib/gsc"

export async function GET(req) {
  const { appUrl } = getConfig()
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const oauthError = url.searchParams.get("error")

  if (oauthError) {
    return NextResponse.redirect(appUrl + "/gsc?error=" + encodeURIComponent(oauthError))
  }
  if (!code) {
    return NextResponse.redirect(appUrl + "/gsc?error=no_code")
  }
  try {
    await exchangeCode(code)
    return NextResponse.redirect(appUrl + "/gsc?connected=1")
  } catch (e) {
    return NextResponse.redirect(
      appUrl + "/gsc?error=" + encodeURIComponent(e?.message || "oauth_failed"),
    )
  }
}
