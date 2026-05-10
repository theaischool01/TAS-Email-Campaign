import { Suspense } from "react"
import { prisma } from "@/app/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { redirect } from "next/navigation"
import { 
  BarChart3, 
  Mail, 
  MousePointer2, 
  Eye, 
  UserX, 
  AlertOctagon, 
  ArrowLeft,
  Calendar,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

async function ReportContent({ id }: { id: string }) {
  const campaign = await (prisma as any).campaign.findUnique({
    where: { id },
    include: {
      user: true,
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  })

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Campaign not found</h2>
        <Link href="/campaigns" className="text-blue-600 hover:underline mt-4 block">Return to campaigns</Link>
      </div>
    )
  }

  // Fetch contact details for the actorIds found in logs
  const contactIds = Array.from(new Set(campaign.activityLogs.map((log: any) => log.actorId).filter((id: string) => id !== 'ses-native' && id.length > 5)))
  const contacts = await (prisma as any).contact.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, firstName: true, lastName: true, email: true }
  })

  const contactMap = new Map(contacts.map((c: any) => [c.id, c]))

  const openRate = campaign.totalSent > 0 ? (campaign.totalOpened / campaign.totalSent) * 100 : 0
  const clickRate = campaign.totalSent > 0 ? (campaign.totalClicked / campaign.totalSent) * 100 : 0
  const bounceRate = campaign.totalSent > 0 ? (campaign.totalBounced / campaign.totalSent) * 100 : 0

  const stats = [
    { label: "Sent", value: campaign.totalSent, icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Opened", value: campaign.totalOpened, icon: Eye, color: "text-purple-600", bg: "bg-purple-50", rate: `${openRate.toFixed(1)}%` },
    { label: "Clicked", value: campaign.totalClicked, icon: MousePointer2, color: "text-green-600", bg: "bg-green-50", rate: `${clickRate.toFixed(1)}%` },
    { label: "Bounced", value: campaign.totalBounced, icon: AlertOctagon, color: "text-red-600", bg: "bg-red-50", rate: `${bounceRate.toFixed(1)}%` },
    { label: "Unsubscribed", value: campaign.totalUnsubscribed, icon: UserX, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Complaints", value: campaign.totalComplained, icon: AlertOctagon, color: "text-yellow-600", bg: "bg-yellow-50" },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-500">Analytics Report • Sent on {campaign.sentAt ? format(new Date(campaign.sentAt), 'PPP') : 'N/A'}</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden">
            <div className={`h-1 ${stat.bg.replace('bg-', 'bg-')}`} />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.rate && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.color}`}>
                    {stat.rate}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Info */}
        <Card className="lg:col-span-1 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject Line</label>
              <p className="text-gray-900 font-medium mt-1">{campaign.subject}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sender</label>
              <p className="text-gray-900 font-medium mt-1">{campaign.senderName} ({campaign.senderEmail})</p>
            </div>
            <div className="flex items-center gap-4 py-4 border-y border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{campaign.recipientCount} Recipients</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{campaign.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Real-Time Activity</CardTitle>
              <CardDescription>Latest interactions from your recipients</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-300" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaign.activityLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  No activity recorded yet.
                </div>
              ) : (
                campaign.activityLogs.map((log: any, i: number) => {
                  const contact = contactMap.get(log.actorId) as any
                  const displayName = contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email : null
                  const initials = contact ? (contact.firstName?.[0] || contact.email?.[0] || 'A').toUpperCase() : (log.action.split('_')[1]?.[0] || 'A')
                  
                  return (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                        ${log.action.includes('OPEN') ? 'bg-purple-100 text-purple-700' : 
                          log.action.includes('CLICK') ? 'bg-green-100 text-green-700' : 
                          log.action.includes('BOUNCE') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                      `}>
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">
                            {displayName || 'System Notification'}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                            ${log.action.includes('OPEN') ? 'bg-purple-100 text-purple-600' : 
                              log.action.includes('CLICK') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {log.action.replace('EMAIL_', '').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {contact?.email || (log.metadata as any)?.email || (log.metadata as any)?.ipAddress || 'Anonymous'} 
                          { (log.metadata as any)?.url && ` • clicked: ${(log.metadata as any).url}` }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                          {format(new Date(log.createdAt), 'HH:mm')}
                        </p>
                        <p className="text-[10px] text-gray-300 italic">
                          {format(new Date(log.createdAt), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default async function CampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) redirect("/login")

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <ReportContent id={id} />
    </Suspense>
  )
}
