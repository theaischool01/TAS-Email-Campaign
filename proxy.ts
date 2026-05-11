import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === "SUPER_ADMIN"
    const isManager = token?.role === "CAMPAIGN_MANAGER"
    const isViewer = token?.role === "VIEWER"

    const pathname = req.nextUrl.pathname

    // Protect admin routes
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Protect management routes
    if ((pathname.startsWith("/campaigns") || pathname.startsWith("/contacts") || pathname.startsWith("/templates")) && 
        !isAdmin && !isManager) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/campaigns/:path*",
    "/contacts/:path*",
    "/templates/:path*",
    "/profile/:path*",
    "/settings/:path*"
  ]
}
