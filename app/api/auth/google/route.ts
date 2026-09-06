import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error: "Google authentication is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.",
      },
      { status: 503 }
    )
  }

  const url = new URL(request.url)
  const appOrigin = url.origin.replace("://0.0.0.0", "://localhost")
  const redirectUri = `${appOrigin}/api/auth/google/callback`
  const state = randomBytes(24).toString("hex")
  const cookieStore = await cookies()
  cookieStore.set("lumen-google-state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 600,
    path: "/",
  })

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  googleUrl.searchParams.set("client_id", clientId)
  googleUrl.searchParams.set("redirect_uri", redirectUri)
  googleUrl.searchParams.set("response_type", "code")
  googleUrl.searchParams.set("scope", "openid email profile")
  googleUrl.searchParams.set("state", state)
  googleUrl.searchParams.set("access_type", "offline")
  googleUrl.searchParams.set("prompt", "select_account")

  return Response.redirect(googleUrl)
}
