"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Database
} from "lucide-react"
// @ts-ignore
import Papa from "papaparse"

export default function ImportContactsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // File & List selection state
  const [file, setFile] = useState<File | null>(null)
  const [rowCount, setRowCount] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [contactLists, setContactLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [isCreatingNewList, setIsCreatingNewList] = useState<boolean>(false)
  const [newListName, setNewListName] = useState<string>("")
  const [loadingLists, setLoadingLists] = useState(false)
  
  // Pipeline/Import state
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(0) // 0: Idle, 1: Parsing, 2: Validating, 3: Deduplicating, 4: Saving, 5: Done
  const [results, setResults] = useState<{
    total: number
    newContactsCreated: number
    existingContactsAddedToList: number
    alreadyInList: number
    ignored: number
  } | null>(null)
  const [error, setError] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)



  // Fetch available contact lists
  useEffect(() => {
    if (session) {
      setLoadingLists(true)
      fetch("/api/contacts/lists")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.contactLists) {
            setContactLists(data.contactLists)
          } else {
            console.error("Failed to load contact lists:", data)
          }
        })
        .catch((err) => console.error("Error loading contact lists:", err))
        .finally(() => setLoadingLists(false))
    }
  }, [session])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }
    
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB')
      return
    }

    setFile(selectedFile)
    setError("")
    setResults(null)
    setCurrentStep(0)
    
    // Parse on client to count total rows (excluding headers/empty lines)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (parsed: any) => {
            setRowCount(parsed.data.length)
          },
          error: () => {
            setError("Failed to preview CSV file structure")
          }
        })
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      processFile(droppedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import")
      return
    }

    if (!selectedListId && (!isCreatingNewList || !newListName.trim())) {
      setError("Please select a target contact list or enter a new list name")
      return
    }

    setIsProcessing(true)
    setError("")
    setResults(null)
    setCurrentStep(1) // Step 1: Parsing

    // Start API request immediately
    const importPromise = (async () => {
      let targetListId = selectedListId

      if (isCreatingNewList && newListName.trim()) {
        const createListRes = await fetch("/api/contacts/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newListName.trim() }),
        })

        const createListData = await createListRes.json()
        if (!createListRes.ok) {
          throw new Error(createListData.error || "Failed to create new list")
        }

        targetListId = createListData.id
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetListId', targetListId)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }
      return data.results
    })()

    try {
      // Step 1: Parsing (simulate UI step duration)
      await new Promise((resolve) => setTimeout(resolve, 600))
      setCurrentStep(2) // Step 2: Validating

      // Step 2: Validating (simulate UI step duration)
      await new Promise((resolve) => setTimeout(resolve, 600))
      setCurrentStep(3) // Step 3: Deduplicating

      // Step 3: Deduplicating (simulate UI step duration)
      await new Promise((resolve) => setTimeout(resolve, 600))
      setCurrentStep(4) // Step 4: Saving

      // Wait for actual API response to finish
      const apiResults = await importPromise
      
      // Step 4: Saving (simulate UI step duration)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setCurrentStep(5) // Done

      setResults(apiResults)
      setFile(null)
      setRowCount(0)
    } catch (err: any) {
      setError(err.message || 'An error occurred during import')
      setCurrentStep(0)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!session) {
    return null
  }



  // Helper render for each pipeline step
  const renderStep = (stepNumber: number, title: string, description: string, IconComponent: any) => {
    const isCompleted = currentStep > stepNumber
    const isActive = currentStep === stepNumber
    const isPending = currentStep < stepNumber

    return (
      <div className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-300 ${
        isActive 
          ? "bg-blue-50/50 border-blue-200 shadow-sm" 
          : isCompleted 
            ? "bg-green-50/30 border-green-100" 
            : "bg-white border-gray-100 opacity-60"
      }`}>
        <div className={`flex items-center justify-center h-10 w-10 rounded-full border transition-all ${
          isCompleted 
            ? "bg-green-500 border-green-500 text-white" 
            : isActive 
              ? "bg-blue-600 border-blue-600 text-white animate-pulse" 
              : "bg-gray-50 border-gray-200 text-gray-400"
        }`}>
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : isActive ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <IconComponent className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold transition-colors ${
            isActive ? "text-blue-900" : isCompleted ? "text-green-900" : "text-gray-900"
          }`}>{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
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
                <ArrowLeft className="h-4 w-4 mr-2" />
                <h1 className="text-xl font-semibold">Import Contacts</h1>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card: Configuration & Upload */}
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>1. Select Contact List</CardTitle>
                  <CardDescription>
                    Choose the target contact list for import.
                  </CardDescription>
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
                        disabled={isProcessing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewList(false)
                            setNewListName("")
                          }}
                          disabled={isProcessing}
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
                      disabled={isProcessing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50"
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
                  <CardTitle>2. Upload CSV File</CardTitle>
                  <CardDescription>
                    Upload a CSV file containing your contacts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                      isDragging 
                        ? 'border-blue-400 bg-blue-50/50' 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={isProcessing}
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
                            {rowCount.toLocaleString()} rows detected
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
                  
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      size="sm"
                    >
                      Choose File
                    </Button>
                    {file && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Card: Dynamic Pipeline / Results Area */}
            <div className="flex flex-col">
              {isProcessing || currentStep > 0 ? (
                <Card className="flex-1 shadow-sm border-blue-100 bg-white">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      {currentStep === 5 ? (
                        <span className="flex items-center text-green-700">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-600 animate-bounce" />
                          Import Completed Successfully
                        </span>
                      ) : (
                        <span className="flex items-center text-blue-900">
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                          Processing Import Pipeline...
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Tracks current CSV parser, validation rules, and DB ingestion states.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderStep(
                      1, 
                      "Read & Parse CSV", 
                      "Parsing file content safely using PapaParse format engine.", 
                      FileText
                    )}
                    {renderStep(
                      2, 
                      "Validate Email Formats", 
                      "Verifying RFC compliant email formats per contact row.", 
                      ShieldCheck
                    )}
                    {renderStep(
                      3, 
                      "Check Duplicates", 
                      "Screening emails against existing database records.", 
                      UserCheck
                    )}
                    {renderStep(
                      4, 
                      "Save to database", 
                      "Ingesting new entities and linking list memberships.", 
                      Database
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex-1 shadow-sm border-dashed border-2 border-gray-200 flex items-center justify-center p-8 bg-gray-50/10">
                  <div className="text-center max-w-sm">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-700">Pipeline Status: Idle</h4>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Configure your target list and select a valid CSV file to start the automated import pipeline.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Results Summary Card */}
          {results && currentStep === 5 && (
            <Card className="shadow-md border-green-200 bg-green-50/10">
              <CardHeader className="border-b border-green-100/50 bg-green-50/30">
                <CardTitle className="text-green-800 flex items-center text-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Import Statistics Summary
                </CardTitle>
                <CardDescription className="text-green-700/80">
                  Successfully imported contacts into the database.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">{results.total}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Total Rows</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                    <p className="text-2xl font-bold text-green-600">{results.newContactsCreated}</p>
                    <p className="text-xs font-semibold text-green-700 uppercase mt-1">New Contacts Created</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{results.existingContactsAddedToList}</p>
                    <p className="text-xs font-semibold text-blue-700 uppercase mt-1">Existing Added To List</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                    <p className="text-2xl font-bold text-amber-600">{results.alreadyInList}</p>
                    <p className="text-xs font-semibold text-amber-700 uppercase mt-1">Already In List</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                    <p className="text-2xl font-bold text-red-600">{results.ignored}</p>
                    <p className="text-xs font-semibold text-red-700 uppercase mt-1">Ignored</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="shadow-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Import Button Container */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleImport}
              disabled={isProcessing || !file || (!selectedListId && (!isCreatingNewList || !newListName.trim()))}
              size="lg"
              className="px-10 py-6 text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Importing Contacts...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Start Ingestion Pipeline
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
