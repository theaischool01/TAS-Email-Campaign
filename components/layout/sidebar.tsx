"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  FileText, 
  Settings, 
  User,
  LogOut,
  Menu,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Mail },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Settings", href: "/settings/org", icon: Settings },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleCollapse = () => {
    const nextState = !collapsed
    setCollapsed(nextState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(nextState))
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

  return (
    <div className={cn(
      "flex h-screen flex-shrink-0 flex-col bg-[#1a1f2e] border-r border-slate-700/50 sticky top-0 transition-all duration-300",
      collapsed ? "w-14" : "w-56"
    )}>
      {/* Header and Toggle */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-500 shrink-0" />
            <span className="text-lg font-bold text-white tracking-tight">MailFlow</span>
          </div>
        )}
        {collapsed && (
          <Mail className="h-6 w-6 text-blue-500 mx-auto shrink-0" />
        )}
      </div>

      {/* Collapse Action Button */}
      <div className="px-2 py-2 border-b border-slate-700/30 flex justify-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-2 py-4 overflow-y-auto">
        <ul role="list" className="flex flex-col space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800",
                    "group flex items-center rounded-lg p-2 text-sm leading-6 font-semibold transition-all duration-150",
                    collapsed ? "justify-center" : "gap-x-3"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* User profile bottom section */}
        <div className="mt-auto border-t border-slate-700/50 pt-4 flex flex-col space-y-2">
          <div className={cn(
            "flex items-center gap-x-3 px-2 py-1 text-sm text-slate-300",
            collapsed && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate text-xs">{session?.user?.name || "Admin User"}</p>
                <p className="text-slate-500 text-[10px]">Admin</p>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <Link href="/profile" title={collapsed ? "Profile" : undefined}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-8",
                  collapsed ? "justify-center px-0" : "px-2"
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2 text-xs">Profile</span>}
              </Button>
            </Link>
            
            <Link href="/api/auth/signout" title={collapsed ? "Sign out" : undefined}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-8",
                  collapsed ? "justify-center px-0" : "px-2"
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2 text-xs">Sign out</span>}
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
