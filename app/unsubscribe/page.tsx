import { Suspense } from "react"
import { prisma } from "@/app/lib/prisma"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

async function UnsubscribeContent({ 
  searchParams 
}: { 
  searchParams: { email?: string; campaign?: string; cid?: string } 
}) {
  const { email, campaign, cid } = searchParams
  
  let success = false
  let error = ""
  let contactEmail = email

  try {
    if (cid) {
      const contact = await (prisma as any).contact.update({
        where: { id: cid },
        data: { status: 'UNSUBSCRIBED' }
      })
      contactEmail = contact.email
      success = true
    } else if (email) {
      await (prisma as any).contact.updateMany({
        where: { email },
        data: { status: 'UNSUBSCRIBED' }
      })
      success = true
    } else {
      error = "Missing unsubscribe information."
    }

    if (success && campaign) {
      // Log the unsubscribe activity
      await (prisma as any).campaignActivityLog.create({
        data: {
          campaignId: campaign,
          action: 'EMAIL_UNSUBSCRIBED',
          actorId: cid || 'anonymous',
          metadata: { email: contactEmail }
        }
      })
    }
  } catch (err) {
    console.error("Unsubscribe Error:", err)
    error = "Could not complete the unsubscribe request. Please try again later."
  }

  return (
    <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 text-center border border-gray-100">
      {success ? (
        <>
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed Successfully</h1>
          <p className="text-gray-600 mb-8">
            You have been removed from our mailing list. You will no longer receive emails at <span className="font-semibold text-gray-800">{contactEmail}</span>.
          </p>
          <p className="text-sm text-gray-400">
            Changed your mind? Please contact the organization to re-subscribe.
          </p>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribe Failed</h1>
          <p className="text-gray-600 mb-8">{error}</p>
        </>
      )}
    </div>
  )
}

export default function UnsubscribePage({ 
  searchParams 
}: { 
  searchParams: { email?: string; campaign?: string; cid?: string } 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500 font-medium">Processing your request...</p>
        </div>
      }>
        <UnsubscribeContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
