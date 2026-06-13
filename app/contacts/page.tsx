"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Mail,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Upload,
  User,
  Users,
  List
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { getCreatedByText } from "@/lib/role-helpers"

interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  status: string
  tags?: string
}

interface ContactList {
  id: string
  name: string
  description?: string
  createdAt: string
  _count: {
    members: number
  }
  owner: {
    id: string
    name?: string
    email?: string
    role?: string
  }
}

function ContactsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"lists" | "all">(
    (searchParams.get("tab") as "lists" | "all") || "lists"
  )
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(true)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState("")

  useEffect(() => {
    fetchContactLists()
  }, [])

  useEffect(() => {
    if (activeTab === "all" && contacts.length === 0) {
      fetchAllContacts()
    }
  }, [activeTab])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "all" || tab === "lists") {
      setActiveTab(tab)
    } else {
      setActiveTab("lists")
    }
  }, [searchParams])

  const fetchContactLists = async () => {
    try {
      const response = await fetch("/api/contacts/lists")
      if (response.ok) {
        const payload = await response.json()
        const contactLists = payload.contactLists || payload.data || []
        setContactLists(Array.isArray(contactLists) ? contactLists : [])
      }
    } catch (error) {
      console.error("Failed to fetch contact lists:", error)
      setContactLists([])
    } finally {
      setIsLoadingLists(false)
    }
  }

  const fetchAllContacts = async () => {
    setIsLoadingContacts(true)
    try {
      const response = await fetch("/api/contacts")
      if (response.ok) {
        const data = await response.json()
        setContacts(Array.isArray(data.contacts) ? data.contacts : Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch contacts, status:", response.status)
        setContacts([])
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
      setContacts([])
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const filteredLists = contactLists.filter((list) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = `${contact.firstName || ""} ${contact.lastName || ""} ${contact.email || ""} ${contact.company || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    
    const matchesTag = !tagFilter || (contact.tags || "")
      .toLowerCase()
      .split(",")
      .some(t => t.trim().includes(tagFilter.toLowerCase().trim()))

    return matchesSearch && matchesTag
  })

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this contact list?")) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/lists/${listId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setContactLists((lists) => lists.filter((list) => list.id !== listId))
      }
    } catch (error) {
      console.error("Failed to delete contact list:", error)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setContacts((current) => current.filter((contact) => contact.id !== contactId))
      }
    } catch (error) {
      console.error("Failed to delete contact:", error)
    }
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 md:items-center md:flex-row md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Audience & Contacts</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">View your audience and manage contact lists.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => { setActiveTab("all"); router.replace("/contacts?tab=all") }}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white dark:bg-red-600 dark:text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="h-4 w-4" />
                All Contacts
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("lists"); router.replace("/contacts?tab=lists") }}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "lists"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <List className="h-4 w-4" />
                Manage Lists
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1 dark:bg-slate-900 dark:border-slate-800">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === "all" ? "Search contacts..." : "Search contact lists..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:border-slate-700 text-sm"
              />
            </div>
            {activeTab === "all" && (
              <div className="relative md:w-1/3">
                <input
                  type="text"
                  placeholder="Filter by tag..."
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:border-slate-700 text-sm"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contacts/import">
              <Button className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </Button>
            </Link>
            <Link href="/contacts/lists/new">
              <Button className="dark:bg-red-600 dark:text-white dark:hover:bg-red-700 dark:border-0">
                <Plus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </Link>
          </div>
        </div>

        {activeTab === "all" ? (
          isLoadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contacts Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms." : "No contacts are available yet."}
              </p>
            </div>
          ) : (
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                      <tr className="dark:border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200">
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/30">
                          <td className="px-6 py-4 whitespace-nowrap dark:bg-slate-900">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {contact.firstName || ""} {contact.lastName || ""}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-slate-400">{contact.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300 dark:bg-slate-900">
                            {contact.company || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300 dark:bg-slate-900">
                            {contact.city || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300 dark:bg-slate-900">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {contact.tags ? (
                                contact.tags.split(",").map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400 dark:text-slate-600">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap dark:bg-slate-900">
                            <Badge
                              variant={contact.status === "ACTIVE" ? "default" : "secondary"}
                              className="dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                            >
                              {contact.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium dark:bg-slate-900">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : isLoadingLists ? (
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
              <Card key={list.id} className="hover:shadow-lg transition-shadow dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{list.name}</CardTitle>
                    {list.description && (
                      <CardDescription className="text-gray-600 dark:text-slate-400">{list.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">{list._count.members} contacts</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white dark:hover:bg-slate-800">
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {list.owner && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-slate-400">
                        <User className="h-3 w-3 mr-1" />
                        <span>Created by: {getCreatedByText(list.owner)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Created {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                      <Link href={`/contacts/lists/${list.id}`}>
                        <Button variant="outline" size="sm" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
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
    </DashboardLayout>
  )
}

export default function ContactsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <ContactsPage />
    </Suspense>
  )
}
