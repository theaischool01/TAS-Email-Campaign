import { UnsubscribeService } from "@/lib/services/unsubscribe.service"
import { CheckCircle2, XCircle, Mail, RotateCcw, Settings2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { revalidatePath } from "next/cache"
import { ResubscribeButton } from "@/components/preferences/ResubscribeButton"

async function UnsubscribeContent({
  searchParams,
  orgName,
}: {
  searchParams: { uid?: string, confirmed?: string },
  orgName: string
}) {
  const { uid, confirmed } = searchParams
  
  if (!uid) {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Link</h1>
        <p className="text-gray-600 mb-8">This unsubscription link is invalid or has expired.</p>
        <Button className="w-full" asChild>
          <Link href="/landing">Return to Home</Link>
        </Button>
      </div>
    )
  }

  // 1. Validate token only
  const data = UnsubscribeService.decodeToken(uid)
  if (!data) {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Link</h1>
        <p className="text-gray-600 mb-8">This unsubscription link is invalid or has expired.</p>
        <Button className="w-full" asChild>
          <Link href="/landing">Return to Home</Link>
        </Button>
      </div>
    )
  }

  // 2. Handle Success State (after confirmation)
  if (confirmed === 'true') {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Unsubscribed</h1>
        <p className="text-gray-600 mb-6">
          You have been successfully unsubscribed from <span className="font-semibold">{orgName} Mailing List</span>.
          <span className="block mt-1 text-sm font-medium">({data.em})</span>
        </p>
        
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Changed your mind?</p>
          <div className="flex flex-col gap-3">
            <form action={async () => {
              "use server"
              await UnsubscribeService.resubscribe(uid)
              revalidatePath('/unsubscribe')
              revalidatePath('/dashboard')
              revalidatePath('/campaigns')
            }}>
              <ResubscribeButton actionType="resubscribe" className="w-full py-6" />
            </form>
            <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2" asChild>
              <Link href={`/preferences?uid=${uid}`}>
                <Settings2 className="h-4 w-4" />
                Manage Preferences
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Confirmation UI (Initial View)
  async function handleConfirm() {
    "use server"
    const { headers } = await import("next/headers")
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || 'unknown'
    const userAgent = headerList.get('user-agent') || 'unknown'
    
    await UnsubscribeService.unsubscribe(uid!, 'footer_link', { ip, userAgent })
    
    // Task 4: Realtime Refresh
    revalidatePath('/unsubscribe')
    revalidatePath('/dashboard')
    revalidatePath('/campaigns')

    // Redirect to success state (self-page with param)
    const { redirect } = await import("next/navigation")
    redirect(`/unsubscribe?uid=${uid}&confirmed=true`)
  }

  return (
    <div className="p-8 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="h-10 w-10 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Unsubscribe</h1>
      <p className="text-gray-600 mb-8">
        Are you sure you want to unsubscribe <span className="font-semibold text-gray-900">{data.em}</span> from {orgName}?
      </p>
      
      <form action={handleConfirm}>
        <Button className="w-full py-6 text-lg font-bold shadow-lg shadow-blue-100" type="submit">
          Yes, Unsubscribe Me
        </Button>
      </form>
      
      <p className="mt-6 text-sm text-gray-400">
        You can also <Link href={`/preferences?uid=${uid}`} className="text-blue-600 hover:underline">manage your preferences</Link> to stay in touch.
      </p>
    </div>
  )
}

export default async function UnsubscribePage(props: {
  searchParams: Promise<{ uid?: string, confirmed?: string }>
}) {
  const searchParams = await props.searchParams
  const { prisma } = await import("@/app/lib/prisma")
  const settings = await prisma.settings.findUnique({ where: { id: 'system' } })
  const orgName = settings?.orgName || "M9 Analytics"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Organisation Logo/Brand */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Mail className="text-white h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{orgName}</span>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <Suspense fallback={
          <div className="p-12 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Processing...</p>
          </div>
        }>
          <UnsubscribeContent searchParams={searchParams} orgName={orgName} />
        </Suspense>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">
            &copy; 2026 {orgName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
