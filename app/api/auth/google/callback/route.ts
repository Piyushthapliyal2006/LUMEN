import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const appOrigin = url.origin.replace("://0.0.0.0", "://localhost")
  const appUrl = (path: string) => new URL(path, appOrigin)
  const code = url.searchParams.get("code")
  const returnedState = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const cookieStore = await cookies()
  const savedState = cookieStore.get("lumen-google-state")?.value

  if (error || !code || !returnedState || returnedState !== savedState) {
    return NextResponse.redirect(appUrl("/?auth=cancelled"))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(appUrl("/?auth=not-configured"))
  }

  const redirectUri = `${appOrigin}/api/auth/google/callback`
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenResponse.ok) {
    return NextResponse.redirect(appUrl("/?auth=failed"))
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenData.access_token) {
    return NextResponse.redirect(appUrl("/?auth=failed"))
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  if (!profileResponse.ok) {
    return NextResponse.redirect(appUrl("/?auth=failed"))
  }

  const profile = (await profileResponse.json()) as {
    sub?: string
    email?: string
    name?: string
    picture?: string
  }
  if (!profile.sub) {
    return NextResponse.redirect(appUrl("/?auth=failed"))
  }

  const response = NextResponse.redirect(appUrl("/?auth=success"))
  response.cookies.set("lumen-account-created", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  response.cookies.set("lumen-account-name", encodeURIComponent(profile.name || profile.email || "Account"), {
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  response.cookies.set("lumen-account-email", encodeURIComponent(profile.email || profile.sub), {
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  if (profile.picture) {
    response.cookies.set("lumen-account-picture", encodeURIComponent(profile.picture), {
      sameSite: "lax",
      secure: url.protocol === "https:",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
  }
  response.cookies.set("lumen-google-state", "", { maxAge: 0, path: "/" })
  return response
}
