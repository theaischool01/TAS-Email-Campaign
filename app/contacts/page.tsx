"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  Mail, 
  Upload, 
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User
} from "lucide-react"
import { formatUserName, getCreatedByText } from "@/lib/role-helpers"

interface ContactList {
  id: string
  name: string
  description?: string
  _count: {
    members: number
  }
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function ContactsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"

  useEffect(() => {
    fetchContactLists()
  }, [])

  const fetchContactLists = async () => {
    try {
      const response = await fetch("/api/contacts/lists")
      if (response.ok) {
        const payload = await response.json()
        const contactLists = 
          payload.contactLists || 
          payload.data || 
          []
        
        setContactLists(Array.isArray(contactLists) ? contactLists : [])
      }
    } catch (error) {
      console.error("Failed to fetch contact lists:", error)
      setContactLists([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLists = (Array.isArray(contactLists) ? contactLists : []).filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this contact list?")) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/lists/${listId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setContactLists(lists => lists.filter(list => list.id !== listId))
      }
    } catch (error) {
      console.error("Failed to delete contact list:", error)
    }
  }

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
            <p className="text-gray-600">You don't have permission to access contacts.</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Contact Lists</h1>
              <p className="text-sm text-gray-600">Manage your mailing lists and contacts</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contact lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {(isAdmin || isManager) && (
                <Link href="/contacts/import">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Contacts
                  </Button>
                </Link>
              )}
              <Link href="/contacts/lists/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contact Lists</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first contact list.</p>
            <Link href="/contacts/lists/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Contact List
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">{list.name}</CardTitle>
                    {list.description && (
                      <CardDescription className="text-gray-600">{list.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">
                      {list._count.members} contacts
                    </Badge>
                    {(isAdmin || isManager) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contacts/lists/${list.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Contacts
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename List
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteList(list.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Created By Information */}
                    {(isAdmin || list.owner.id === session?.user?.id) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span>
                          Created by: {getCreatedByText(list.owner)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Created {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                      <Link href={`/contacts/lists/${list.id}`}>
                        <Button variant="outline" size="sm">
                          View Contacts
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
