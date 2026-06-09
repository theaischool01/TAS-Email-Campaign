"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building, ShieldAlert } from "lucide-react"

const tabs = [
  { name: "Organisation", href: "/settings/org", icon: Building },
  { name: "Suppression List", href: "/settings/suppression", icon: ShieldAlert },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage your platform configuration and security</p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                  )}
                >
                  <tab.icon
                    className={cn(
                      isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                      "-ml-0.5 mr-2 h-5 w-5"
                    )}
                    aria-hidden="true"
                  />
                  <span>{tab.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="pt-4">
          {children}
        </div>
      </div>
    </DashboardLayout>
  )
}
