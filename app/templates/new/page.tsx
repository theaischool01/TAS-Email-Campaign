"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowLeft, Palette, Code, Eye } from "lucide-react"

export default function NewTemplatePage() {
  const { data: session } = useSession()
  const router = useRouter()

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"

  if (!session) {
    return null
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to create templates.</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <h1 className="text-xl font-semibold">Create Template</h1>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          {/* Coming Soon Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Template Creator Coming Soon</CardTitle>
              <CardDescription className="text-lg">
                Advanced email template design will be available in M3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Palette className="h-8 w-8 text-gray-400" />
                  <span>Visual editor</span>
                  <Badge variant="secondary" className="ml-2">M3</Badge>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Code className="h-8 w-8 text-gray-400" />
                  <span>HTML/CSS support</span>
                  <Badge variant="secondary" className="ml-2">M3</Badge>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Eye className="h-8 w-8 text-gray-400" />
                  <span>Live preview</span>
                  <Badge variant="secondary" className="ml-2">M3</Badge>
                </div>
              </div>
              
              <div className="border-t pt-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Coming in M3:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">🎨 Template Editor</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Drag-and-drop builder</li>
                      <li>• Rich text editing</li>
                      <li>• Image uploads</li>
                      <li>• Custom styling</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">📱 Responsive Design</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Mobile preview</li>
                      <li>• Desktop preview</li>
                      <li>• Tablet preview</li>
                      <li>• Cross-client testing</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Available in M3: Template Management
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
