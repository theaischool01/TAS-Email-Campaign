"use client"

import React, { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, FileText, Users, CheckCircle, AlertTriangle } from "lucide-react"

export default function ImportContactsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file type (CSV only)
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      
      // Check file size (25MB limit)
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError('File size must be less than 25MB')
        return
      }

      setFile(selectedFile)
      setError("")
      previewCSV(selectedFile)
    }
  }

  const previewCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) {
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0]?.split(',').map(h => h.trim())
        
        const previewData = lines.slice(1, 6).map((line, index) => {
          const values = line.split(',').map(v => v.trim())
          return {
            row: index + 1,
            data: headers.reduce((obj: any, header: string, i: number) => ({
              ...obj,
              [header]: values[i] || ''
            }), {})
          }
        }).filter(item => Object.values(item.data).some((val: any) => (val as string).trim() !== ''))
        
        setPreview(previewData)
      }
    }
    reader.readAsText(file)
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
      setFile(droppedFile)
      setError("")
      previewCSV(droppedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import")
      return
    }

    setIsProcessing(true)
    setResults([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        setFile(null)
        setPreview([])
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (error) {
      setError('An error occurred during import')
    } finally {
      setIsProcessing(false)
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
            <p className="text-gray-600">You don't have permission to import contacts.</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Select a CSV file to import contacts. Maximum file size: 25MB.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="space-y-4">
                      <FileText className="mx-auto h-12 w-12 text-blue-600 mb-2" />
                      <p className="text-lg font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-lg font-medium text-gray-900">Drop your CSV file here</p>
                      <p className="text-sm text-gray-600">or click to browse</p>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                  disabled={!file || isProcessing}
                >
                  Choose File
                </Button>
              </CardContent>
            </Card>

            {/* Preview Area */}
            {preview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview (First 6 rows)</CardTitle>
                  <CardDescription>
                    Review the data before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {preview[0] && Object.keys(preview[0].data).map((header, index) => (
                            <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            {Object.values(row.data).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {value != null ? String(value) : <span className="text-gray-400">-</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Area */}
            {results.length > 0 && (
              <React.Fragment>
                <Card>
                  <CardHeader>
                    <CardTitle>Import Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div key={index} className={`flex items-center p-3 rounded-lg ${
                          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{result.message}</p>
                              {result.details && (
                                <p className="text-xs text-gray-600 mt-1">{result.details}</p>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </React.Fragment>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import Button */}
          {preview.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                size="lg"
                className="px-8"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Importing Contacts...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {preview.length} Contacts
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
