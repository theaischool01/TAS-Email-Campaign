"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"

interface Campaign {
  id: string
  name: string
  status: string
  sentAt: string | null
  totalSent: number
  totalOpened: number
  totalClicked: number
  recipientCount: number
}

interface RecentCampaignsWidgetProps {
  campaigns: Campaign[]
}

export function RecentCampaignsWidget({ campaigns }: RecentCampaignsWidgetProps) {
  const [selectedId, setSelectedId] = useState<string>("")

  // Set default selection to the first campaign
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      setSelectedId(campaigns[0].id)
    }
  }, [campaigns])

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 italic shadow-sm">
        No campaigns sent yet
      </div>
    )
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedId) || campaigns[0]
  if (!selectedCampaign) return null

  const totalSent = selectedCampaign.totalSent || 0
  const totalOpened = selectedCampaign.totalOpened || 0
  const totalClicked = selectedCampaign.totalClicked || 0

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0"
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0"
  const unopenedRate = totalSent > 0 ? (100 - parseFloat(openRate)).toFixed(1) : "100.0"

  const formattedDate = selectedCampaign.sentAt 
    ? format(new Date(selectedCampaign.sentAt), "MMM dd, yyyy hh:mm a")
    : ""

  let statusText = ""
  if (selectedCampaign.status === "SENT") {
    statusText = `Sent - ${formattedDate}`
  } else if (selectedCampaign.status === "SCHEDULED") {
    statusText = "Scheduled"
  } else if (selectedCampaign.status === "SENDING") {
    statusText = "Sending"
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Recent Campaigns</h3>
        <Link href="/campaigns" className="text-xs text-blue-600 hover:underline font-semibold">
          View All
        </Link>
      </div>

      {/* Selector and Stats Container */}
      <div className="space-y-4">
        <div>
          <select 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm w-full max-w-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Stats Card */}
        <div className="pt-2">
          {/* Status badge */}
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{statusText}</span>
          </div>

          {/* Big number */}
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {totalSent.toLocaleString()} Messages Sent
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(parseFloat(openRate), 100)}%` }}
            />
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-700 dark:text-slate-300">{openRate}% - Opened</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800"></span>
              <span className="text-slate-700 dark:text-slate-300">{clickRate}% - Clicked</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
              <span className="text-slate-700 dark:text-slate-300">{unopenedRate}% - Unopened</span>
            </div>
          </div>
        </div>

        {/* Outlined Action Button */}
        <div className="pt-2 flex justify-end">
          <Link 
            href={`/campaigns/${selectedCampaign.id}/report`}
            className="border border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  )
}
