"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Check,
  UserCheck,
  ShieldCheck,
  Database,
  ChevronRight,
  Settings,
  HelpCircle,
  X
} from "lucide-react"
// @ts-ignore
import Papa from "papaparse"

export default function ImportContactsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Base State
  const [file, setFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState<string>("")
  const [contactLists, setContactLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [isCreatingNewList, setIsCreatingNewList] = useState<boolean>(false)
  const [newListName, setNewListName] = useState<string>("")
  const [loadingLists, setLoadingLists] = useState(false)
  const [error, setError] = useState("")

  // Wizard Steps:
  // 0: Upload & List Select
  // 1: Column Mapping Grid
  // 2: Inline Custom Fields Configuration
  // 3: Execution Progress
  // 4: Summary Results
  const [wizardStep, setWizardStep] = useState<number>(0)

  // CSV Analysis Response
  const [analysis, setAnalysis] = useState<{
    totalRows: number
    columns: Array<{
      header: string
      suggestion: { type: string; field?: string; fieldId?: string } | null
    }>
  } | null>(null)

  // Mappings constructed by user
  const [userMappings, setUserMappings] = useState<Record<string, any>>({})

  // Custom Fields to create inline
  const [inlineFields, setInlineFields] = useState<Record<string, {
    displayName: string
    fieldType: string
    options: string[]
    isRequired: boolean
  }>>({})

  // Custom Fields available in tenant
  const [tenantCustomFields, setTenantCustomFields] = useState<any[]>([])

  // Modal and pending field creation states
  const [showCreateFieldModal, setShowCreateFieldModal] = useState(false)
  const [pendingMappingHeader, setPendingMappingHeader] = useState("")
  const [newFieldDisplayName, setNewFieldDisplayName] = useState("")
  const [newFieldType, setNewFieldType] = useState("TEXT")
  const [newFieldOptions, setNewFieldOptions] = useState("")
  const [modalError, setModalError] = useState("")

  // Import options
  const [autoCreateDropdownOptions, setAutoCreateDropdownOptions] = useState(true)

  // Progress/Results State
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<{
    total: number
    newContactsCreated: number
    existingContactsUpdated: number
    existingContactsAddedToList: number
    alreadyInList: number
    ignored: number
    failed: number
  } | null>(null)
  const [failedRows, setFailedRows] = useState<Array<{ row: number; email?: string; error: string }>>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch available contact lists and custom fields
  useEffect(() => {
    if (session) {
      setLoadingLists(true)
      Promise.all([
        fetch("/api/contacts/lists").then((res) => res.json()),
        fetch("/api/contacts/custom-fields").then((res) => res.json())
      ])
        .then(([listsData, fieldsData]) => {
          if (listsData.success && listsData.contactLists) {
            setContactLists(listsData.contactLists)
          }
          if (Array.isArray(fieldsData)) {
            setTenantCustomFields(fieldsData)
          }
        })
          .catch((err) => console.error("Error loading import resources:", err))
          .finally(() => setLoadingLists(false))
    }
  }, [session])

  const processFile = async (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setError('Please select a CSV or Excel (.xlsx, .xls) file')
      return
    }
    
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB')
      return
    }

    setError("")
    setResults(null)

    if (name.endsWith('.csv')) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (text) {
          setCsvText(text)
        }
      }
      reader.readAsText(selectedFile)
    } else {
      setFile(selectedFile) // Set the display file first
      // Parse Excel file using xlsx library dynamically
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const XLSX = await import("xlsx")
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const csvTextResult = XLSX.utils.sheet_to_csv(worksheet)
          
          setCsvText(csvTextResult)
          // Create a virtual CSV file to pass to the upload analyzer
          const csvFile = new File(
            [csvTextResult],
            selectedFile.name.replace(/\.xlsx?$/, '.csv'),
            { type: 'text/csv' }
          )
          setFile(csvFile)
        } catch (err: any) {
          console.error("Excel parse error:", err)
          setError("Failed to parse Excel file: " + err.message)
        }
      }
      reader.readAsArrayBuffer(selectedFile)
    }
  }

  // Step 1 -> Step 2: Trigger /api/contacts/import/analyze
  const handleAnalyze = async () => {
    if (!file || !csvText) {
      setError("Please select a valid CSV file.")
      return
    }

    if (!selectedListId && (!isCreatingNewList || !newListName.trim())) {
      setError("Please select a target contact list or enter a new list name.")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      let targetListId = selectedListId

      // Create list if needed
      if (isCreatingNewList && newListName.trim()) {
        const createListRes = await fetch("/api/contacts/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newListName.trim() }),
        })

        const createListData = await createListRes.json()
        if (!createListRes.ok) {
          throw new Error(createListData.error || "Failed to create new list")
        }
        targetListId = createListData.id
        setSelectedListId(targetListId)
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/import/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'File analysis failed')
      }

      setAnalysis(data)

      // Initialize mappings from recommendations
      const initialMappings: Record<string, any> = {}
      const initialInlineFields: Record<string, any> = {}

      data.columns.forEach((col: any) => {
        if (col.suggestion) {
          if (col.suggestion.type === "SYSTEM") {
            initialMappings[col.header] = {
              action: "SYSTEM",
              field: col.suggestion.field
            }
          } else if (col.suggestion.type === "CUSTOM") {
            initialMappings[col.header] = {
              action: "MAP_CUSTOM_FIELD",
              fieldId: col.suggestion.fieldId
            }
          }
        } else {
          initialMappings[col.header] = { action: "IGNORE" }
        }
      })

      setUserMappings(initialMappings)
      setInlineFields(initialInlineFields)
      setWizardStep(1)
    } catch (err: any) {
      setError(err.message || 'An error occurred during file analysis')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Mapping updates
  const handleMappingChange = (header: string, val: string) => {
    const nextMappings = { ...userMappings }

    if (val === "IGNORE") {
      nextMappings[header] = { action: "IGNORE" }
    } else if (val.startsWith("SYSTEM:")) {
      const field = val.split(":")[1]
      nextMappings[header] = { action: "SYSTEM", field }
    } else if (val.startsWith("CUSTOM:")) {
      const fieldId = val.split(":")[1]
      nextMappings[header] = { action: "MAP_CUSTOM_FIELD", fieldId }
    } else if (val === "CREATE_CUSTOM") {
      setPendingMappingHeader(header)
      setNewFieldDisplayName(header)
      setNewFieldType("TEXT")
      setNewFieldOptions("")
      setShowCreateFieldModal(true)
      return
    }

    setUserMappings(nextMappings)
  }

  // Go to step 3 (Confirm / Execution) directly since custom fields are created inline
  const handleNextFromMapping = () => {
    setWizardStep(3)
  }

  // Step 4: Execute Ingestion
  const handleExecuteImport = async () => {
    setIsProcessing(true)
    setError("")
    setWizardStep(3)

    try {
      const response = await fetch("/api/contacts/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText,
          targetListId: selectedListId,
          mappings: userMappings,
          autoCreateDropdownOptions
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Ingestion failed.")
      }

      setResults(data.results)
      setFailedRows(data.errors || [])
      setWizardStep(4)
    } catch (err: any) {
      setError(err.message || "An error occurred during import execution.")
      setWizardStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/contacts" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <h1 className="text-xl font-semibold">Dynamic Import Wizard</h1>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Stepper Wizard Progress bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            {[
              { idx: 0, name: "Upload File" },
              { idx: 1, name: "Map Columns" },
              { idx: 3, name: "Importing" },
              { idx: 4, name: "Done" }
            ].map((step) => {
              const isActive = wizardStep === step.idx
              const isPassed = (step.idx === 3 && wizardStep === 4) || (step.idx < wizardStep)
              return (
                <div key={step.idx} className="flex items-center space-x-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isPassed ? "bg-green-500 text-white" : isActive ? "bg-blue-600 text-white animate-pulse" : "bg-gray-100 text-gray-400"
                  }`}>
                    {isPassed ? <Check className="h-4 w-4" /> : step.idx === 3 ? 3 : step.idx === 4 ? 4 : step.idx + 1}
                  </div>
                  <span className={`text-xs font-medium hidden md:inline ${isActive ? "text-blue-600" : isPassed ? "text-green-600" : "text-gray-400"}`}>
                    {step.name}
                  </span>
                  {step.idx < 4 && <ChevronRight className="h-4 w-4 text-gray-300 hidden md:inline" />}
                </div>
              )
            })}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="shadow-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* STEP 0: Upload & List Select */}
          {wizardStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>1. Select Contact List</CardTitle>
                  <CardDescription>Choose the target CRM list for import.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLists ? (
                    <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading contact lists...
                    </div>
                  ) : isCreatingNewList ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter new list name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewList(false)
                            setNewListName("")
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          Back to selector
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedListId}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "__NEW_LIST__") {
                          setIsCreatingNewList(true)
                          setSelectedListId("")
                        } else {
                          setSelectedListId(val)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="">Select a contact list...</option>
                      {contactLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                      <option value="__NEW_LIST__">+ Create new list</option>
                    </select>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>2. Upload CSV / Excel File</CardTitle>
                  <CardDescription>Upload contact dataset with an Email column.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer border-gray-200 hover:border-gray-300 bg-gray-50/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) processFile(f)
                      }}
                      className="hidden"
                    />
                    
                    {file ? (
                      <div className="space-y-3">
                        <FileText className="mx-auto h-12 w-12 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 max-w-[240px] mx-auto truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-10 w-10 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Drag your CSV file here
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            or click to browse from files
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isProcessing || !file || (!selectedListId && (!isCreatingNewList || !newListName.trim()))}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing CSV...
                        </>
                      ) : (
                        "Analyze CSV Schema"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 1: Column Mapping Grid */}
          {wizardStep === 1 && analysis && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Map CSV Columns</CardTitle>
                <CardDescription>
                  Confirm or modify how each column from your CSV maps to system fields or custom CRM fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                      <tr>
                        <th className="p-3">CSV Column Header</th>
                        <th className="p-3">Auto Mapping Recommendation</th>
                        <th className="p-3">Final Mapping Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm text-gray-700">
                      {analysis.columns.map((col) => {
                        const currentVal = (() => {
                          const mapping = userMappings[col.header]
                          if (!mapping || mapping.action === "IGNORE") return "IGNORE"
                          if (mapping.action === "SYSTEM") return `SYSTEM:${mapping.field}`
                          if (mapping.action === "MAP_CUSTOM_FIELD") return `CUSTOM:${mapping.fieldId}`
                          if (mapping.action === "CREATE_CUSTOM_FIELD") return "CREATE_CUSTOM"
                          return "IGNORE"
                        })()

                        return (
                          <tr key={col.header} className="hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-gray-900">{col.header}</td>
                            <td className="p-3">
                              {col.suggestion ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {col.suggestion.type === "SYSTEM" 
                                    ? `System: ${col.suggestion.field}` 
                                    : `Custom Field ID: ${col.suggestion.fieldId}`}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  Unmapped / New Field
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={currentVal}
                                onChange={(e) => handleMappingChange(col.header, e.target.value)}
                                className="w-full max-w-[240px] px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                              >
                                <option value="IGNORE">Ignore Column</option>
                                <optgroup label="System Columns">
                                  <option value="SYSTEM:email">Email (Required)</option>
                                  <option value="SYSTEM:firstName">First Name</option>
                                  <option value="SYSTEM:lastName">Last Name</option>
                                  <option value="SYSTEM:name">Full Name (Splits)</option>
                                  <option value="SYSTEM:phone">Phone</option>
                                  <option value="SYSTEM:company">Company</option>
                                  <option value="SYSTEM:city">City</option>
                                  <option value="SYSTEM:tags">Tags (Comma-separated)</option>
                                </optgroup>
                                <optgroup label="Existing Custom Fields">
                                  {tenantCustomFields.map((cf) => (
                                    <option key={cf.id} value={`CUSTOM:${cf.id}`}>
                                      {cf.displayName} ({cf.type})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Actions">
                                  <option value="CREATE_CUSTOM">+ Create Custom Field</option>
                                </optgroup>
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Auto-create dropdown options toggle */}
                <div className="flex items-center space-x-2 pt-3 pb-1 border-t border-gray-100">
                  <input
                    type="checkbox"
                    id="autoCreateDropdown"
                    checked={autoCreateDropdownOptions}
                    onChange={(e) => setAutoCreateDropdownOptions(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoCreateDropdown" className="text-sm text-gray-700 font-medium cursor-pointer">
                    Automatically create missing dropdown options during import
                  </label>
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" onClick={() => setWizardStep(0)}>
                    Back
                  </Button>
                  <Button onClick={handleNextFromMapping} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modal Overlay for Inline Custom Field Creation */}
          {showCreateFieldModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md mx-auto shadow-xl relative overflow-hidden bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFieldModal(false)
                    setPendingMappingHeader("")
                    setModalError("")
                  }}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 focus:outline-none"
                >
                  <span className="text-lg font-semibold leading-none">✕</span>
                </button>
                <CardHeader>
                  <CardTitle>Create Custom Field</CardTitle>
                  <CardDescription>
                    Configure a new custom field to map the CSV/Excel column "{pendingMappingHeader}" dynamically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {modalError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm font-medium">{modalError}</AlertDescription>
                    </Alert>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setModalError("")
                      if (!newFieldDisplayName.trim()) return

                      try {
                        const optionsArray = (newFieldType === "DROPDOWN" || newFieldType === "MULTI_SELECT")
                          ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean)
                          : undefined

                        const response = await fetch("/api/contacts/custom-fields", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            displayName: newFieldDisplayName.trim(),
                            type: newFieldType,
                            options: optionsArray,
                            isRequired: false,
                            displayOrder: tenantCustomFields.length
                          })
                        })

                        const data = await response.json()
                        if (response.ok) {
                          setTenantCustomFields(prev => [...prev, data])
                          setUserMappings(prev => ({
                            ...prev,
                            [pendingMappingHeader]: {
                              action: "MAP_CUSTOM_FIELD",
                              fieldId: data.id
                            }
                          }))
                          setShowCreateFieldModal(false)
                          setPendingMappingHeader("")
                        } else {
                          setModalError(data.error || "Failed to create custom field")
                        }
                      } catch (err) {
                        console.error(err)
                        setModalError("An error occurred while creating custom field")
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="fieldName" className="text-xs font-semibold text-slate-700">Display Name</Label>
                      <Input
                        id="fieldName"
                        value={newFieldDisplayName}
                        onChange={(e) => setNewFieldDisplayName(e.target.value)}
                        placeholder="e.g. Course Level"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldType" className="text-xs font-semibold text-slate-700">Field Type</Label>
                      <select
                        id="fieldType"
                        value={newFieldType}
                        onChange={(e) => {
                          setNewFieldType(e.target.value)
                          if (e.target.value !== "DROPDOWN" && e.target.value !== "MULTI_SELECT") {
                            setNewFieldOptions("")
                          }
                        }}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="TEXT">Text</option>
                        <option value="NUMBER">Number</option>
                        <option value="DATE">Date</option>
                        <option value="BOOLEAN">Boolean</option>
                        <option value="DROPDOWN">Dropdown List</option>
                        <option value="MULTI_SELECT">Multi Select</option>
                      </select>
                    </div>
                    {(newFieldType === "DROPDOWN" || newFieldType === "MULTI_SELECT") && (
                      <div>
                        <Label htmlFor="fieldOptions" className="text-xs font-semibold text-slate-700">Options (Comma separated)</Label>
                        <Input
                          id="fieldOptions"
                          value={newFieldOptions}
                          onChange={(e) => setNewFieldOptions(e.target.value)}
                          placeholder="e.g. Beginner, Intermediate, Advanced"
                          required
                          className="mt-1"
                        />
                      </div>
                    )}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateFieldModal(false)
                          setPendingMappingHeader("")
                          setModalError("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Create Field
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: Confirm & Progress */}
          {wizardStep === 3 && (
            <Card className="shadow-sm border-blue-100 bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                  Ingesting Data Dataset...
                </CardTitle>
                <CardDescription>
                  Executing database updates, linking lists, and validating custom field records.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-8 text-center max-w-md mx-auto">
                <Settings className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                <h4 className="text-sm font-semibold text-gray-700">Writing changes to database</h4>
                <p className="text-xs text-gray-500">
                  Please keep this window open while contacts are being validated and created.
                </p>
                {!isProcessing && (
                  <Button onClick={handleExecuteImport} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Start Import Ingestion
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Summary Results */}
          {wizardStep === 4 && results && (
            <div className="space-y-6">
              <Card className="shadow-md border-green-200 bg-green-50/10">
                <CardHeader className="border-b border-green-100/50 bg-green-50/30">
                  <CardTitle className="text-green-800 flex items-center text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Ingestion Successfully Completed
                  </CardTitle>
                  <CardDescription className="text-green-700/80">
                    Import statistics logs summary details:
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">{results.total}</p>
                      <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Total Rows</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                      <p className="text-2xl font-bold text-green-600">{results.newContactsCreated}</p>
                      <p className="text-xs font-semibold text-green-700 uppercase mt-1">New Contacts</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <p className="text-2xl font-bold text-blue-600">{results.existingContactsUpdated}</p>
                      <p className="text-xs font-semibold text-blue-700 uppercase mt-1">Updated Contacts</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                      <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                      <p className="text-xs font-semibold text-red-700 uppercase mt-1">Failed Rows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Row Level Error logs */}
              {failedRows.length > 0 && (
                <Card className="shadow-sm border-red-100">
                  <CardHeader>
                    <CardTitle className="text-red-800 text-sm font-semibold">Row Processing Failures (Capped at 100 entries)</CardTitle>
                    <CardDescription>Below are error details for rows that failed validation or parsing.</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
                    {failedRows.map((err, idx) => (
                      <div key={idx} className="flex justify-between text-xs p-2 bg-red-50 border border-red-100 rounded text-red-700">
                        <span><strong>Row {err.row}:</strong> {err.email || "Unknown email"}</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center pt-2">
                <Button onClick={() => router.push("/contacts")} className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
                  Back to Contacts list
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
