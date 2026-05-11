import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/next-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield } from "lucide-react"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const user = session.user

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name || "No name"}</h3>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-gray-600">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Account Type</p>
                      <p className="text-sm text-gray-600">
                        {user.role === "SUPER_ADMIN" ? "Administrator" : 
                         user.role === "CAMPAIGN_MANAGER" ? "Campaign Manager" : 
                         "Viewer"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Permissions</h3>
                  <div className="space-y-3">
                    {user.role === "SUPER_ADMIN" && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-900">Full System Access</p>
                            <p className="text-sm text-green-700">Complete control over all features and users</p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-900">User Management</p>
                            <p className="text-sm text-green-700">Create, edit, and delete user accounts</p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </>
                    )}
                    
                    {user.role === "CAMPAIGN_MANAGER" && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-900">Campaign Management</p>
                            <p className="text-sm text-blue-700">Create and manage email campaigns</p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Contact Management</p>
                            <p className="text-sm text-gray-600">Manage contact lists and segments</p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </>
                    )}
                    
                    {user.role === "VIEWER" && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Read-Only Access</p>
                          <p className="text-sm text-gray-700">View campaigns and analytics only</p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-600">Last updated recently</p>
                      </div>
                      <Badge variant="outline">Secure</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">Not configured</p>
                      </div>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
