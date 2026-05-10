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
import Link from "next/link"

interface DashboardStats {
  summary: any
  growthTrend: any
  topCampaigns: any[]
  recentActivity: any[]
}

async function getDashboardStats(session: any): Promise<DashboardStats | null> {
  try {
    const [summary, growthTrend, topCampaigns, recentActivity] = await Promise.all([
      DashboardService.getStatsSummary(session, prisma),
      DashboardService.getContactGrowthTrend(session, prisma),
      DashboardService.getTopCampaigns(session, prisma),
      DashboardService.getRecentActivity(session, prisma)
    ])
    
    return {
      summary,
      growthTrend,
      topCampaigns,
      recentActivity
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

    const { summary, growthTrend, topCampaigns, recentActivity } = data

    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platform Analytics</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg font-medium">
                Welcome back, <span className="text-blue-600 dark:text-blue-400">{session.user?.name}</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-blue-500/20"
              >
                <Mail className="w-4 h-4 mr-2" />
                New Campaign
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Contacts" 
              value={growthTrend.currentCount.toLocaleString()}
              trend={{
                value: growthTrend.growth,
                label: 'vs last month',
                isUp: growthTrend.growth >= 0
              }}
              icon={<Users className="w-6 h-6" />}
              status="neutral"
            />
            
            <StatCard 
              title="Avg. Open Rate" 
              value={`${summary.openRate.toFixed(1)}%`}
              trend={{
                value: 21,
                label: 'Industry Avg',
                isUp: summary.openRate >= 21
              }}
              icon={<TrendingUp className="w-6 h-6" />}
              status={summary.openRate >= 21 ? 'success' : 'warning'}
            />

            <StatCard 
              title="Bounce Rate" 
              value={`${summary.bounceRate.toFixed(1)}%`}
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              status={summary.bounceRate > 2 ? 'danger' : summary.bounceRate > 1 ? 'warning' : 'success'}
            />

            <StatCard 
              title="Emails Sent" 
              value={summary.totalSent.toLocaleString()}
              icon={<Mail className="w-6 h-6" />}
              status="neutral"
            />
          </div>

          {/* Second Row: Top Campaigns & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Campaigns Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Top Performing Campaigns</h3>
                <Link href="/campaigns" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Sent</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Open Rate</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No campaigns sent yet</td>
                      </tr>
                    ) : (
                      topCampaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.totalSent.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(c.openRate, 100)}%` }} />
                              </div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{c.openRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              href={`/campaigns/${c.id}/report`}
                              className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              Report
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
              <h4 className="font-bold text-slate-900 dark:text-white">Manage Contacts</h4>
              <p className="text-sm text-slate-500 mt-1">Import, segment and manage lists.</p>
            </Link>

            <Link
              href="/templates"
              className="p-6 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10 rounded-2xl hover:shadow-lg transition-all group"
            >
              <FileText className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-slate-900 dark:text-white">Email Templates</h4>
              <p className="text-sm text-slate-500 mt-1">Design beautiful campaign emails.</p>
            </Link>

            <Link
              href="/settings"
              className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg transition-all group"
            >
              <TrendingUp className="w-8 h-8 text-slate-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-slate-900 dark:text-white">Global Settings</h4>
              <p className="text-sm text-slate-500 mt-1">Configure AWS SES and platform defaults.</p>
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
