"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Target, 
  Filter,
  Plus,
  Clock
} from "lucide-react"

export default function SegmentsPage() {
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
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to manage segments.</p>
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
              <Link href="/contacts" className="flex items-center text-gray-600 hover:text-gray-900">
                <Users className="h-4 w-4 mr-2" />
                <h1 className="text-xl font-semibold">Segments</h1>
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
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Segments Coming Soon</CardTitle>
              <CardDescription className="text-lg">
                Advanced contact segmentation will be available in the next update
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Filter className="h-8 w-8 text-gray-400" />
                  <span>Smart filtering based on</span>
                  <Badge variant="secondary" className="ml-2">Behavior</Badge>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Filter className="h-8 w-8 text-gray-400" />
                  <span>Engagement</span>
                  <Badge variant="secondary" className="ml-2">Activity</Badge>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Filter className="h-8 w-8 text-gray-400" />
                  <span>Demographics</span>
                  <Badge variant="secondary" className="ml-2">Location</Badge>
                </div>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <Filter className="h-8 w-8 text-gray-400" />
                  <span>Custom properties</span>
                  <Badge variant="secondary" className="ml-2">Tags</Badge>
                </div>
              </div>
              
              <div className="border-t pt-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Coming in Segments:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">🎯 Smart Segments</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Opened last email</li>
                      <li>• Never clicked</li>
                      <li>• Active users</li>
                      <li>• Unsubscribed users</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">📊 Engagement-Based</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• High open rate</li>
                      <li>• Recent activity</li>
                      <li>• Email engagement</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">🌍 Geographic</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• By country</li>
                      <li>• By city</li>
                      <li>• By region</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">🏷️ Custom Properties</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Custom tags</li>
                      <li>• Company size</li>
                      <li>• Industry</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  <Clock className="inline w-4 h-4 mr-2" />
                  Available in M3: Campaign Management
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/contacts">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Back to Contacts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
