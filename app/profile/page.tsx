"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    if (session) {
      setName(session.user?.name || "")
      setIsLoading(false)
    }
  }, [session])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || name.length < 2 || name.length > 50) {
      toast.error("Name must be between 2 and 50 characters.")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        toast.success("Profile updated successfully")
        // Dynamically update next-auth session client-side
        await update({ name: name.trim() })
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile Save Error:", error)
      toast.error("An error occurred while updating profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  const user = session?.user || { name: "", email: "", role: "ADMIN" }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="text-gray-600 dark:text-slate-400">Manage your personal account credentials</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:border-0 shadow-sm font-semibold">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Side Card */}
          <div className="lg:col-span-1">
            <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="dark:text-white">Profile Details</CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Your identity and system role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {name ? name.substring(0, 2).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white truncate max-w-[150px]">{name || "No name"}</h3>
                    <Badge variant="secondary" className="mt-0.5">Admin</Badge>
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px] mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Role</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">System Administrator</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Tier</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        Enterprise Owner
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form & Settings Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="dark:text-white">Edit Profile Details</CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Update your user profile display name
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="dark:text-slate-300">Display Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name" 
                      className="max-w-md dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <Label className="dark:text-slate-300">Email Address (Read-only)</Label>
                    <Input 
                      value={user.email || ""} 
                      disabled 
                      className="bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/80 dark:text-slate-400"
                    />
                    <p className="text-xs text-slate-400 mt-1">Email verification is managed by security administrators.</p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="dark:text-white">Security & MFA</CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Manage login keys and two-factor configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-300">Account Password</p>
                    <p className="text-xs text-slate-400 mt-0.5">Last changed recently</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 bg-green-50/20 border-green-500/20">Secure</Badge>
                </div>
                <div className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-300">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-400 mt-0.5">Not configured</p>
                  </div>
                  <Badge variant="outline" className="text-slate-500 dark:text-slate-400">Disabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
