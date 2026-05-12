"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  FileText, 
  Settings, 
  User,
  LogOut,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Mail, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER", "VIEWER"] },
  { name: "Contacts", href: "/contacts", icon: Users, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  { name: "Templates", href: "/templates", icon: FileText, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  { name: "Admin", href: "/admin", icon: Shield, roles: ["SUPER_ADMIN"] },
  { name: "Settings", href: "/settings/org", icon: Settings, roles: ["SUPER_ADMIN"] },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true
    return session?.user?.role && item.roles.includes(session.user.role)
  })

  return (
    <div className="flex h-full w-64 flex-shrink-0 flex-col bg-gray-900 fixed left-0 top-0">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Email Platform</h1>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-6 overflow-y-auto">
        <ul role="list" className="flex flex-1 flex-col space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800",
                    "group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
        <li className="mt-auto">
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center gap-x-4 text-sm">
              <div className="flex-1">
                <p className="text-white font-medium">{session?.user?.name}</p>
                <p className="text-gray-400 text-xs">{session?.user?.role}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-300 hover:text-white">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-300 hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </Link>
            </div>
          </div>
        </li>
      </nav>
    </div>
  )
}
