"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { NotificationsBell } from "./NotificationsBell"
import { ThemeToggle } from "./ThemeToggle"
import { useState } from "react"
import { WorkspacePanel } from "./WorkspacePanel"
import { FAQDrawer } from "./FAQDrawer"

// Simple page title mapper based on pathname
function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard"
  if (pathname.startsWith("/campaigns")) return "Campaigns"
  if (pathname.startsWith("/contacts")) return "Audience & Contacts"
  if (pathname.startsWith("/templates")) return "Email Templates"
  if (pathname.startsWith("/settings")) return "Settings"
  if (pathname.startsWith("/profile")) return "Profile Settings"
  return "MailFlow Portal"
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isWorkspacePanelOpen, setIsWorkspacePanelOpen] = useState(false)
  const [isFAQOpen, setIsFAQOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Get initials for user avatar
  const getInitials = (name?: string | null) => {
    if (!name) return "A"
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  const initials = getInitials(session?.user?.name)
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0d1117]">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0d1117]">
        {/* Top Header Bar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 tracking-tight">{pageTitle}</h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <NotificationsBell />

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Profile Summary */}
            <div 
              onClick={() => setIsWorkspacePanelOpen(true)}
              className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline-block">
                {session?.user?.name || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0d1117] p-6">
          {children}
        </main>
      </div>

      {/* Workspace Center Panel */}
      <WorkspacePanel 
        isOpen={isWorkspacePanelOpen} 
        onClose={() => setIsWorkspacePanelOpen(false)} 
        onOpenFAQ={() => {
          setIsWorkspacePanelOpen(false)
          setIsFAQOpen(true)
        }}
      />

      {/* FAQ Drawer */}
      <FAQDrawer 
        isOpen={isFAQOpen}
        onClose={() => setIsFAQOpen(false)}
      />
    </div>
  )
}
