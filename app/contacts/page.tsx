"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  List,
  Settings,
  AlertCircle,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  SlidersHorizontal,
  Tags,
  X
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { getCreatedByText } from "@/lib/role-helpers"
import { FilterBuilder } from "@/components/shared/filter-builder/FilterBuilder"
import { SegmentRuleGroup } from "@/components/shared/filter-builder/types"
import { Checkbox } from "@/components/ui/checkbox"

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
  createdAt?: string
  updatedAt?: string
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

type SortBy = "createdAt" | "updatedAt" | "name" | "email" | "company" | "status"
type SortDir = "asc" | "desc"
type Density = "compact" | "comfortable" | "spacious"

interface ContactsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

const CONTACTS_PREF_KEY = "contacts-v3-preferences"

const sortOptions: Array<{ label: string; sortBy: SortBy; sortDir: SortDir }> = [
  { label: "Recently Added", sortBy: "createdAt", sortDir: "desc" },
  { label: "Oldest Added", sortBy: "createdAt", sortDir: "asc" },
  { label: "Recently Updated", sortBy: "updatedAt", sortDir: "desc" },
  { label: "Oldest Updated", sortBy: "updatedAt", sortDir: "asc" },
  { label: "Name A-Z", sortBy: "name", sortDir: "asc" },
  { label: "Name Z-A", sortBy: "name", sortDir: "desc" },
  { label: "Email A-Z", sortBy: "email", sortDir: "asc" },
  { label: "Email Z-A", sortBy: "email", sortDir: "desc" }
]

const densityClasses: Record<Density, string> = {
  compact: "px-4 py-2",
  comfortable: "px-5 py-3",
  spacious: "px-6 py-5"
}

function contactName(contact: Contact) {
  const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
  return name || "Unnamed Contact"
}

