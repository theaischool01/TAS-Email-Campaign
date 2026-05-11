import { UnsubscribeService } from "@/lib/services/unsubscribe.service"
import { CheckCircle2, XCircle, Mail, RotateCcw, Settings2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { revalidatePath } from "next/cache"

async function UnsubscribeContent({
  searchParams,
}: {
  searchParams: { uid?: string }
}) {
  const { uid } = searchParams
  let success = false
  let error = ""
  let contactEmail = ""

  if (uid) {
    const { headers } = await import("next/headers")
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || 'unknown'
    const userAgent = headerList.get('user-agent') || 'unknown'

    const result = await UnsubscribeService.unsubscribe(uid, 'footer_link', { ip, userAgent })
    if (result.success) {
      success = true
      contactEmail = result.email || ""
    } else {
      error = result.error || "Invalid unsubscribe link."
    }
  } else {
    error = "Invalid or expired unsubscription link. Please check your email and try again."
  }

  async function handleResubscribe() {
    "use server"
    if (uid) {
      await UnsubscribeService.resubscribe(uid)
      revalidatePath('/unsubscribe')
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8 text-center">
        {success ? (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Unsubscribed</h1>
            <p className="text-gray-600 mb-6">
              You have been successfully unsubscribed from <span className="font-semibold">M9 Marketing List</span>.
              {contactEmail && <span className="block mt-1 text-sm font-medium">({contactEmail})</span>}
            </p>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Changed your mind?</p>
              <div className="flex flex-col gap-3">
                <form action={handleResubscribe}>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-6">
                    <RotateCcw className="h-4 w-4" />
                    Re-subscribe me
                  </Button>
                </form>
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2" asChild>
                  <Link href={`/preferences?uid=${uid}`}>
                    <Settings2 className="h-4 w-4" />
                    Manage Preferences
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Button className="w-full" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </>
        )}
      </div>
      
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400">
          &copy; 2026 M9 Analytics. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { uid?: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Organisation Logo/Brand */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Mail className="text-white h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-gray-900">M9 Analytics</span>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500 font-medium">Processing...</p>
        </div>
      }>
        <UnsubscribeContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
