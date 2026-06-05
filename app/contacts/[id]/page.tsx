"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Tag,
  Edit,
  Trash2
} from "lucide-react"

interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  tags?: string
  status: string
  createdAt: string
}

interface ContactList {
  id: string
  name: string
  description?: string
  ownerId: string
}

export default function ContactDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchContact()
    }
  }, [params.id])

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setContact(data)
      } else {
        setError(data.error || "Failed to fetch contact")
      }
    } catch (error) {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteContact = async () => {
    if (!contact) return

    if (!confirm("Are you sure you want to delete this contact?")) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/${params.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        router.push("/contacts")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete contact")
      }
    } catch (error) {
      setError("An error occurred")
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/contacts" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <h1 className="text-xl font-semibold">Contact Details</h1>
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
        ) : error ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => setError("")}>Try Again</Button>
            </CardContent>
          </Card>
        ) : contact ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Basic contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{contact.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <Badge variant={contact.status === "ACTIVE" ? "default" : "secondary"}>
                      {contact.status}
                    </Badge>
                  </div>
                </div>
                
                {(contact.firstName || contact.lastName) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                  </div>
                )}
                
                {contact.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{contact.phone}</p>
                  </div>
                )}
                
                {contact.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="text-gray-900">{contact.company}</p>
                  </div>
                )}
                
                {contact.city && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">{contact.city}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <p className="text-gray-900">{(contact as any).source || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Added</label>
                  <p className="text-gray-900">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Lists Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Lists</CardTitle>
                <CardDescription>Lists this contact belongs to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    This contact belongs to {(contact as any).contactLists?.length || 0} list(s)
                  </p>
                  <div className="space-y-2">
                    {(contact as any).contactLists?.map((list: ContactList) => (
                      <div key={list.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{list.name}</h4>
                          {list.description && (
                            <p className="text-sm text-gray-600">{list.description}</p>
                          )}
                        </div>
                        <Link href={`/contacts/lists/${list.id}`}>
                          <Button variant="outline" size="sm">View List</Button>
                        </Link>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No contact lists found</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Manage this contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Contact
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleDeleteContact}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Not Found</h3>
            <p className="text-gray-600 mb-4">The contact you're looking for doesn't exist.</p>
            <Link href="/contacts">
              <Button>Back to Contacts</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
