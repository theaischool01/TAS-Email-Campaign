import { NextRequest, NextResponse } from "next/server"
import { UnsubscribeService } from "@/lib/services/unsubscribe.service"

/**
 * Handles RFC 8058 One-Click Unsubscribe (POST request)
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const uid = url.searchParams.get('uid')

    console.log(`[ONE-CLICK UNSUBSCRIBE] Received POST request for UID: ${uid}`)

    if (!uid) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await UnsubscribeService.unsubscribe(uid, 'gmail_one_click', { ip, userAgent })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // RFC 8058 requires a 200 OK response
    return new NextResponse("Unsubscribed successfully", { status: 200 })
  } catch (error) {
    console.error("[ONE-CLICK UNSUBSCRIBE] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * Fallback for GET requests
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const uid = url.searchParams.get('uid')
  
  // Redirect to the unsubscribe page using the same origin
  const redirectUrl = new URL('/unsubscribe', request.url)
  if (uid) redirectUrl.searchParams.set('uid', uid)
  
  return NextResponse.redirect(redirectUrl)
}
