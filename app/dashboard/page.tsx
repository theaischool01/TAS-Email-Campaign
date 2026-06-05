export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/next-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Mail, Users, FileText, TrendingUp } from "lucide-react"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { prisma } from "@/app/lib/prisma"
import { DashboardService } from "@/lib/services/dashboard.service"
import { StatCard } from "@/components/dashboard/StatCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { RecentCampaignsWidget } from "@/components/dashboard/RecentCampaignsWidget"
import Link from "next/link"

interface DashboardStats {
  summary: any
  growthTrend: any
  topCampaigns: any[]
  recentActivity: any[]
  campaignCount: number
  templateCount: number
  contactCount: number
  recentCampaigns: any[]
}

async function getDashboardStats(session: any): Promise<DashboardStats | null> {
  try {
    const [summary, growthTrend, topCampaigns, recentActivity, campaignCount, templateCount, contactCount, recentCampaigns] = await Promise.all([
      DashboardService.getStatsSummary(session, prisma),
      DashboardService.getContactGrowthTrend(session, prisma),
      DashboardService.getTopCampaigns(session, prisma),
      DashboardService.getRecentActivity(session, prisma),
      DashboardService.getCampaignCount(session, prisma),
      DashboardService.getTemplateCount(session, prisma),
      DashboardService.getContactCount(session, prisma),
      (prisma as any).campaign.findMany({
        where: { 
          createdBy: session.user.id,
          status: { in: ['SENT', 'SENDING', 'SCHEDULED'] }
        },
        select: {
          id: true,
          name: true,
          status: true,
          sentAt: true,
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
          recipientCount: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])
    
    return {
      summary,
      growthTrend,
      topCampaigns,
      recentActivity,
      campaignCount,
      templateCount,
      contactCount,
      recentCampaigns
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return null
  }
}

export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      redirect("/login")
    }

    const data = await getDashboardStats(session)
    if (!data) {
      return (
        <DashboardLayout>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold">Failed to load analytics</h2>
            <p className="text-slate-500">Please try again later.</p>
          </div>
        </DashboardLayout>
      )
    }

    const { summary, topCampaigns, recentActivity, campaignCount, recentCampaigns } = data

    // Time-based greeting
    const hour = new Date().getHours()
    let greeting = "Good morning"
    if (hour >= 12 && hour < 17) {
      greeting = "Good afternoon"
    } else if (hour >= 17) {
      greeting = "Good evening"
    }

    const firstName = session.user?.name ? session.user.name.split(" ")[0] : "Admin"

    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {greeting}, {firstName}!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg font-medium">
                Here's what's happening with your campaigns today.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="w-4 h-4 mr-2" />
                New Campaign
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Total Contacts */}
            <StatCard 
              title="Total Contacts" 
              value={data.contactCount.toLocaleString()}
              trend={{
                value: data.growthTrend.growth,
                label: 'Growth (30d)',
                isUp: data.growthTrend.growth >= 0
              }}
              icon={<Users className="w-6 h-6" />}
              status="neutral"
            />

            {/* 2. Emails Sent */}
            <StatCard 
              title="Emails Sent" 
              value={summary.totalSent.toLocaleString()}
              icon={<Mail className="w-6 h-6" />}
              status="info"
            />

            {/* 3. Avg. Open Rate */}
            <StatCard 
              title="Avg. Open Rate" 
              value={`${(summary.openRate || 0).toFixed(1)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              status={(summary.openRate || 0) >= 20 ? 'success' : 'warning'}
            />

            {/* 4. Campaigns Created */}
            <StatCard 
              title="Campaigns Created"
              value={campaignCount.toLocaleString()}
              icon={<FileText className="w-6 h-6" />}
              status="neutral"
            />
            
            {/* 5. Bounce Rate */}
            <StatCard 
              title="Bounce Rate" 
              value={`${(summary.bounceRate || 0).toFixed(1)}%`}
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              status={(summary.bounceRate || 0) > 2 ? 'danger' : 'success'}
            />

            {/* 6. Templates Ready */}
            <StatCard 
              title="Templates Ready" 
              value={data.templateCount.toLocaleString()}
              icon={<FileText className="w-6 h-6" />}
              status="neutral"
            />
          </div>

          {/* Second Row: Top Campaigns & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Campaigns Spotlight Widget */}
              <RecentCampaignsWidget campaigns={recentCampaigns} />

              {/* Top Performing Campaigns Table */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Top Performing Campaigns
                  </h3>
                  <Link href="/campaigns" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Campaign</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Sent</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Open Rate</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Click Rate</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topCampaigns.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                            No campaigns sent yet
                          </td>
                        </tr>
                      ) : (
                        topCampaigns.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="block font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{c.name}</span>
                              <div className="flex gap-2 mt-1">
                                {c.openRate >= 25 && (
                                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tight">Best Open</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                              {c.totalSent.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{(c.openRate || 0).toFixed(1)}%</span>
                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full" 
                                    style={{ width: `${Math.min(c.openRate || 0, 100)}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{(c.clickRate || 0).toFixed(1)}%</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link 
                                href={`/campaigns/${c.id}/report`}
                                className="inline-flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                              >
                                View Report
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <RecentActivity activities={recentActivity} />
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/contacts"
              className="p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl hover:shadow-lg transition-all group"
            >
              <Users className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-slate-900 dark:text-white">Manage Audience</h4>
              <p className="text-sm text-slate-500 mt-1">Import and segment contact lists.</p>
            </Link>

            <Link
              href="/templates"
              className="p-6 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10 rounded-2xl hover:shadow-lg transition-all group"
            >
              <FileText className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-slate-900 dark:text-white">Email Layouts</h4>
              <p className="text-sm text-slate-500 mt-1">Review and manage email templates.</p>
            </Link>

            <Link
              href="/settings/org"
              className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg transition-all group"
            >
              <TrendingUp className="w-8 h-8 text-slate-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-slate-900 dark:text-white">Global Config</h4>
              <p className="text-sm text-slate-500 mt-1">Manage SES and organization defaults.</p>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/login")
  }
}
