"use client"

import React, { useState, useEffect } from "react"
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
  Trash2,
  Edit,
  ChevronLeft,
  Loader2,
  Settings,
  HelpCircle,
  X,
  Eye
} from "lucide-react"

export default function SegmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [contactLists, setContactLists] = useState<any[]>([])

  // Live Estimator & Preview states
  const [liveCount, setLiveCount] = useState<number | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [previewContacts, setPreviewContacts] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  // New Segment Criteria state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [conjunction, setConjunction] = useState<"AND" | "OR">("AND")
  const [rules, setRules] = useState<Array<{
    field: string;
    operator: string;
    value: string;
  }>>([
    { field: "contact.email", operator: "contains", value: "" }
  ])

  useEffect(() => {
    if (session) {
      fetchSegments()
      loadResources()
    }
  }, [session])

  // Live Count Estimation Debounced hook
  useEffect(() => {
    if (!isCreating) {
      setLiveCount(null)
      return
    }

    const timer = setTimeout(async () => {
      if (rules.length === 0) return
      setEstimating(true)
      try {
        const formattedRules = rules.map(r => {
          const type = getFieldType(r.field)
          let valueParsed: any = r.value

          if (r.operator === "between") {
            if (type === "NUMBER") {
              valueParsed = r.value.split(",").map(t => t.trim()).map(Number)
            } else {
              valueParsed = r.value.split(",").map(t => t.trim())
            }
          } else if (type === "LIST" || type === "MULTI_SELECT") {
            valueParsed = r.value.split(",").map(t => t.trim()).filter(Boolean)
          } else if (type === "BOOLEAN") {
            valueParsed = r.value === "true"
          }

          return {
            type: "RULE",
            field: r.field,
            operator: r.operator,
            value: valueParsed
          }
        })

        const criteria = {
          conjunction,
          rules: formattedRules
        }

        const res = await fetch("/api/segments/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria })
        })
        const data = await res.json()
        if (data.count !== undefined) {
          setLiveCount(data.count)
        }
      } catch (err) {
        console.error("Estimation failed:", err)
      } finally {
        setEstimating(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [rules, conjunction, isCreating])

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

  const loadResources = async () => {
    try {
      const [fieldsRes, listsRes] = await Promise.all([
        fetch("/api/contacts/custom-fields"),
        fetch("/api/contacts/lists")
      ])
      const fields = await fieldsRes.json()
      const listsData = await listsRes.json()

      if (Array.isArray(fields)) setCustomFields(fields)
      if (listsData.success && listsData.contactLists) setContactLists(listsData.contactLists)
    } catch (e) {
      console.error("Failed to load schema resources:", e)
    }
  }

  const fetchPreview = async (id: string) => {
    try {
      setLoadingPreview(true)
      const res = await fetch(`/api/segments/${id}/preview`)
      const data = await res.json()
      if (data.contacts) {
        setPreviewContacts(data.contacts)
      }
    } catch (err) {
      console.error("Preview fetch failed:", err)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleAddRule = () => {
    setRules([...rules, { field: "contact.email", operator: "contains", value: "" }])
  }

  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx))
  }

  const handleRuleChange = (idx: number, key: string, val: string) => {
    const nextRules = [...rules]
    nextRules[idx] = { ...nextRules[idx], [key]: val }

    // Reset operator if field changes to keep it logically compatible
    if (key === "field") {
      const fieldType = getFieldType(val)
      if (fieldType === "LIST") nextRules[idx].operator = "in_list"
      else if (fieldType === "NUMBER") nextRules[idx].operator = "equals"
      else if (fieldType === "DATE") nextRules[idx].operator = "equals"
      else if (fieldType === "BOOLEAN") nextRules[idx].operator = "equals"
      else if (fieldType === "DROPDOWN") nextRules[idx].operator = "equals"
      else if (fieldType === "MULTI_SELECT") nextRules[idx].operator = "contains_any"
      else nextRules[idx].operator = "contains"
      nextRules[idx].value = ""
    }

    setRules(nextRules)
  }

  const getFieldType = (fieldName: string): string => {
    if (fieldName === "list.id") return "LIST"
    if (fieldName === "contact.tags") return "MULTI_SELECT"
    if (fieldName.startsWith("contact.")) return "TEXT"

    const customKey = fieldName.split(".")[1]?.toLowerCase()
    const match = customFields.find(f => f.key.toLowerCase() === customKey)
    return match ? match.type : "TEXT"
  }

  const getOperatorsForField = (fieldName: string) => {
    const type = getFieldType(fieldName)
    if (type === "LIST") {
      return [
        { label: "Is in list", value: "in_list" },
        { label: "Is not in list", value: "not_in_list" }
      ]
    }
    if (type === "MULTI_SELECT") {
      return [
        { label: "Contains any", value: "contains_any" },
        { label: "Contains all", value: "contains_all" },
        { label: "Is empty", value: "is_empty" },
        { label: "Is not empty", value: "is_not_empty" }
      ]
    }
    if (type === "NUMBER") {
      return [
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "not_equals" },
        { label: "Greater Than", value: "greater_than" },
        { label: "Less Than", value: "less_than" },
        { label: "Greater Than or Equal", value: "greater_than_or_equal" },
        { label: "Less Than or Equal", value: "less_than_or_equal" },
        { label: "Between", value: "between" },
        { label: "Is empty", value: "is_empty" },
        { label: "Is not empty", value: "is_not_empty" }
      ]
    }
    if (type === "DATE") {
      return [
        { label: "Equals", value: "equals" },
        { label: "Before", value: "before" },
        { label: "After", value: "after" },
        { label: "Between", value: "between" },
        { label: "Is empty", value: "is_empty" },
        { label: "Is not empty", value: "is_not_empty" }
      ]
    }
    if (type === "BOOLEAN") {
      return [
        { label: "Is", value: "equals" },
        { label: "Is Not", value: "not_equals" }
      ]
    }
    if (type === "DROPDOWN") {
      return [
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "not_equals" },
        { label: "Is empty", value: "is_empty" },
        { label: "Is not empty", value: "is_not_empty" }
      ]
    }
    return [
      { label: "Equals", value: "equals" },
      { label: "Not Equals", value: "not_equals" },
      { label: "Contains", value: "contains" },
      { label: "Does not contain", value: "not_contains" },
      { label: "Starts with", value: "starts_with" },
      { label: "Ends with", value: "ends_with" },
      { label: "Is empty", value: "is_empty" },
      { label: "Is not empty", value: "is_not_empty" }
    ]
  }

  const handleOpenEdit = async (segment: any) => {
    setEditingSegmentId(segment.id)
    setName(segment.name)
    setDescription(segment.description || "")
    setConjunction(segment.criteria?.conjunction || "AND")

    // Map criteria to frontend editor rule structure
    const mappedRules = (segment.criteria?.rules || []).map((r: any) => {
      let valStr = ""
      if (Array.isArray(r.value)) {
        valStr = r.value.join(",")
      } else {
        valStr = String(r.value ?? "")
      }
      return {
        field: r.field,
        operator: r.operator,
        value: valStr
      }
    })

    setRules(mappedRules.length > 0 ? mappedRules : [{ field: "contact.email", operator: "contains", value: "" }])
    setIsCreating(true)
    fetchPreview(segment.id)
  }

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Segment name is required")
      return
    }

    if (rules.length === 0) {
      toast.error("Segment must contain at least one filter rule.")
      return
    }

    try {
      const formattedRules = rules.map(r => {
        const type = getFieldType(r.field)
        let valueParsed: any = r.value

        if (r.operator === "between") {
          if (type === "NUMBER") {
            valueParsed = r.value.split(",").map(t => t.trim()).map(Number)
          } else {
            valueParsed = r.value.split(",").map(t => t.trim())
          }
        } else if (type === "LIST" || type === "MULTI_SELECT") {
          valueParsed = r.value.split(",").map(t => t.trim()).filter(Boolean)
        } else if (type === "BOOLEAN") {
          valueParsed = r.value === "true"
        }

        return {
          type: "RULE",
          field: r.field,
          operator: r.operator,
          value: valueParsed
        }
      })

      const criteria = {
        conjunction,
        rules: formattedRules
      }

      const url = editingSegmentId ? `/api/segments/${editingSegmentId}` : "/api/segments"
      const method = editingSegmentId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          criteria
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(editingSegmentId ? "Segment updated successfully" : "Segment created successfully")
        setIsCreating(false)
        setEditingSegmentId(null)
        setName("")
        setDescription("")
        setRules([{ field: "contact.email", operator: "contains", value: "" }])
        fetchSegments()
      } else {
        toast.error(data.error || "Failed to save segment")
      }
    } catch (error) {
      console.error("Error saving segment:", error)
      toast.error("Error saving segment")
    }
  }

  const handleDeleteSegment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) return

    try {
      const res = await fetch(`/api/segments/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        toast.success("Segment deleted successfully")
        fetchSegments()
      } else {
        toast.error(data.error || "Failed to delete segment")
      }
    } catch (e) {
      toast.error("An error occurred during deletion.")
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
              <Link href="/contacts" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Dynamic Segments</h1>
            </div>
            {!isCreating && (
              <Button onClick={() => { setIsCreating(true); setEditingSegmentId(null); setName(""); setDescription(""); setRules([{ field: "contact.email", operator: "contains", value: "" }]) }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                New Segment
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isCreating ? (
          <Card className="max-w-4xl mx-auto shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{editingSegmentId ? "Edit Dynamic Segment" : "Create Dynamic Segment"}</CardTitle>
                <CardDescription>Configure rules to target specific audiences.</CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Match</span>
                <div className="text-xl font-bold text-slate-800 flex items-center justify-end gap-1">
                  {estimating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : liveCount !== null ? (
                    <span>{liveCount.toLocaleString()} contacts</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSaveSegment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Segment Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. VIP Customers Telangana" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input 
                      id="description" 
                      placeholder="e.g. Target VIP list members" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filter Condition Builder */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2 text-sm text-gray-700">
                      <Filter className="h-4 w-4 text-blue-500" />
                      Filter Criteria Logic
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-500">Match Conjunction:</span>
                      <select
                        value={conjunction}
                        onChange={(e) => setConjunction(e.target.value as "AND" | "OR")}
                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-900 font-medium"
                      >
                        <option value="AND">All Rules (AND)</option>
                        <option value="OR">Any Rule (OR)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {rules.map((rule, idx) => {
                      const operators = getOperatorsForField(rule.field)
                      const isNoValOperator = ["is_empty", "is_not_empty"].includes(rule.operator)
                      const type = getFieldType(rule.field)

                      return (
                        <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-gray-50 border rounded-xl shadow-xs relative">
                          {/* Field Select */}
                          <div className="flex-1 min-w-[200px]">
                            <select
                               value={rule.field}
                               onChange={(e) => handleRuleChange(idx, "field", e.target.value)}
                               className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                            >
                              <optgroup label="System Columns">
                                <option value="contact.email">Email</option>
                                <option value="contact.firstName">First Name</option>
                                <option value="contact.lastName">Last Name</option>
                                <option value="contact.phone">Phone</option>
                                <option value="contact.company">Company</option>
                                <option value="contact.city">City</option>
                                <option value="contact.tags">Tags</option>
                              </optgroup>
                              <optgroup label="Lists">
                                <option value="list.id">List Membership</option>
                              </optgroup>
                              <optgroup label="Custom Fields">
                                {customFields.map(f => (
                                  <option key={f.id} value={`custom.${f.key}`}>
                                    {f.displayName} ({f.type})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          {/* Operator Select */}
                          <div className="w-[180px]">
                            <select
                              value={rule.operator}
                              onChange={(e) => handleRuleChange(idx, "operator", e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                            >
                              {operators.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Value Input */}
                          {!isNoValOperator && (
                            <div className="flex-1 min-w-[200px]">
                              {type === "BOOLEAN" ? (
                                <select
                                  value={rule.value}
                                  onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                >
                                  <option value="">Select Boolean...</option>
                                  <option value="true">True</option>
                                  <option value="false">False</option>
                                </select>
                              ) : rule.operator === "between" ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type={type === "NUMBER" ? "number" : type === "DATE" ? "date" : "text"}
                                    placeholder="Min"
                                    value={rule.value.split(",")[0] || ""}
                                    onChange={(e) => {
                                      const maxVal = rule.value.split(",")[1] || ""
                                      handleRuleChange(idx, "value", `${e.target.value},${maxVal}`)
                                    }}
                                    className="h-9 w-1/2"
                                  />
                                  <span className="text-xs text-gray-500">to</span>
                                  <Input
                                    type={type === "NUMBER" ? "number" : type === "DATE" ? "date" : "text"}
                                    placeholder="Max"
                                    value={rule.value.split(",")[1] || ""}
                                    onChange={(e) => {
                                      const minVal = rule.value.split(",")[0] || ""
                                      handleRuleChange(idx, "value", `${minVal},${e.target.value}`)
                                    }}
                                    className="h-9 w-1/2"
                                  />
                                </div>
                              ) : (
                                <Input 
                                  type={type === "DATE" ? "date" : "text"}
                                  placeholder={
                                    type === "LIST" ? "e.g. list_id123" :
                                    type === "MULTI_SELECT" ? "Comma separated options" : "Enter filter value"
                                  }
                                  value={rule.value}
                                  onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                                  className="h-9"
                                />
                              )}
                            </div>
                          )}

                          {/* Remove button */}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveRule(idx)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  <Button type="button" variant="outline" onClick={handleAddRule} className="text-xs">
                    + Add Condition Rule
                  </Button>
                </div>

                {/* Live Preview List */}
                {editingSegmentId && (
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Live Preview (First 10 matches)
                    </h3>
                    {loadingPreview ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : previewContacts.length === 0 ? (
                      <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg border border-dashed text-center">
                        No matching contacts found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-500 uppercase tracking-wider font-semibold">Name</th>
                              <th className="px-4 py-2 text-left text-gray-500 uppercase tracking-wider font-semibold">Email</th>
                              <th className="px-4 py-2 text-left text-gray-500 uppercase tracking-wider font-semibold">Tags</th>
                              <th className="px-4 py-2 text-left text-gray-500 uppercase tracking-wider font-semibold">Custom Fields</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {previewContacts.map((c: any) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-gray-900">{c.firstName || "-"} {c.lastName || ""}</td>
                                <td className="px-4 py-2 text-gray-500">{c.email}</td>
                                <td className="px-4 py-2">
                                  {c.tags ? c.tags.split(",").map((t: string) => (
                                    <Badge key={t} variant="secondary" className="mr-1 text-[9px] px-1.5 py-0 rounded-full">{t}</Badge>
                                  )) : "-"}
                                </td>
                                <td className="px-4 py-2">
                                  {Object.keys(c.customFields || {}).length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(c.customFields).map(([key, val]) => (
                                        <span key={key} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] text-slate-600 font-medium">
                                          {key}: {String(val)}
                                        </span>
                                      ))}
                                    </div>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingSegmentId(null) }}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingSegmentId ? "Save Segment" : "Create Segment"}
                  </Button>
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
                  <CardTitle>No Segments Yet</CardTitle>
                  <CardDescription>
                    Segments let you build dynamic queries across target audiences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => { setIsCreating(true); setEditingSegmentId(null); setName(""); setDescription(""); setRules([{ field: "contact.email", operator: "contains", value: "" }]) }} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Create Segment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segments.map((segment) => (
                  <Card key={segment.id} className="hover:shadow-md transition-shadow bg-white border border-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-slate-800">{segment.name}</CardTitle>
                        <Target className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardDescription className="line-clamp-2 text-slate-500 text-sm mt-1">{segment.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <strong className="text-gray-700 font-semibold">Conjunction:</strong> {segment.criteria?.conjunction || "AND"}<br/>
                        <strong className="text-gray-700 font-semibold">Rules count:</strong> {segment.criteria?.rules?.length || 0} rules
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3 border-slate-100">
                        <span>Created {new Date(segment.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenEdit(segment)}
                            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteSegment(segment.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
