"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Mail, 
  Trash2, 
  Upload,
  User,
  Edit,
  AlertCircle
} from "lucide-react"
import { getCreatedByText } from "@/lib/role-helpers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

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
  customFields?: Record<string, any>
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

export default function ContactListDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [contactList, setContactList] = useState<ContactList | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState("")
  
  // Custom Fields Schema
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])
  const [visibleCustomFields, setVisibleCustomFields] = useState<string[]>([])
  
  // Load defaults once schema is fetched
  useEffect(() => {
    if (customFieldsSchema.length > 0 && visibleCustomFields.length === 0) {
      const defaults = ["state", "qualification", "stream", "address"];
      const activeKeys = customFieldsSchema.map(f => f.key);
      const initialVisible = defaults.filter(d => activeKeys.includes(d));
      
      if (initialVisible.length > 0) {
        setVisibleCustomFields(initialVisible);
      } else {
        setVisibleCustomFields(activeKeys.slice(0, 5));
      }
    }
  }, [customFieldsSchema])
  
  // Tag input states for Add Modal
  const [modalTags, setModalTags] = useState<string[]>([])
  const [tagInputText, setTagInputText] = useState("")
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  // Edit Modal States
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editCompany, setEditCompany] = useState("")
  const [editCity, setEditCity] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInputText, setEditTagInputText] = useState("")
  const [showEditTagDropdown, setShowEditTagDropdown] = useState(false)
  const [editCustomFields, setEditCustomFields] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [emailPermissions, setEmailPermissions] = useState({ canEditEmail: true, reason: "" })

  // Global cached tags state
  const [globalCachedTags, setGlobalCachedTags] = useState<string[]>([])

  const fetchCustomFieldsSchema = async () => {
    try {
      const response = await fetch("/api/contacts/custom-fields")
      if (response.ok) {
        const data = await response.json()
        setCustomFieldsSchema(data)
      }
    } catch (err) {
      console.error("Failed to load custom fields schema:", err)
    }
  }

  // Fetch global tags once when edit modal opens
  const fetchGlobalTags = async () => {
    try {
      const response = await fetch("/api/contacts/tags")
      if (response.ok) {
        const data = await response.json()
        if (data.tags) {
          setGlobalCachedTags(data.tags)
        }
      }
    } catch (err) {
      console.error("Failed to load global unique tags:", err)
    }
  }

  // Get all unique tags currently used in this list
  const uniqueSuggestions = Array.from(
    new Set(
      contacts
        .flatMap(c => (c.tags || "").split(","))
        .map(t => t.trim())
        .filter(t => t && !modalTags.includes(t))
    )
  )

  // Autocomplete tag suggestions filtered locally from global cache
  const filteredEditSuggestions = globalCachedTags.filter(
    tag => tag.toLowerCase().includes(editTagInputText.toLowerCase()) && !editTags.includes(tag)
  )

  useEffect(() => {
    if (params.id) {
      fetchContactList()
      fetchContacts()
      fetchCustomFieldsSchema()
    }
  }, [params.id])

  const fetchContactList = async () => {
    try {
      const response = await fetch(`/api/contacts/lists/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setContactList(data)
      }
    } catch (error) {
      console.error("Failed to fetch contact list:", error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/contacts/lists/${params.id}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append("tags", modalTags.join(","))
    
    // Build customFields object
    const customFieldsObj: Record<string, any> = {}
    customFieldsSchema.forEach(field => {
      const val = formData.get(`cf_${field.key}`)
      if (val !== null && val !== undefined) {
        if (field.type === "NUMBER") {
          customFieldsObj[field.key] = val === "" ? null : Number(val)
        } else if (field.type === "BOOLEAN") {
          customFieldsObj[field.key] = val === "true"
        } else {
          customFieldsObj[field.key] = val
        }
      }
    })
    formData.append("customFields", JSON.stringify(customFieldsObj))
    
    try {
      const response = await fetch(`/api/contacts/lists/${params.id}/contacts`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        setShowAddForm(false)
        setModalTags([])
        setTagInputText("")
        fetchContacts()
        e.currentTarget.reset()
      } else {
        setError(data.error || "Failed to add contact")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
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
        setContacts(contacts.filter(c => c.id !== contactId))
      }
    } catch (error) {
      console.error("Failed to delete contact:", error)
    }
  }

  // Open Edit modal, load permission logic from backend
  const handleOpenEditModal = async (contact: Contact) => {
    setEditError("")
    setIsSaving(false)
    setEditingContact(contact)
    setEditFirstName(contact.firstName || "")
    setEditLastName(contact.lastName || "")
    setEditEmail(contact.email || "")
    setEditPhone(contact.phone || "")
    setEditCompany(contact.company || "")
    setEditCity(contact.city || "")
    setEditStatus(contact.status || "")
    setEditTags(contact.tags ? contact.tags.split(",").map(t => t.trim()).filter(Boolean) : [])
    setEditTagInputText("")
    setEditCustomFields(contact.customFields || {})
    
    // Fetch global tags for local autocomplete caching
    fetchGlobalTags()

    try {
      const response = await fetch(`/api/contacts/${contact.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.permissions) {
          setEmailPermissions(data.permissions)
        }
      }
    } catch (err) {
      console.error("Failed to load email permissions:", err)
    }
  }

  const handleEditCustomFieldChange = (key: string, value: any) => {
    setEditCustomFields(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Handle Edit submission
  const handleEditContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContact) return

    setIsSaving(true)
    setEditError("")

    try {
      const payload = {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phone: editPhone,
        company: editCompany,
        city: editCity,
        status: editStatus,
        tags: editTags.join(","),
        customFields: editCustomFields
      }

      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Contact updated successfully.")
        setEditingContact(null)
        fetchContacts()
      } else {
        setEditError(data.error || "Failed to update contact")
      }
    } catch (err) {
      setEditError("An unexpected error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.company} ${contact.city}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

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
                <h1 className="text-xl font-semibold">
                  {contactList?.name || "Contact List"}
                </h1>
              </Link>
              {contactList && (
                <>
                  <Badge variant="secondary" className="ml-3">
                    {contactList._count.members} contacts
                  </Badge>
                  {contactList.owner && (
                    <div className="ml-4 flex items-center text-sm text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      <span>
                        Created by: {getCreatedByText(contactList.owner)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 text-sm"
                />
              </div>
              {customFieldsSchema.length > 0 && (
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="text-sm py-2 h-[38px]">
                        Columns ({visibleCustomFields.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50">
                      {customFieldsSchema.map((field) => {
                        const isVisible = visibleCustomFields.includes(field.key)
                        return (
                          <DropdownMenuItem
                            key={field.key}
                            onClick={() => {
                              setVisibleCustomFields(prev =>
                                isVisible ? prev.filter(k => k !== field.key) : [...prev, field.key]
                              )
                            }}
                            className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                          >
                            <span>{field.displayName}</span>
                            {isVisible && <span className="text-blue-600 font-bold">✓</span>}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <Link href="/contacts/import">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </Link>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
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
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contacts Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first contact"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      {visibleCustomFields.map(key => {
                        const field = customFieldsSchema.find(f => f.key === key)
                        return (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {field?.displayName || key}
                          </th>
                        )
                      })}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.company || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.city || "-"}
                        </td>
                        {visibleCustomFields.map(key => {
                          const val = contact.customFields?.[key]
                          return (
                            <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {val === true ? "Yes" : val === false ? "No" : val !== null && val !== undefined ? String(val) : "-"}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {contact.tags ? (
                              contact.tags.split(",").map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={contact.status === "ACTIVE" ? "default" : "secondary"}>
                            {contact.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(contact)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContact(contact.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Contact</CardTitle>
              <CardDescription>
                Add a contact to {contactList?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleAddContact} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Acme Corp" />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="New York" />
                </div>

                {/* Custom Fields Inputs */}
                {customFieldsSchema.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label htmlFor={`cf_${field.key}`} className="text-xs font-semibold text-slate-700">
                      {field.displayName}{field.isRequired && " *"}
                    </Label>
                    {field.type === "TEXT" && (
                      <Input id={`cf_${field.key}`} name={`cf_${field.key}`} placeholder={field.displayName} required={field.isRequired} className="mt-1" />
                    )}
                    {field.type === "NUMBER" && (
                      <Input id={`cf_${field.key}`} name={`cf_${field.key}`} type="number" placeholder="0" required={field.isRequired} className="mt-1" />
                    )}
                    {field.type === "DATE" && (
                      <Input id={`cf_${field.key}`} name={`cf_${field.key}`} type="date" required={field.isRequired} className="mt-1" />
                    )}
                    {field.type === "BOOLEAN" && (
                      <select id={`cf_${field.key}`} name={`cf_${field.key}`} required={field.isRequired} className="w-full text-sm rounded-md border border-slate-300 p-2 mt-1">
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    )}
                    {field.type === "DROPDOWN" && (
                      <select id={`cf_${field.key}`} name={`cf_${field.key}`} required={field.isRequired} className="w-full text-sm rounded-md border border-slate-300 p-2 mt-1">
                        <option value="">Select option...</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                <div className="relative">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 rounded-md min-h-[38px] bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    {modalTags.map((tag) => (
                      <Badge key={tag} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 border-0 text-xs px-2 py-0.5">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setModalTags(modalTags.filter(t => t !== tag))}
                          className="font-bold hover:text-red-600 ml-1 text-sm leading-none"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      placeholder={modalTags.length === 0 ? "Type tag & press Enter..." : ""}
                      value={tagInputText}
                      onChange={(e) => {
                        setTagInputText(e.target.value)
                        setShowTagDropdown(true)
                      }}
                      onFocus={() => setShowTagDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const tag = tagInputText.trim()
                          if (tag && !modalTags.includes(tag)) {
                            setModalTags([...modalTags, tag])
                            setTagInputText("")
                          }
                        }
                      }}
                      className="flex-1 outline-none text-sm min-w-[120px] border-0 p-0 focus:ring-0"
                    />
                  </div>
                  {showTagDropdown && uniqueSuggestions.filter(tag => tag.toLowerCase().includes(tagInputText.toLowerCase())).length > 0 && (
                    <div className="absolute z-50 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto w-full mt-1">
                      {uniqueSuggestions
                        .filter(tag => tag.toLowerCase().includes(tagInputText.toLowerCase()))
                        .map((tag) => (
                          <div
                            key={tag}
                            onMouseDown={() => {
                              if (!modalTags.includes(tag)) {
                                setModalTags([...modalTags, tag])
                                setTagInputText("")
                              }
                            }}
                            className="p-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700"
                          >
                            {tag}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Contact</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg mx-auto shadow-xl relative overflow-hidden transition-all bg-white rounded-xl border border-slate-200">
            {/* Modal Close (X) button */}
            <button
              type="button"
              onClick={() => setEditingContact(null)}
              aria-label="Close edit contact modal"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
            >
              <span className="text-lg font-semibold leading-none">✕</span>
            </button>

            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800">Edit Contact</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Update details for this contact
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleEditContactSubmit} className="space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName" className="text-xs font-semibold text-slate-700">First Name</Label>
                    <Input 
                      id="editFirstName" 
                      value={editFirstName} 
                      onChange={(e) => setEditFirstName(e.target.value)} 
                      placeholder="Enter first name" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName" className="text-xs font-semibold text-slate-700">Last Name</Label>
                    <Input 
                      id="editLastName" 
                      value={editLastName} 
                      onChange={(e) => setEditLastName(e.target.value)} 
                      placeholder="Enter last name" 
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="editEmail" className="text-xs font-semibold text-slate-700">Email *</Label>
                    {!emailPermissions.canEditEmail && (
                      <span className="text-xs text-amber-600" title="Email locked due to history">🔒</span>
                    )}
                  </div>
                  <Input 
                    id="editEmail" 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)} 
                    placeholder="Enter email address" 
                    required 
                    disabled={!emailPermissions.canEditEmail}
                    className={cn(
                      "mt-1 text-sm transition-all",
                      !emailPermissions.canEditEmail && "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed font-medium"
                    )}
                  />
                  {!emailPermissions.canEditEmail && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs leading-relaxed flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      <span>{emailPermissions.reason}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="editPhone" className="text-xs font-semibold text-slate-700">Phone</Label>
                  <Input 
                    id="editPhone" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                    placeholder="Enter phone number" 
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCompany" className="text-xs font-semibold text-slate-700">Company</Label>
                    <Input 
                      id="editCompany" 
                      value={editCompany} 
                      onChange={(e) => setEditCompany(e.target.value)} 
                      placeholder="Enter company name" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCity" className="text-xs font-semibold text-slate-700">City</Label>
                    <Input 
                      id="editCity" 
                      value={editCity} 
                      onChange={(e) => setEditCity(e.target.value)} 
                      placeholder="Enter city" 
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Custom Fields Edit Inputs */}
                {customFieldsSchema.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label htmlFor={`edit_cf_${field.key}`} className="text-xs font-semibold text-slate-700">
                      {field.displayName}{field.isRequired && " *"}
                    </Label>
                    {field.type === "TEXT" && (
                      <Input 
                        id={`edit_cf_${field.key}`} 
                        value={editCustomFields[field.key] || ""} 
                        onChange={(e) => handleEditCustomFieldChange(field.key, e.target.value)} 
                        placeholder={field.displayName} 
                        required={field.isRequired}
                        className="mt-1"
                      />
                    )}
                    {field.type === "NUMBER" && (
                      <Input 
                        id={`edit_cf_${field.key}`} 
                        type="number" 
                        value={editCustomFields[field.key] !== undefined && editCustomFields[field.key] !== null ? editCustomFields[field.key] : ""} 
                        onChange={(e) => handleEditCustomFieldChange(field.key, e.target.value === "" ? "" : Number(e.target.value))} 
                        placeholder="0" 
                        required={field.isRequired}
                        className="mt-1"
                      />
                    )}
                    {field.type === "DATE" && (
                      <Input 
                        id={`edit_cf_${field.key}`} 
                        type="date" 
                        value={editCustomFields[field.key] || ""} 
                        onChange={(e) => handleEditCustomFieldChange(field.key, e.target.value)} 
                        required={field.isRequired}
                        className="mt-1"
                      />
                    )}
                    {field.type === "BOOLEAN" && (
                      <select 
                        id={`edit_cf_${field.key}`} 
                        value={editCustomFields[field.key] ? "true" : "false"} 
                        onChange={(e) => handleEditCustomFieldChange(field.key, e.target.value === "true")}
                        required={field.isRequired}
                        className="w-full text-sm rounded-md border border-slate-300 p-2 mt-1"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    )}
                    {field.type === "DROPDOWN" && (
                      <select 
                        id={`edit_cf_${field.key}`} 
                        value={editCustomFields[field.key] || ""} 
                        onChange={(e) => handleEditCustomFieldChange(field.key, e.target.value)}
                        required={field.isRequired}
                        className="w-full text-sm rounded-md border border-slate-300 p-2 mt-1"
                      >
                        <option value="">Select option...</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                <div className="relative">
                  <Label className="text-xs font-semibold text-slate-700">Tags</Label>
                  <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 rounded-md min-h-[38px] bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent mt-1">
                    {editTags.map((tag) => (
                      <Badge key={tag} className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-medium transition-colors">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setEditTags(editTags.filter(t => t !== tag))}
                          className="font-bold hover:text-red-600 ml-1 text-sm leading-none"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      placeholder={editTags.length === 0 ? "Type tag & press Enter..." : ""}
                      value={editTagInputText}
                      onChange={(e) => {
                        setEditTagInputText(e.target.value)
                        setShowEditTagDropdown(true)
                      }}
                      onFocus={() => setShowEditTagDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEditTagDropdown(false), 250)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const tag = editTagInputText.trim()
                          if (tag && !editTags.includes(tag)) {
                            setEditTags([...editTags, tag])
                            setEditTagInputText("")
                          }
                        }
                      }}
                      className="flex-1 outline-none text-sm min-w-[120px] border-0 p-0 focus:ring-0"
                    />
                  </div>
                  {showEditTagDropdown && filteredEditSuggestions.length > 0 && (
                    <div className="absolute z-50 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto w-full mt-1">
                      {filteredEditSuggestions.map((tag) => (
                        <div
                          key={tag}
                          onMouseDown={() => {
                            if (!editTags.includes(tag)) {
                              setEditTags([...editTags, tag])
                              setEditTagInputText("")
                            }
                          }}
                          className="p-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700 transition-colors"
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Status</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="editStatus" 
                        value="ACTIVE" 
                        checked={editStatus === "ACTIVE"} 
                        onChange={() => setEditStatus("ACTIVE")}
                        disabled={editingContact.status === "BOUNCED" || editingContact.status === "COMPLAINED"}
                        className="h-4 w-4"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="editStatus" 
                        value="UNSUBSCRIBED" 
                        checked={editStatus === "UNSUBSCRIBED"} 
                        onChange={() => setEditStatus("UNSUBSCRIBED")}
                        disabled={editingContact.status === "BOUNCED" || editingContact.status === "COMPLAINED"}
                        className="h-4 w-4"
                      />
                      Unsubscribed
                    </label>
                    {(editingContact.status === "BOUNCED" || editingContact.status === "COMPLAINED") && (
                      <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1 select-none flex items-center gap-1">
                        🔒 Locked: {editingContact.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingContact(null)}
                    disabled={isSaving}
                    className="rounded-lg text-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
