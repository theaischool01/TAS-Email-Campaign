import { UnsubscribeService } from "@/lib/services/unsubscribe.service"
import { Mail, Settings2, ShieldCheck, BellOff, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Suspense } from "react"
import { revalidatePath } from "next/cache"

async function PreferencesContent({
  searchParams,
}: {
  searchParams: { uid?: string }
}) {
  const { uid } = searchParams
  
  if (!uid) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">Invalid or missing preference token.</p>
      </div>
    )
  }

  const data = UnsubscribeService.decodeToken(uid)
  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">Your link has expired or is invalid.</p>
      </div>
    )
  }

  async function handleUpdate(formData: FormData) {
    "use server"
    const action = formData.get("action")
    if (action === "unsubscribe-all" && uid) {
      await UnsubscribeService.unsubscribe(uid, 'preferences_center')
    } else if (action === "subscribe-all" && uid) {
      await UnsubscribeService.resubscribe(uid)
    }
    revalidatePath('/preferences')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-blue-600" />
            Subscription Preferences
          </CardTitle>
          <CardDescription>
            Manage what emails you receive from M9 Analytics for <span className="font-medium text-gray-900">{data.em}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Checkbox id="newsletters" checked disabled />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="newsletters" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Newsletters & Updates
                </label>
                <p className="text-xs text-muted-foreground">
                  Our latest news, articles, and monthly summaries.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Checkbox id="promotions" checked disabled />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="promotions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Promotions & Offers
                </label>
                <p className="text-xs text-muted-foreground">
                  Exclusive deals, discounts, and special event invitations.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <form action={handleUpdate} className="space-y-4">
              <Button name="action" value="unsubscribe-all" variant="destructive" className="w-full flex items-center justify-center gap-2 py-6">
                <BellOff className="h-4 w-4" />
                Unsubscribe from ALL emails
              </Button>
              <Button name="action" value="subscribe-all" variant="outline" className="w-full flex items-center justify-center gap-2 py-6">
                <Bell className="h-4 w-4" />
                Keep me subscribed to all
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="h-3 w-3" />
        Your data is secure and handled according to our Privacy Policy.
      </div>
    </div>
  )
}

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: { uid?: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Mail className="text-white h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-gray-900">M9 Analytics</span>
      </div>

      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your preferences...</p>
          </div>
        }>
          <PreferencesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
