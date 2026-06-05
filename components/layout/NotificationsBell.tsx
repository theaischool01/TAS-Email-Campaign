"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  AlertOctagon 
} from "lucide-react"

interface Notification {
  id: string
  type: string
  message: string
  campaignName: string
  campaignId: string
  createdAt: string
  read: boolean
}

// Simple helper to calculate relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      console.error("Error fetching notifications:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)

    // Click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      clearInterval(interval)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleMarkAllRead = () => {
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sent":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
        )
      case "failed":
        return (
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <XCircle className="h-4 w-4" />
          </div>
        )
      case "scheduled":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        )
      case "bounced":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        )
      case "complaint":
        return (
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <AlertOctagon className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Bell className="h-4 w-4" />
          </div>
        )
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {/* Dropdown Container */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List Wrapper */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              // Loading Skeleton State
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex space-x-3 animate-pulse">
                    <div className="rounded-full bg-slate-100 h-8 w-8"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty State
              <div className="py-12 text-center text-slate-400 text-sm font-medium">
                No notifications yet
              </div>
            ) : (
              // Notifications List
              notifications.map((n) => (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors flex space-x-3">
                  {getNotificationIcon(n.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                        {n.campaignName}
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold">•</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
