"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, Menu } from "lucide-react"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="ml-4 text-lg font-semibold text-gray-900">
              Welcome back, {session?.user?.name}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
