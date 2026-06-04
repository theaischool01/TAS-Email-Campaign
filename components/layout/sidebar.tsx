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
  LogOut
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

  return (
    <div className="flex h-screen w-64 flex-shrink-0 flex-col bg-gray-900 sticky top-0">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Email Platform</h1>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-6 overflow-y-auto">
        <ul role="list" className="flex flex-col space-y-2">
          {navigation.map((item) => {
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
        <div className="mt-auto border-t border-gray-800 pt-4">
          <div className="flex items-center gap-x-4 text-sm">
            <div className="flex-1">
              <p className="text-white font-medium">{session?.user?.name}</p>
              <p className="text-gray-400 text-xs">Admin</p>
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
      </nav>
    </div>
  )
}
