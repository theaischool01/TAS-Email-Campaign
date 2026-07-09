"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Building, Save, Loader2, Mail, Phone, Globe, MapPin, Clock } from "lucide-react"
import { toast } from "sonner"

export default function OrgSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    orgName: "",
    orgLogo: "",
    supportEmail: "",
    phone: "",
    website: "",
    address: "",
    timezone: "UTC"
  })

  useEffect(() => {
    fetchSettings()
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/org")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSettings({
            orgName: result.data?.orgName || "",
            orgLogo: result.data?.orgLogo || "",
            supportEmail: result.data?.supportEmail || "",
            phone: result.data?.phone || "",
            website: result.data?.website || "",
            address: result.data?.address || "",
            timezone: result.data?.timezone || "UTC"
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Frontend validation
    if (!settings.orgName.trim() || settings.orgName.length < 2 || settings.orgName.length > 100) {
      toast.error("Organization Name is required and must be between 2 and 100 characters.")
      return
    }

    if (settings.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) {
      toast.error("Please enter a valid Support Email address.")
      return
    }

    if (settings.website) {
      try {
        new URL(settings.website)
      } catch (e) {
        toast.error("Please enter a valid Website URL (e.g., https://example.com).")
        return
      }
    }

    setIsSaving(true)
    
    try {
      const response = await fetch("/api/settings/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json().catch(() => ({}))
      if (response.ok) {
        toast.success("Organization settings updated successfully")
        fetchSettings()
        // Fire custom event to notify Sidebar/Header/WorkspacePanel of dynamic changes
        window.dispatchEvent(new Event("org-settings-updated"))
      } else {
        toast.error(result.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Save Error:", error)
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Settings</h1>
            <p className="text-gray-600 dark:text-slate-400">Configure your platform workspace identity and preferences</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:border-0 shadow-sm font-semibold">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Workspace Identity Settings */}
          <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <CardTitle className="dark:text-white">Workspace Identity</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">How your organization appears in the portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="dark:text-slate-300">Organization Name *</Label>
                  <Input 
                    id="orgName" 
                    value={settings.orgName} 
                    onChange={(e) => setSettings({...settings, orgName: e.target.value})}
                    placeholder="e.g. Acme Corp" 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgLogo" className="dark:text-slate-300">Logo URL</Label>
                  <Input 
                    id="orgLogo" 
                    value={settings.orgLogo || ""} 
                    onChange={(e) => setSettings({...settings, orgLogo: e.target.value})}
                    placeholder="https://example.com/logo.png" 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details & Info */}
          <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <CardTitle className="dark:text-white">Contact & Support Details</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">Manage public contact details for support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail" className="dark:text-slate-300">Support Email</Label>
                  <Input 
                    id="supportEmail" 
                    type="email"
                    value={settings.supportEmail} 
                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    placeholder="support@company.com" 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="dark:text-slate-300">Support Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={settings.phone} 
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX" 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="dark:text-slate-300">Website URL</Label>
                  <Input 
                    id="website" 
                    type="url"
                    value={settings.website} 
                    onChange={(e) => setSettings({...settings, website: e.target.value})}
                    placeholder="https://company.com" 
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="dark:text-slate-300">Office Address</Label>
                <Textarea 
                  id="address" 
                  value={settings.address} 
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                  placeholder="Street, City, State, Country" 
                  className="min-h-[100px] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <CardTitle className="dark:text-white">Regional Settings</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">Configure regional behavior of your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs space-y-2">
                <Label htmlFor="timezone" className="dark:text-slate-300">Timezone</Label>
                <select 
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="UTC">UTC (GMT+00:00)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT+05:30)</option>
                  <option value="America/New_York">America/New_York (GMT-05:00)</option>
                  <option value="Europe/London">Europe/London (GMT+00:00)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={isSaving} className="shadow-sm font-semibold">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Settings
            </Button>
          </div>
        </form>
      </div>
  )
}
