export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/next-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Users, FileText, TrendingUp } from "lucide-react"
import { prisma } from "@/app/lib/prisma"
import { DashboardService } from "@/lib/services/dashboard.service"
import Link from "next/link"

interface DashboardStats {
  totalCampaigns: number
  totalContacts: number
  totalTemplates: number
  recentActivity: Array<{
    title: string
    time: string
  }>
}

async function getDashboardStats(session: any): Promise<DashboardStats> {
  try {
    // Use centralized services for consistent RBAC across platform
    const [totalCampaigns, totalContacts, totalTemplates] = await Promise.all([
      DashboardService.getCampaignCount(session, prisma),
      DashboardService.getContactCount(session, prisma),
      DashboardService.getTemplateCount(session, prisma)
    ])
    
    console.log("📊 Dashboard Stats:", {
      totalCampaigns,
      totalContacts,
      totalTemplates,
      userId: session.user.id,
      userRole: session.user.role
    })
    
    return {
      totalCampaigns,
      totalContacts,
      totalTemplates,
      recentActivity: []
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalCampaigns: 0,
      totalContacts: 0,
      totalTemplates: 0,
      recentActivity: []
    }
  }
}

export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      redirect("/login")
    }

    if (!session.user?.role) {
      console.error("No role in session:", session)
      redirect("/login")
    }

  const stats = await getDashboardStats(session)
  const isAdmin = session.user.role === "SUPER_ADMIN"
  const isManager = session.user.role === "CAMPAIGN_MANAGER"

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, {session.user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {(isAdmin || isManager) && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Campaigns</CardTitle>
                <Mail className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</div>
                <p className="text-sm text-gray-600 mt-1">
                  Total campaigns created
                </p>
              </CardContent>
            </Card>
          )}

          {(isAdmin || isManager) && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Contacts</CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalContacts}</div>
                <p className="text-sm text-gray-600 mt-1">
                  Total contacts in lists
                </p>
              </CardContent>
            </Card>
          )}

          {(isAdmin || isManager) && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Templates</CardTitle>
                <FileText className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalTemplates}</div>
                <p className="text-sm text-gray-600 mt-1">
                  Email templates available
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">Performance</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0%</div>
              <p className="text-sm text-gray-600 mt-1">
                Average open rate
              </p>
              </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">
                Latest activities in your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No recent activity</p>
                    <p className="text-gray-400 text-xs mt-2">Your actions will appear here once you start using the platform</p>
                  </div>
                ) : (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(isAdmin || isManager) && (
                  <>
                    <Link
                      href="/campaigns/new"
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:shadow-md"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">Create Campaign</h4>
                      <p className="text-sm text-gray-600">Start a new email campaign</p>
                    </Link>
                    <Link
                      href="/contacts/import"
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 cursor-pointer hover:shadow-md"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">Import Contacts</h4>
                      <p className="text-sm text-gray-600">Add contacts to your lists</p>
                    </Link>
                  </>
                )}
                <Link
                  href="/templates/new"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 cursor-pointer hover:shadow-md"
                >
                  <h4 className="font-medium text-gray-900 mb-1">Create Template</h4>
                  <p className="text-sm text-gray-600">Design a new email template</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/login")
  }
}