function contactInitials(contact: Contact) {
  const first = contact.firstName?.[0]
  const last = contact.lastName?.[0]
  const fallback = contact.email?.[0]
  return `${first || ""}${last || ""}`.trim().toUpperCase() || fallback?.toUpperCase() || "?"
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString()
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])
  const [visibleCustomFields, setVisibleCustomFields] = useState<string[]>([])
  const [columnSearch, setColumnSearch] = useState("")
  const [pagination, setPagination] = useState<ContactsPagination>({ page: 1, limit: 50, total: 0, pages: 0 })
  const [sortBy, setSortBy] = useState<SortBy>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [density, setDensity] = useState<Density>("comfortable")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  // Filter Builder States
  const [activeFilters, setActiveFilters] = useState<SegmentRuleGroup>({ conjunction: "AND", rules: [] })
  const [showFilterPopover, setShowFilterPopover] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONTACTS_PREF_KEY)
      if (!raw) return

      const preferences = JSON.parse(raw)
      if (Array.isArray(preferences.visibleCustomFields)) setVisibleCustomFields(preferences.visibleCustomFields)
      if (preferences.density) setDensity(preferences.density)
      if (preferences.limit) setPagination(prev => ({ ...prev, limit: preferences.limit }))
      if (preferences.sortBy) setSortBy(preferences.sortBy)
      if (preferences.sortDir) setSortDir(preferences.sortDir)
    } catch {
      // Ignore invalid local preferences.
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchTerm])

  useEffect(() => {
    try {
      localStorage.setItem(CONTACTS_PREF_KEY, JSON.stringify({
        visibleCustomFields,
        density,
        limit: pagination.limit,
        sortBy,
        sortDir
      }))
    } catch {
      // Preferences are best-effort only.
    }
  }, [visibleCustomFields, density, pagination.limit, sortBy, sortDir])

  const customFieldValueCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    contacts.forEach(c => {
      if (c.customFields) {
        Object.entries(c.customFields).forEach(([key, val]) => {
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            counts[key] = (counts[key] || 0) + 1
          }
        })
      }
    })
    return counts
  }, [contacts])

  const availableTags = useMemo(() => {
    if (tagOptions.length > 0) return tagOptions

    const tagsSet = new Set<string>()
    contacts.forEach(contact => {
      if (contact.tags) {
        contact.tags.split(",").forEach(tag => {
          const trimmed = tag.trim()
          if (trimmed) tagsSet.add(trimmed)
        })
      }
    })
    return Array.from(tagsSet).sort()
  }, [contacts, tagOptions])

  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactEmail, setContactEmail] = useState("")
  const [contactFirstName, setContactFirstName] = useState("")
  const [contactLastName, setContactLastName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactCompany, setContactCompany] = useState("")
  const [contactCity, setContactCity] = useState("")
  const [contactTags, setContactTags] = useState("")
  const [contactCustomValues, setContactCustomValues] = useState<Record<string, any>>({})
  const [contactModalError, setContactModalError] = useState("")
  const [isSavingContact, setIsSavingContact] = useState(false)

  const handleOpenCreateContact = () => {
    setEditingContact(null)
    setContactEmail("")
    setContactFirstName("")
    setContactLastName("")
    setContactPhone("")
    setContactCompany("")
    setContactCity("")
    setContactTags("")
    setContactCustomValues({})
    setContactModalError("")
    setShowContactModal(true)
  }

  const handleOpenEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactEmail(contact.email)
    setContactFirstName(contact.firstName || "")
    setContactLastName(contact.lastName || "")
    setContactPhone(contact.phone || "")
    setContactCompany(contact.company || "")
    setContactCity(contact.city || "")
    setContactTags(contact.tags || "")
    setContactCustomValues(contact.customFields || {})
    setContactModalError("")
    setShowContactModal(true)
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactEmail.trim()) {
      setContactModalError("Email is required.")
      return
    }

    setIsSavingContact(true)
    setContactModalError("")

    // Construct request body
    const payload = {
      email: contactEmail.trim(),
      firstName: contactFirstName.trim() || null,
      lastName: contactLastName.trim() || null,
      phone: contactPhone.trim() || null,
      company: contactCompany.trim() || null,
      city: contactCity.trim() || null,
      tags: contactTags.trim() || null,
      customFields: contactCustomValues
    }

    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : "/api/contacts"
      const method = editingContact ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        setShowContactModal(false)
        fetchAllContacts()
      } else {
        setContactModalError(data.error || "Failed to save contact.")
      }
    } catch (err) {
      setContactModalError("An unexpected error occurred.")
    } finally {
      setIsSavingContact(false)
    }
  }

  const fetchCustomFieldsSchema = async () => {
    try {
      const response = await fetch("/api/contacts/custom-fields")
      if (response.ok) {
        const data = await response.json()
        setCustomFieldsSchema(data)
      }
    } catch (error) {
      console.error("Failed to fetch custom fields schema:", error)
    }
  }

  const fetchTagOptions = async () => {
    try {
      const response = await fetch("/api/contacts/tags")
      if (response.ok) {
        const data = await response.json()
        setTagOptions(Array.isArray(data.tags) ? data.tags : [])
      }
    } catch (error) {
      console.error("Failed to fetch contact tags:", error)
    }
  }

  useEffect(() => {
    fetchContactLists()
    fetchCustomFieldsSchema()
    fetchTagOptions()
  }, [])

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

  const fetchAllContacts = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingContacts(true)
    try {
      const query = new URLSearchParams()
      query.set("page", pagination.page.toString())
      query.set("limit", pagination.limit.toString())
      query.set("sortBy", sortBy)
      query.set("sortDir", sortDir)
      if (debouncedSearchTerm.trim()) query.set("search", debouncedSearchTerm.trim())
      if (tagFilter.trim()) query.set("tag", tagFilter.trim())
      if (activeFilters.rules.length > 0) query.set("filters", JSON.stringify(activeFilters))

      const response = await fetch(`/api/contacts?${query.toString()}`, { signal })
      if (response.ok) {
        const data = await response.json()
        setContacts(Array.isArray(data.contacts) ? data.contacts : Array.isArray(data) ? data : [])
        setSelectedContacts([])
        const paginationPayload = data.pagination || {}
        setPagination(prev => ({
          page: paginationPayload.page || data.currentPage || prev.page,
          limit: paginationPayload.limit || data.limit || prev.limit,
          total: paginationPayload.total || data.totalContacts || 0,
          pages: paginationPayload.pages || data.totalPages || 0
        }))
        setSortBy(data.sortBy || paginationPayload.sortBy || sortBy)
        setSortDir(data.sortDir || paginationPayload.sortDir || sortDir)
      } else {
        console.error("Failed to fetch contacts, status:", response.status)
        setContacts([])
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return
      console.error("Failed to fetch contacts:", error)
      setContacts([])
    } finally {
      setIsLoadingContacts(false)
    }
  }, [activeFilters, debouncedSearchTerm, pagination.page, pagination.limit, sortBy, sortDir, tagFilter])

  useEffect(() => {
    if (activeTab !== "all") return

    const controller = new AbortController()
    fetchAllContacts(controller.signal)
    return () => controller.abort()
  }, [activeTab, fetchAllContacts])

  const filteredLists = useMemo(() => contactLists.filter((list) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [contactLists, searchTerm])

  const selectedContactSet = useMemo(() => new Set(selectedContacts), [selectedContacts])
  const allPageSelected = contacts.length > 0 && contacts.every(contact => selectedContactSet.has(contact.id))
  const sortLabel = sortOptions.find(option => option.sortBy === sortBy && option.sortDir === sortDir)?.label || "Custom Sort"
  const visibleCustomFieldSet = useMemo(() => new Set(visibleCustomFields), [visibleCustomFields])
  const searchableCustomFields = useMemo(() => customFieldsSchema.filter(field =>
    field.displayName?.toLowerCase().includes(columnSearch.toLowerCase()) ||
    field.key?.toLowerCase().includes(columnSearch.toLowerCase())
  ), [columnSearch, customFieldsSchema])
  const pageStart = pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total)
  const countLabel = debouncedSearchTerm || tagFilter || activeFilters.rules.length > 0
    ? `Showing ${pagination.total.toLocaleString()} Matching Contacts`
    : `${pagination.total.toLocaleString()} Contacts`

  const updateSort = (nextSortBy: SortBy, nextSortDir: SortDir) => {
    setSortBy(nextSortBy)
    setSortDir(nextSortDir)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleHeaderSort = (field: SortBy) => {
    if (sortBy !== field) {
      updateSort(field, "asc")
      return
    }

    if (sortDir === "asc") {
      updateSort(field, "desc")
      return
    }

    updateSort("createdAt", "desc")
  }

  const handleSelectAllPage = (checked: boolean | "indeterminate") => {
    setSelectedContacts(checked === true ? contacts.map(contact => contact.id) : [])
  }

  const toggleContactSelection = (contactId: string, checked: boolean | "indeterminate") => {
    setSelectedContacts(prev => {
      if (checked === true) return Array.from(new Set([...prev, contactId]))
      return prev.filter(id => id !== contactId)
    })
  }

  const resetServerPage = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const renderSortableHeader = (label: string, field: SortBy, className = "text-left") => (
    <button
      type="button"
      onClick={() => handleHeaderSort(field)}
      className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 transition hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-slate-400 dark:hover:text-white ${className}`}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown className={`h-3.5 w-3.5 ${sortBy === field ? "text-blue-600" : "text-gray-400"}`} />
    </button>
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
        setSelectedContacts((current) => current.filter(id => id !== contactId))
      }
    } catch (error) {
      console.error("Failed to delete contact:", error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return
    if (!confirm(`Delete ${selectedContacts.length} selected contacts?`)) return

    await Promise.all(selectedContacts.map(contactId =>
      fetch(`/api/contacts/${contactId}`, { method: "DELETE" })
    ))
    setSelectedContacts([])
    fetchAllContacts()
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{countLabel}</p>
            {activeTab === "all" && pagination.total > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {pageStart.toLocaleString()}-{pageEnd.toLocaleString()} of {pagination.total.toLocaleString()} Contacts
              </p>
            )}
          </div>
          {activeTab === "all" && (
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900" aria-label="Table density">
              {(["compact", "comfortable", "spacious"] as Density[]).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDensity(option)}
                  className={`rounded px-2.5 py-1 font-medium capitalize transition ${
                    density === option
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
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
                <select
                  value={tagFilter}
                  onChange={(e) => {
                    setTagFilter(e.target.value)
                    resetServerPage()
                  }}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-700 text-sm h-[38px]"
                >
                  <option value="">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === "all" && customFieldsSchema.length > 0 && (
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 text-sm py-2 h-[38px]">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Columns ({visibleCustomFields.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Custom Columns</span>
                      <Badge variant="secondary">{visibleCustomFields.length}</Badge>
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        placeholder="Search columns"
                        className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="mb-3 flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => setVisibleCustomFields(customFieldsSchema.map(field => field.key))}>
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => setVisibleCustomFields([])}>
                        Clear All
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                    {searchableCustomFields.map((field) => {
                      const isVisible = visibleCustomFields.includes(field.key)
                      return (
                        <DropdownMenuItem
                          key={field.key}
                          onSelect={(event) => event.preventDefault()}
                          onClick={() => {
                            setVisibleCustomFields(prev =>
                              isVisible ? prev.filter(k => k !== field.key) : [...prev, field.key]
                            )
                          }}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span>{field.displayName}</span>
                          {isVisible && <span className="text-blue-600 font-bold">✓</span>}
                        </DropdownMenuItem>
                      )
                    })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {activeTab === "all" && customFieldsSchema.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterPopover(!showFilterPopover)}
                  className="border-gray-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 text-sm py-2 h-[38px] flex items-center gap-2"
                >
                  <span>Filter</span>
                  {activeFilters.rules.length > 0 && (
                    <span className="bg-blue-600 text-white rounded-full text-xs px-2 py-0.5 font-bold">
                      {activeFilters.rules.length}
                    </span>
                  )}
                </Button>

                {showFilterPopover && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-4 z-50 shadow-lg">
                    <FilterBuilder
                      value={activeFilters}
                      onChange={(value) => {
                        setActiveFilters(value)
                        resetServerPage()
                      }}
                      customFields={customFieldsSchema}
                      customFieldValueCounts={customFieldValueCounts}
                      contacts={contacts}
                      allowSystemFields={false}
                    />
                  </div>
                )}
              </div>
            )}
            {activeTab === "all" && (
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 text-sm py-2 h-[38px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {sortOptions.map(option => (
                      <DropdownMenuItem
                        key={`${option.sortBy}-${option.sortDir}`}
                        onClick={() => updateSort(option.sortBy, option.sortDir)}
                        className="flex items-center justify-between"
                      >
                        {option.label}
                        {sortBy === option.sortBy && sortDir === option.sortDir && <Check className="h-4 w-4 text-blue-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contacts/custom-fields">
              <Button variant="outline" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                <Settings className="h-4 w-4 mr-2" />
                Custom Fields
              </Button>
            </Link>
            <Link href="/contacts/import">
              <Button className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </Button>
            </Link>
            <Button onClick={handleOpenCreateContact} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Contact
            </Button>
          </div>
        </div>

        {activeTab === "all" && selectedContacts.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm shadow-sm dark:border-blue-900 dark:bg-blue-950/40 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold text-blue-900 dark:text-blue-100">
              {selectedContacts.length} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleBulkDelete} className="border-red-200 text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Link href="/api/contacts/export">
                <Button type="button" variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </Link>
              <Button type="button" variant="outline" size="sm" disabled>
                <Tags className="h-4 w-4 mr-2" />
                Add Tags
              </Button>
              <Button type="button" variant="outline" size="sm" disabled>
                <X className="h-4 w-4 mr-2" />
                Remove Tags
              </Button>
              <Button type="button" variant="outline" size="sm" disabled>
                Move List
              </Button>
            </div>
          </div>
        )}

        {activeTab === "all" ? (
          isLoadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contacts Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms." : "No contacts are available yet."}
              </p>
            </div>
          ) : (
            <>
            <div className="space-y-3 md:hidden">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                  className="w-full rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                      {contactInitials(contact)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{contactName(contact)}</p>
                        <Badge variant="secondary" className="rounded-full text-[10px]">{contact.status}</Badge>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{contact.email}</p>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{contact.company || "-"}{contact.city ? `, ${contact.city}` : ""}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Card className="hidden dark:bg-slate-900 dark:border-slate-800 md:block">
              <CardContent className="p-0">
                <div className="max-h-[68vh] overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm dark:bg-slate-800">
                      <tr className="dark:border-slate-800">
                        <th className="w-12 px-4 py-3">
                          <Checkbox
                            checked={allPageSelected}
                            onCheckedChange={handleSelectAllPage}
                            aria-label="Select all contacts on this page"
                          />
                        </th>
                        <th className="w-14 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Avatar
                        </th>
                        <th className="px-5 py-3 text-left">
                          {renderSortableHeader("Name", "name")}
                        </th>
                        <th className="px-5 py-3 text-left">
                          {renderSortableHeader("Email", "email")}
                        </th>
                        <th className="hidden px-5 py-3 text-left md:table-cell">
                          {renderSortableHeader("Company", "company")}
                        </th>
                        <th className="hidden px-5 py-3 text-left lg:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Location
                        </th>
                        {visibleCustomFields.map(key => {
                          const field = customFieldsSchema.find(f => f.key === key)
                          return (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                              {field?.displayName || key}
                            </th>
                          )
                        })}
                        <th className="hidden px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400 lg:table-cell">
                          Tags
                        </th>
                        <th className="px-5 py-3 text-left">
                          {renderSortableHeader("Status", "status")}
                        </th>
                        <th className="hidden px-5 py-3 text-left xl:table-cell">
                          {renderSortableHeader("Created", "createdAt")}
                        </th>
                        <th className="hidden px-5 py-3 text-left xl:table-cell">
                          {renderSortableHeader("Updated", "updatedAt")}
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200">
                      {contacts.map((contact) => (
                        <tr
                          key={contact.id}
                          tabIndex={0}
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") router.push(`/contacts/${contact.id}`)
                          }}
                          className="group cursor-pointer border-slate-100 transition hover:bg-blue-50/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/70"
                        >
                          <td className={`${densityClasses[density]} w-12 whitespace-nowrap`} onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={selectedContactSet.has(contact.id)}
                              onCheckedChange={(checked) => toggleContactSelection(contact.id, checked)}
                              aria-label={`Select ${contact.email}`}
                            />
                          </td>
                          <td className={`${densityClasses[density]} w-14 whitespace-nowrap`}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                              {contactInitials(contact)}
                            </div>
                          </td>
                          <td className={`${densityClasses[density]} whitespace-nowrap`}>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{contactName(contact)}</div>
                          </td>
                          <td className={`${densityClasses[density]} whitespace-nowrap text-sm text-gray-600 dark:text-slate-300`}>
                            {contact.email}
                          </td>
                          <td className={`${densityClasses[density]} hidden whitespace-nowrap text-sm text-gray-900 dark:text-slate-300 md:table-cell`}>
                            {contact.company || "-"}
                          </td>
                          <td className={`${densityClasses[density]} hidden whitespace-nowrap text-sm text-gray-900 dark:text-slate-300 lg:table-cell`}>
                            {contact.city || "-"}
                          </td>
                          {visibleCustomFields.map(key => {
                            const val = contact.customFields?.[key]
                            return (
                              <td key={key} className={`${densityClasses[density]} whitespace-nowrap text-sm text-gray-900 dark:text-slate-300`}>
                                {val === true ? "Yes" : val === false ? "No" : val !== null && val !== undefined ? String(val) : "-"}
                              </td>
                            )
                          })}
                          <td className={`${densityClasses[density]} hidden whitespace-nowrap text-sm text-gray-900 dark:text-slate-300 lg:table-cell`}>
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
                          <td className={`${densityClasses[density]} whitespace-nowrap`}>
                            <Badge
                              variant={contact.status === "ACTIVE" ? "default" : "secondary"}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                contact.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {contact.status}
                            </Badge>
                          </td>
                          <td className={`${densityClasses[density]} hidden whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 xl:table-cell`}>
                            {formatDate(contact.createdAt)}
                          </td>
                          <td className={`${densityClasses[density]} hidden whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 xl:table-cell`}>
                            {formatDate(contact.updatedAt)}
                          </td>
                          <td className={`${densityClasses[density]} whitespace-nowrap text-right text-sm font-medium`} onClick={(event) => event.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleOpenEditContact(contact)
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800"
                                aria-label={`Edit ${contact.email}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteContact(contact.id)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-800"
                                aria-label={`Delete ${contact.email}`}
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
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-slate-600 dark:text-slate-300">
                Showing {pageStart.toLocaleString()}-{pageEnd.toLocaleString()} of {pagination.total.toLocaleString()}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-medium text-slate-500" htmlFor="contacts-limit">Rows per page</label>
                <select
                  id="contacts-limit"
                  value={pagination.limit}
                  onChange={(event) => setPagination(prev => ({ ...prev, page: 1, limit: Number(event.target.value) }))}
                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {[25, 50, 100, 200].map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <label className="text-xs font-medium text-slate-500" htmlFor="contacts-page">Page</label>
                <select
                  id="contacts-page"
                  value={pagination.page}
                  onChange={(event) => setPagination(prev => ({ ...prev, page: Number(event.target.value) }))}
                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {Array.from({ length: Math.max(1, pagination.pages) }, (_, index) => index + 1).map(page => (
                    <option key={page} value={page}>{page}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">of {Math.max(1, pagination.pages)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            </>
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
        {showContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl mx-auto shadow-xl relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 focus:outline-none"
              >
                <span className="text-lg font-semibold leading-none">✕</span>
              </button>
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">
                  {editingContact ? "Edit Contact" : "Create Contact"}
                </CardTitle>
                <CardDescription>
                  Configure profile details and dynamic CRM fields.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveContact} className="space-y-4">
                  {contactModalError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <span>{contactModalError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        disabled={!!editingContact}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone</Label>
                      <Input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone Number"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</Label>
                      <Input
                        type="text"
                        value={contactFirstName}
                        onChange={(e) => setContactFirstName(e.target.value)}
                        placeholder="First Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</Label>
                      <Input
                        type="text"
                        value={contactLastName}
                        onChange={(e) => setContactLastName(e.target.value)}
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Company</Label>
                      <Input
                        type="text"
                        value={contactCompany}
                        onChange={(e) => setContactCompany(e.target.value)}
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City</Label>
                      <Input
                        type="text"
                        value={contactCity}
                        onChange={(e) => setContactCity(e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tags (Comma-separated)</Label>
                      <Input
                        type="text"
                        value={contactTags}
                        onChange={(e) => setContactTags(e.target.value)}
                        placeholder="e.g. Lead, VIP, Student"
                      />
                    </div>
                  </div>

                  {customFieldsSchema.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Custom Fields</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customFieldsSchema.map((field) => {
                          const value = contactCustomValues[field.key]
                          return (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{field.displayName}</Label>
                              {field.type === "TEXT" && (
                                <Input
                                  value={value || ""}
                                  onChange={(e) => setContactCustomValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  placeholder={field.displayName}
                                />
                              )}
                              {field.type === "NUMBER" && (
                                <Input
                                  type="number"
                                  value={value !== undefined && value !== null ? value : ""}
                                  onChange={(e) => setContactCustomValues(prev => ({ ...prev, [field.key]: e.target.value === "" ? null : Number(e.target.value) }))}
                                  placeholder="0.00"
                                />
                              )}
                              {field.type === "DATE" && (
                                <Input
                                  type="date"
                                  value={value ? String(value).split('T')[0] : ""}
                                  onChange={(e) => setContactCustomValues(prev => ({ ...prev, [field.key]: e.target.value || null }))}
                                />
                              )}
                              {field.type === "BOOLEAN" && (
                                <div className="flex items-center gap-2 pt-2">
                                  <input
                                    type="checkbox"
                                    checked={!!value}
                                    onChange={(e) => setContactCustomValues(prev => ({ ...prev, [field.key]: e.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-slate-600 dark:text-slate-400">Yes / No</span>
                                </div>
                              )}
                              {field.type === "DROPDOWN" && (
                                <select
                                  value={value || ""}
                                  onChange={(e) => setContactCustomValues(prev => ({ ...prev, [field.key]: e.target.value || null }))}
                                  className="w-full text-sm rounded-md border border-slate-300 p-2 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select option...</option>
                                  {field.options && Array.isArray(field.options) && field.options.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowContactModal(false)}
                      disabled={isSavingContact}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSavingContact}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSavingContact ? "Saving..." : "Save Contact"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
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
