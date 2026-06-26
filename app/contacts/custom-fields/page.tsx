"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Database,
  Archive,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface CustomField {
  id: string
  key: string
  displayName: string
  type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "DROPDOWN"
  options: string[] | null
  isRequired: boolean
  defaultValue: string | null
  displayOrder: number
  isArchived: boolean
}

export default function CustomFieldsSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [fields, setFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Create / Edit Form states
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [type, setType] = useState<"TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "DROPDOWN">("TEXT")
  const [optionsStr, setOptionsStr] = useState("")
  const [isRequired, setIsRequired] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/contacts/custom-fields?includeArchived=true")
      if (response.ok) {
        const data = await response.json()
        setFields(data)
      }
    } catch (err) {
      console.error("Failed to load custom fields:", err)
      toast.error("Failed to load custom fields.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setError("")
    setEditingField(null)
    setDisplayName("")
    setType("TEXT")
    setOptionsStr("")
    setIsRequired(false)
    setShowForm(true)
  }

  const handleOpenEdit = (field: CustomField) => {
    setError("")
    setEditingField(field)
    setDisplayName(field.displayName)
    setType(field.type)
    setOptionsStr(field.options ? field.options.join(", ") : "")
    setIsRequired(field.isRequired)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError("Display Name is required.")
      return
    }

    setIsSubmitting(true)
    setError("")

    const options = type === "DROPDOWN" 
      ? optionsStr.split(",").map(o => o.trim()).filter(Boolean)
      : null

    const payload = {
      displayName: displayName.trim(),
      type,
      options,
      isRequired,
      displayOrder: editingField ? editingField.displayOrder : fields.length + 1
    }

    try {
      const url = editingField 
        ? `/api/contacts/custom-fields/${editingField.id}`
        : "/api/contacts/custom-fields"
      
      const response = await fetch(url, {
        method: editingField ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(editingField ? "Custom field updated." : "Custom field created successfully.")
        setShowForm(false)
        fetchFields()
      } else {
        setError(data.error || "Failed to save custom field")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom field? This will delete all saved values for this field across all contacts.")) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/custom-fields/${id}`, {
        method: "DELETE"
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Custom field deleted successfully.")
        fetchFields()
      } else {
        toast.error(data.error || "Failed to delete custom field.")
      }
    } catch (err) {
      console.error("Delete custom field error:", err)
      toast.error("An unexpected error occurred while deleting.")
    }
  }
  const handleToggleArchive = async (field: CustomField) => {
    const actionName = field.isArchived ? "restore" : "archive"
    if (!confirm(`Are you sure you want to ${actionName} this custom field?`)) {
      return
    }

    try {
      const response = await fetch(`/api/contacts/custom-fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !field.isArchived })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(`Custom field ${field.isArchived ? "restored" : "archived"} successfully.`)
        fetchFields()
      } else {
        toast.error(data.error || `Failed to ${actionName} custom field.`)
      }
    } catch (err) {
      console.error(`Toggle archive error:`, err)
      toast.error(`An unexpected error occurred.`)
    }
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/contacts" className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Custom Fields Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Define dynamic HubSpot/Zoho level properties for your contact database.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-500" />
                Workspace Fields ({fields.length})
              </h2>
              {!showForm && (
                <Button onClick={handleOpenCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom Field
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : fields.length === 0 ? (
              <Card className="text-center py-12 border-dashed border-slate-300 dark:border-slate-800">
                <CardContent className="pt-6">
                  <Database className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No custom fields defined yet.</p>
                  <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
                    Create your first custom field
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {fields.map((field) => (
                  <Card key={field.id} className={`hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800 ${field.isArchived ? "opacity-60 bg-slate-50/50" : ""}`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {field.displayName}
                          </span>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {field.type}
                          </Badge>
                          {field.isRequired && (
                            <Badge className="bg-rose-50 border-rose-200 text-rose-700 text-[10px]">
                              Required
                            </Badge>
                          )}
                          {field.isArchived && (
                            <Badge className="bg-amber-100 border-amber-300 text-amber-800 text-[10px]">
                              Archived
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Key: custom.{field.key}
                        </div>
                        {field.type === "DROPDOWN" && field.options && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-1 mt-2">
                            <span className="font-semibold mr-1">Options:</span>
                            {field.options.map(opt => (
                              <Badge key={opt} variant="outline" className="text-[10px] bg-slate-50">
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleArchive(field)}
                          className={field.isArchived ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}
                          title={field.isArchived ? "Restore Field" : "Archive Field"}
                        >
                          {field.isArchived ? <RefreshCw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(field)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(field.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Form Side panel */}
          {showForm && (
            <div className="lg:col-span-1">
              <Card className="border border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">
                    {editingField ? "Edit Custom Field" : "Create Custom Field"}
                  </CardTitle>
                  <CardDescription>
                    Configure property validations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="fieldName" className="text-xs font-semibold text-slate-700">Display Name</Label>
                      <Input 
                        id="fieldName" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        placeholder="e.g. Salary, Subscription Date"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="fieldType" className="text-xs font-semibold text-slate-700">Field Type</Label>
                      <select 
                        id="fieldType" 
                        value={type} 
                        onChange={(e) => setType(e.target.value as any)}
                        disabled={!!editingField}
                        className="w-full text-sm rounded-md border border-slate-300 p-2 mt-1 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="TEXT">Text</option>
                        <option value="NUMBER">Number</option>
                        <option value="DATE">Date</option>
                        <option value="BOOLEAN">Boolean</option>
                        <option value="DROPDOWN">Dropdown List</option>
                      </select>
                      {editingField && (
                        <p className="text-[10px] text-slate-500 mt-1">Field type cannot be modified after creation.</p>
                      )}
                    </div>

                    {type === "DROPDOWN" && (
                      <div className="space-y-1">
                        <Label htmlFor="fieldOptions" className="text-xs font-semibold text-slate-700">Dropdown Options *</Label>
                        <Input 
                          id="fieldOptions" 
                          value={optionsStr} 
                          onChange={(e) => setOptionsStr(e.target.value)} 
                          placeholder="e.g. VIP, Basic, Premium"
                          className="mt-1"
                          required
                        />
                        <p className="text-[10px] text-slate-500">Provide options as a comma-separated list.</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        id="fieldRequired" 
                        type="checkbox" 
                        checked={isRequired} 
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 focus:ring-blue-500 text-blue-600"
                      />
                      <Label htmlFor="fieldRequired" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Mark field as required during imports/creations
                      </Label>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        disabled={isSubmitting}
                        className="w-1/2 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        {isSubmitting ? "Saving..." : "Save Field"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}
