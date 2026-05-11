"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Building, Mail, Server, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function OrgSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    orgName: "",
    orgLogo: "",
    defaultFromEmail: "",
    defaultFromName: "",
    awsAccessKey: "",
    awsSecretKey: "",
    awsRegion: "us-east-1"
  })

  useEffect(() => {
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== undefined) {
      router.push("/dashboard")
      return
    }
    fetchSettings()
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/org")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSettings(result.data)
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
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/settings/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        toast.success("Settings updated successfully")
      } else {
        toast.error("Failed to update settings")
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
            <h1 className="text-2xl font-bold text-gray-900">Organisation Settings</h1>
            <p className="text-gray-600">Configure your platform identity and delivery providers</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <CardTitle>Identity</CardTitle>
              </div>
              <CardDescription>How your organisation appears to users and recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organisation Name</Label>
                  <Input 
                    id="orgName" 
                    value={settings.orgName} 
                    onChange={(e) => setSettings({...settings, orgName: e.target.value})}
                    placeholder="e.g. Acme Corp" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgLogo">Logo URL</Label>
                  <Input 
                    id="orgLogo" 
                    value={settings.orgLogo || ""} 
                    onChange={(e) => setSettings({...settings, orgLogo: e.target.value})}
                    placeholder="https://example.com/logo.png" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <CardTitle>Email Defaults</CardTitle>
              </div>
              <CardDescription>Default sender information for new campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultFromName">Default From Name</Label>
                  <Input 
                    id="defaultFromName" 
                    value={settings.defaultFromName || ""} 
                    onChange={(e) => setSettings({...settings, defaultFromName: e.target.value})}
                    placeholder="e.g. Marketing Team" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultFromEmail">Default From Email</Label>
                  <Input 
                    id="defaultFromEmail" 
                    type="email"
                    value={settings.defaultFromEmail || ""} 
                    onChange={(e) => setSettings({...settings, defaultFromEmail: e.target.value})}
                    placeholder="hello@yourdomain.com" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AWS SES Config */}
          <Card className="border-blue-100 bg-blue-50/10">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-blue-600" />
                <CardTitle>AWS SES Configuration</CardTitle>
              </div>
              <CardDescription>Connect your AWS SES account for email delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Security Note</p>
                  <p>These credentials are used for email delivery. Ensure the IAM user has <code className="bg-amber-100 px-1 rounded">ses:SendRawEmail</code> permissions.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="awsAccessKey">AWS Access Key ID</Label>
                  <Input 
                    id="awsAccessKey" 
                    value={settings.awsAccessKey || ""} 
                    onChange={(e) => setSettings({...settings, awsAccessKey: e.target.value})}
                    placeholder="AKIA..." 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awsSecretKey">AWS Secret Access Key</Label>
                  <Input 
                    id="awsSecretKey" 
                    type="password"
                    value={settings.awsSecretKey || ""} 
                    onChange={(e) => setSettings({...settings, awsSecretKey: e.target.value})}
                    placeholder="••••••••••••••••••••" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awsRegion">AWS Region</Label>
                  <Input 
                    id="awsRegion" 
                    value={settings.awsRegion || ""} 
                    onChange={(e) => setSettings({...settings, awsRegion: e.target.value})}
                    placeholder="us-east-1" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Settings
            </Button>
          </div>
        </form>
      </div>
  )
}
