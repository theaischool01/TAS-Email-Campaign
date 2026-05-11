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
  orgName,
}: {
  searchParams: { uid?: string },
  orgName: string
}) {
  const { uid } = searchParams
  const contactData = await UnsubscribeService.getContactLists(uid)
  if (!contactData) {
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
    } else if (action === "save-preferences" && uid) {
      // Get all list IDs from the form
      const listIds = formData.getAll("listId").map(id => id.toString())
      const selectedListIds = formData.getAll("subscribed").map(id => id.toString())
      
      for (const listId of listIds) {
        const isSubscribed = selectedListIds.includes(listId)
        await UnsubscribeService.toggleListSubscription(uid, listId, isSubscribed)
      }
    }
    revalidatePath('/preferences')
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-transparent border-b border-gray-100 pb-8">
          <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Settings2 className="h-6 w-6" />
            </div>
            Email Preferences
          </CardTitle>
          <CardDescription className="text-base pt-2">
            Control the emails sent to <span className="font-bold text-blue-600">{contactData.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form action={handleUpdate}>
            <input type="hidden" name="action" value="save-preferences" />
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Subscription Lists</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                  {contactData.lists.length} Active
                </span>
              </div>

              {contactData.lists.length > 0 ? (
                <div className="grid gap-4">
                  {contactData.lists.map((list: any) => (
                    <div key={list.id} className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300">
                      <input type="hidden" name="listId" value={list.id} />
                      <div className="pt-0.5">
                        <Checkbox 
                          id={`list-${list.id}`} 
                          name="subscribed" 
                          value={list.id}
                          defaultChecked={true}
                          className="h-6 w-6 rounded-lg border-2 border-gray-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all shadow-sm"
                        />
                      </div>
                      <label htmlFor={`list-${list.id}`} className="flex-1 cursor-pointer">
                        <span className="block font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {list.name}
                        </span>
                        {list.description && (
                          <span className="block text-sm text-gray-500 mt-1 leading-relaxed">
                            {list.description}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">You are not currently subscribed to any specific lists.</p>
                </div>
              )}

              {contactData.lists.length > 0 && (
                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.01] transition-all bg-blue-600 hover:bg-blue-700">
                  Save My Preferences
                </Button>
              )}
            </div>
          </form>

          <div className="p-8 bg-gray-50/80 border-t border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <form action={handleUpdate} className="flex-1">
                <Button name="action" value="unsubscribe-all" variant="outline" className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all">
                  <BellOff className="h-5 w-5" />
                  Unsubscribe All
                </Button>
              </form>
              <form action={handleUpdate} className="flex-1">
                <Button name="action" value="subscribe-all" variant="ghost" className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-gray-500 hover:bg-gray-100 transition-all">
                  <Bell className="h-5 w-5" />
                  Reset to Active
                </Button>
              </form>
            </div>
            <div className="flex items-center justify-center gap-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${contactData.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Current Status: <span className={contactData.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>{contactData.status}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-white/50 py-3 px-6 rounded-full border border-white backdrop-blur-sm self-center">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        Your data is secure and handled according to our Privacy Policy.
      </div>
    </div>
  )
}

export default async function PreferencesPage(props: {
  searchParams: Promise<{ uid?: string }>
}) {
  const searchParams = await props.searchParams
  const { prisma } = await import("@/app/lib/prisma")
  const settings = await prisma.settings.findUnique({ where: { id: 'system' } })
  const orgName = settings?.orgName || "M9 Analytics"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Mail className="text-white h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{orgName}</span>
      </div>

      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your preferences...</p>
          </div>
        }>
          <PreferencesContent searchParams={searchParams} orgName={orgName} />
        </Suspense>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          &copy; 2026 {orgName}. All rights reserved.
        </p>
      </div>
    </div>
  )
}
