"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  X, 
  User, 
  LogOut, 
  MapPin, 
  Mail, 
  Phone, 
  BookOpen, 
  HelpCircle,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Building
} from "lucide-react"

interface WorkspacePanelProps {
  isOpen: boolean
  onClose: () => void
  onOpenFAQ: () => void
}

export function WorkspacePanel({ isOpen, onClose, onOpenFAQ }: WorkspacePanelProps) {
  const { data: session } = useSession()

  // State to cache organization settings and avoid redundant calls on drawer toggles
  const [orgData, setOrgData] = useState({
    orgName: "",
    orgLogo: "",
    supportEmail: "",
    phone: "",
    website: "",
    address: "",
    timezone: "UTC"
  })
  const [hasLoaded, setHasLoaded] = useState(false)

  const fetchOrgData = async () => {
    try {
      const response = await fetch("/api/settings/org")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setOrgData({
            orgName: result.data.orgName || "",
            orgLogo: result.data.orgLogo || "",
            supportEmail: result.data.supportEmail || "",
            phone: result.data.phone || "",
            website: result.data.website || "",
            address: result.data.address || "",
            timezone: result.data.timezone || "UTC"
          })
          setHasLoaded(true)
        }
      }
    } catch (error) {
      console.error("WorkspacePanel failed to fetch org data:", error)
    }
  }

  // Load only when opened and local state is empty/stale
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      fetchOrgData()
    }
  }, [isOpen, hasLoaded])

  // Re-fetch automatically if org settings are updated in Settings page
  useEffect(() => {
    const handleOrgUpdate = () => {
      fetchOrgData()
    }
    window.addEventListener("org-settings-updated", handleOrgUpdate)
    return () => {
      window.removeEventListener("org-settings-updated", handleOrgUpdate)
    }
  }, [])

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        {/* Semi-transparent dark overlay */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-xs" />
        
        {/* Right-aligned panel container */}
        <DialogPrimitive.Content 
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 focus:outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right duration-200"
        >
          {/* Header (Sticky) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Workspace Center</DialogTitle>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4.5 w-4.5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* Section 1: User Profile Details */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/10">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {session?.user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {session?.user?.email || "admin@theaischool.co"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <Link href="/profile" onClick={onClose} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-[10px] font-semibold h-9 gap-1 dark:bg-slate-800 dark:border-slate-700 px-1">
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Button>
                </Link>
                <Link href="/settings/org" onClick={onClose} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-[10px] font-semibold h-9 gap-1 dark:bg-slate-800 dark:border-slate-700 px-1">
                    <Building className="h-3.5 w-3.5" />
                    Settings
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="w-full text-[10px] font-semibold h-9 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 dark:bg-slate-800 dark:border-slate-700 px-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Section 2: Organization Info */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Organization
              </h3>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Organization</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {orgData.orgName || "Organization Not Configured"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Role</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Administrator
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Active Workspace</span>
                  <span className="font-bold text-slate-800 dark:text-slate-300">Production</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Timezone</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{orgData.timezone}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Subscription Status */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Subscription Plan
              </h3>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-950 dark:text-white">Growth Plan</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Usage statistics unavailable</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200/50 px-2 py-0.5 rounded-full uppercase dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20">
                    Billing Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Resources Links */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Platform Resources
              </h3>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 divide-y divide-slate-100 dark:divide-slate-800">
                <a href="#" className="flex items-center justify-between p-3 text-sm font-bold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Documentation
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
                <button onClick={onOpenFAQ} className="w-full flex items-center justify-between p-3 text-sm font-bold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-purple-500" />
                    FAQ Library
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Section 5: Direct Support Info */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Help & Support
              </h3>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start space-x-3.5">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500">Office Location</h4>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {orgData.address || "T-Hub 2.0, Knowledge City,\nHyderabad, Telangana"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500">Support Email</h4>
                    <a href={`mailto:${orgData.supportEmail || "support@theaischool.co"}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      {orgData.supportEmail || "support@theaischool.co"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500">Support Hotline</h4>
                    <a href={`tel:${orgData.phone || "+919030906584"}`} className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors">
                      {orgData.phone || "+91 90309 06584"}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`mailto:${orgData.supportEmail || "support@theaischool.co"}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-center"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Support
                  </a>
                  <a
                    href={`tel:${orgData.phone || "+919030906584"}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Support
                  </a>
                </div>
              </div>
            </div>

            {/* Section 6: Connect With Us Socials */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Connect With Us
              </h3>
              <div className="flex justify-between gap-2">
                <a
                  href="https://www.linkedin.com/company/theaischool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  title="LinkedIn"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@the-ai-school"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-all"
                  title="YouTube"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                    <polygon points="10 15 15 12 10 9" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/the_aischool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 text-slate-500 hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-400 transition-all"
                  title="Instagram"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://x.com/TheAI_SCHOOL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-900 hover:bg-slate-100 dark:hover:border-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
                  title="Twitter / X"
                >
                  <span className="font-bold text-xs">X</span>
                </a>
                <a
                  href="https://www.facebook.com/people/Theaischool/61558962466200/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  title="Facebook"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* Footer (Sticky) */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 flex justify-between items-center">
            <span>MailFlow v1.0</span>
            <span>© The AI School</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
