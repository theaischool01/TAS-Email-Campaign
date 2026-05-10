'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ReportSummaryCards } from '@/components/campaigns/report/ReportSummaryCards'
import { OpenTimelineChart } from '@/components/campaigns/report/OpenTimelineChart'
import { LinkClickTable } from '@/components/campaigns/report/LinkClickTable'
import { RecipientActivityTable } from '@/components/campaigns/report/RecipientActivityTable'
import { 
  ArrowDownTrayIcon, 
  ChevronLeftIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'

export default function CampaignReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/analytics/campaigns/${id}`)
        setData(response.data.data)
      } catch (error) {
        console.error("Failed to fetch report data:", error)
        toast.error("Failed to load campaign report")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold">Report not found</h2>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline mt-4 flex items-center justify-center mx-auto">
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> Go Back
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const { campaign, summary, openTimeline, links, deviceStats } = data

  const handleExport = () => {
    window.location.href = `/api/analytics/campaigns/${id}/export`
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/campaigns" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{campaign.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {campaign.status}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Sent on {new Date(campaign.sentAt || campaign.createdAt).toLocaleDateString()} at {new Date(campaign.sentAt || campaign.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* 1. Summary Cards */}
        <ReportSummaryCards data={summary} />

        {/* 2. Engagement Timeline Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <OpenTimelineChart data={openTimeline} />
          </div>
          
          {/* Device Breakdown */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6">Device Breakdown</h3>
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <ComputerDesktopIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Desktop</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{deviceStats.desktop}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Mobile</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{deviceStats.mobile}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                    <DeviceTabletIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Tablet</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{deviceStats.tablet}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 leading-relaxed text-center italic">
                Device data is estimated based on User-Agent headers recorded during opens and clicks.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Link Click Table */}
        <LinkClickTable links={links} />

        {/* 4. Recipient Activity Table */}
        <RecipientActivityTable activities={data.recentActivity} />

        {/* 5. Subject Line Detail (Metadata) */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <EnvelopeOpenIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-3">Campaign Subject Line</h3>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">"{campaign.subject}"</h2>
            <p className="text-slate-400 font-medium">
              Preview Text: <span className="text-slate-300 italic">{campaign.previewText || "None provided"}</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

import { EnvelopeOpenIcon } from '@heroicons/react/24/outline'
