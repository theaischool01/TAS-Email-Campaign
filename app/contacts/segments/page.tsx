"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  Users, 
  Target, 
  Filter,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  Loader2
} from "lucide-react"

export default function SegmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    tags: ""
  })

  useEffect(() => {
    if (session) {
      fetchSegments()
    }
  }, [session])

  const fetchSegments = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/segments")
      const data = await res.json()
      if (data.success) {
        setSegments(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch segments:", error)
      toast.error("Failed to load segments")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSegment.name) {
      toast.error("Segment name is required")
      return
    }

    try {
      const criteria = {
        tags: newSegment.tags.split(",").map(t => t.trim()).filter(t => t)
      }

      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSegment.name,
          description: newSegment.description,
          criteria
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Segment created successfully")
        setIsCreating(false)
        setNewSegment({ name: "", description: "", tags: "" })
        fetchSegments()
      } else {
        toast.error(data.error || "Failed to create segment")
      }
    } catch (error) {
      console.error("Error creating segment:", error)
      toast.error("Error creating segment")
    }
  }

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"

  if (!session) return null

  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You don't have permission to manage segments.</p>
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
              <Link href="/contacts" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Segments</h1>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Segment
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isCreating ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create New Segment</CardTitle>
              <CardDescription>Define criteria to automatically group your contacts.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSegment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Segment Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. High Value Customers" 
                    value={newSegment.name}
                    onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    placeholder="e.g. Contacts with specific purchase history" 
                    value={newSegment.description}
                    onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 border-t pt-4 mt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Criteria
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Filter by Tags (comma separated)</Label>
                    <Input 
                      id="tags" 
                      placeholder="e.g. VIP, Customer, 2024" 
                      value={newSegment.tags}
                      onChange={(e) => setNewSegment(prev => ({ ...prev, tags: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Contacts matching ANY of these tags will be included.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit">Create Segment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : segments.length === 0 ? (
              <Card className="max-w-2xl mx-auto text-center py-12">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle>No segments created yet</CardTitle>
                  <CardDescription>
                    Segments allow you to group contacts dynamically based on their properties and behavior.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsCreating(true)}>Create Your First Segment</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segments.map((segment) => (
                  <Card key={segment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <Target className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardDescription className="line-clamp-2">{segment.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(segment.criteria as any)?.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Created {new Date(segment.createdAt).toLocaleDateString()}</span>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
