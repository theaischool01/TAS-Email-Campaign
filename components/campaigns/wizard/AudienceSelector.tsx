"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Search, Plus, Trash2, RefreshCw, Filter, ListFilter, AlertCircle, X, Check, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface DistinctValue {
  value: string
  count: number
}

interface FieldData {
  key: string
  displayName: string
  type: string
  options: string[]
  totalValues: number
  distinctValues: DistinctValue[]
}

interface AudienceSelectorProps {
  listId: string | null
  audienceFilters: any
  onChange: (filters: any) => void
  campaignId?: string
}

function getNormalizedDistinctCount(distinctValues: DistinctValue[]): number {
  const normSet = new Set<string>()
  for (const item of distinctValues) {
    const norm = item.value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    if (norm !== "") {
      normSet.add(norm)
    }
  }
  return normSet.size
}


export function AudienceSelector({
  listId,
  audienceFilters,
  onChange,
  campaignId
}: AudienceSelectorProps) {
  const [fields, setFields] = useState<FieldData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  
  // Dynamic UI States
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({})
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [operators, setOperators] = useState<Record<string, string>>({})
  const [betweenMinValues, setBetweenMinValues] = useState<Record<string, string>>({})
  const [betweenMaxValues, setBetweenMaxValues] = useState<Record<string, string>>({})
  
  // UI Helpers
  const [searchTerm, setSearchTerm] = useState<Record<string, string>>({})
  const [activeDropdownField, setActiveDropdownField] = useState<string | null>(null)
  const [previewContacts, setPreviewContacts] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showAddFieldDropdown, setShowAddFieldDropdown] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownField(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch list-specific custom fields
  useEffect(() => {
    if (!listId) {
      setFields([])
      setSelectedFields([])
      setSelectedValues({})
      setTextValues({})
      setOperators({})
      setBetweenMinValues({})
      setBetweenMaxValues({})
      setPreviewContacts([])
      return
    }

    const fetchFields = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/contacts/lists/${listId}/fields`)
        if (res.ok) {
          const data = await res.json()
          // Only show fields containing data (totalValues > 0)
          const fetchedFields: FieldData[] = (data.fields || []).filter((f: FieldData) => f.totalValues > 0)
          setFields(fetchedFields)

          // Try to restore/hydrate from existing audienceFilters AST
          if (audienceFilters && Array.isArray(audienceFilters.rules)) {
            const hydrated = parseAST(audienceFilters, fetchedFields)
            setSelectedFields(hydrated.selectedFields)
            setSelectedValues(hydrated.selectedValues)
            setTextValues(hydrated.textValues)
            setOperators(hydrated.operators)
            setBetweenMinValues(hydrated.betweenMinValues)
            setBetweenMaxValues(hydrated.betweenMaxValues)
          }
        }
      } catch (err) {
        console.error("Error fetching list fields:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFields()
  }, [listId])

  // Deserializes AST to local UI state
  function parseAST(ast: any, fieldsList: FieldData[]) {
    const selected: string[] = []
    const values: Record<string, string[]> = {}
    const texts: Record<string, string> = {}
    const ops: Record<string, string> = {}
    const mins: Record<string, string> = {}
    const maxs: Record<string, string> = {}

    if (!ast || !Array.isArray(ast.rules)) {
      return { selectedFields: selected, selectedValues: values, textValues: texts, operators: ops, betweenMinValues: mins, betweenMaxValues: maxs }
    }

    for (const node of ast.rules) {
      if (node.type === "RULE" && node.field?.startsWith("custom.")) {
        const key = node.field.split(".")[1]
        const fieldInfo = fieldsList.find(f => f.key === key)
        if (fieldInfo) {
          if (!selected.includes(key)) {
            selected.push(key)
          }
          const op = node.operator || "equals"
          ops[key] = op

          if (fieldInfo.type === "BOOLEAN") {
            values[key] = [String(node.value)]
          } else if (fieldInfo.type === "MULTI_SELECT") {
            values[key] = Array.isArray(node.value) ? node.value.map(String) : [String(node.value)]
          } else if (fieldInfo.type === "NUMBER" || fieldInfo.type === "DATE") {
            if (op === "between") {
              if (Array.isArray(node.value) && node.value.length === 2) {
                mins[key] = String(node.value[0])
                maxs[key] = String(node.value[1])
              }
            } else {
              texts[key] = String(node.value)
            }
          } else if (fieldInfo.type === "TEXT") {
            texts[key] = String(node.value)
          } else {
            // DROPDOWN or TEXT fallback
            const normCount = getNormalizedDistinctCount(fieldInfo.distinctValues)
            if (normCount > 200) {
              texts[key] = String(node.value)
            } else {
              values[key] = [String(node.value)]
            }
          }
        }
      } else if (node.conjunction === "OR" && Array.isArray(node.rules)) {
        if (node.rules.length > 0 && node.rules[0].field?.startsWith("custom.")) {
          const key = node.rules[0].field.split(".")[1]
          const fieldInfo = fieldsList.find(f => f.key === key)
          if (fieldInfo) {
            if (!selected.includes(key)) {
              selected.push(key)
            }
            const vals = node.rules
              .map((r: any) => String(r.value))
              .filter((v: string) => v !== undefined && v !== null && v !== "")
            values[key] = vals
          }
        }
      }
    }

    return {
      selectedFields: selected,
      selectedValues: values,
      textValues: texts,
      operators: ops,
      betweenMinValues: mins,
      betweenMaxValues: maxs
    }
  }

  // Compile local UI state to AST and trigger onChange
  const updateFilters = (
    newSelectedFields: string[],
    newSelectedValues: Record<string, string[]>,
    newTextValues: Record<string, string>,
    newOperators: Record<string, string>,
    newMins: Record<string, string>,
    newMaxs: Record<string, string>
  ) => {
    const rules: any[] = []

    for (const key of newSelectedFields) {
      const fieldInfo = fields.find(f => f.key === key)
      if (!fieldInfo) continue

      // distinctCount no longer raw


      if (fieldInfo.type === "BOOLEAN") {
        const vals = newSelectedValues[key] || []
        if (vals.length > 0) {
          const boolVal = vals[0] === "true"
          rules.push({
            type: "RULE",
            field: `custom.${key}`,
            operator: "equals",
            value: boolVal
          })
        }
      } else if (fieldInfo.type === "MULTI_SELECT") {
        const vals = newSelectedValues[key] || []
        if (vals.length > 0) {
          rules.push({
            type: "RULE",
            field: `custom.${key}`,
            operator: "contains_any",
            value: vals
          })
        }
      } else if (fieldInfo.type === "NUMBER") {
        const op = newOperators[key] || "equals"
        if (op === "between") {
          const min = newMins[key]
          const max = newMaxs[key]
          if (min !== undefined && min !== "" && max !== undefined && max !== "") {
            rules.push({
              type: "RULE",
              field: `custom.${key}`,
              operator: "between",
              value: [Number(min), Number(max)]
            })
          }
        } else {
          const val = newTextValues[key]
          if (val !== undefined && val !== "" && !isNaN(Number(val))) {
            rules.push({
              type: "RULE",
              field: `custom.${key}`,
              operator: op,
              value: Number(val)
            })
          }
        }
      } else if (fieldInfo.type === "DATE") {
        const op = newOperators[key] || "after"
        if (op === "between") {
          const min = newMins[key]
          const max = newMaxs[key]
          if (min && max) {
            rules.push({
              type: "RULE",
              field: `custom.${key}`,
              operator: "between",
              value: [min, max]
            })
          }
        } else {
          const val = newTextValues[key]
          if (val) {
            rules.push({
              type: "RULE",
              field: `custom.${key}`,
              operator: op,
              value: val
            })
          }
        }
      } else if (fieldInfo.type === "TEXT" || fieldInfo.type === "DROPDOWN") {
        const normCount = getNormalizedDistinctCount(fieldInfo.distinctValues)
        if (normCount > 200) {
          const op = newOperators[key] || "contains"
          const val = newTextValues[key] || ""
          if (val.trim() !== "") {
            rules.push({
              type: "RULE",
              field: `custom.${key}`,
              operator: op,
              value: val.trim()
            })
          }
        } else {
          // <= 200 distinct values (Checkbox list or Searchable Dropdown)
          const vals = newSelectedValues[key] || []
          if (vals.length > 0) {
            if (vals.length === 1) {
              rules.push({
                type: "RULE",
                field: `custom.${key}`,
                operator: "equals",
                value: vals[0]
              })
            } else {
              rules.push({
                conjunction: "OR",
                rules: vals.map(v => ({
                  type: "RULE",
                  field: `custom.${key}`,
                  operator: "equals",
                  value: v
                }))
              })
            }
          }
        }
      }
    }

    if (rules.length === 0) {
      onChange(null)
    } else {
      onChange({
        conjunction: "AND",
        rules
      })
    }
  }

  const handleAddField = (key: string) => {
    if (!selectedFields.includes(key)) {
      const nextSelected = [...selectedFields, key]
      setSelectedFields(nextSelected)

      // Set default operators
      const fieldInfo = fields.find(f => f.key === key)
      const nextOperators = { ...operators }
      if (fieldInfo) {
        if (fieldInfo.type === "NUMBER") nextOperators[key] = "equals"
        else if (fieldInfo.type === "DATE") nextOperators[key] = "after"
        else if (fieldInfo.type === "TEXT" || (fieldInfo.type === "DROPDOWN" && fieldInfo.distinctValues.length > 200)) {
          nextOperators[key] = "contains"
        }
      }
      setOperators(nextOperators)

      updateFilters(nextSelected, selectedValues, textValues, nextOperators, betweenMinValues, betweenMaxValues)
    }
    setShowAddFieldDropdown(false)
  }

  const handleRemoveField = (key: string) => {
    const nextSelected = selectedFields.filter(f => f !== key)
    setSelectedFields(nextSelected)

    const nextValues = { ...selectedValues }
    delete nextValues[key]

    const nextTexts = { ...textValues }
    delete nextTexts[key]

    const nextOperators = { ...operators }
    delete nextOperators[key]

    const nextMins = { ...betweenMinValues }
    delete nextMins[key]

    const nextMaxs = { ...betweenMaxValues }
    delete nextMaxs[key]

    setSelectedValues(nextValues)
    setTextValues(nextTexts)
    setOperators(nextOperators)
    setBetweenMinValues(nextMins)
    setBetweenMaxValues(nextMaxs)

    updateFilters(nextSelected, nextValues, nextTexts, nextOperators, nextMins, nextMaxs)
  }

  const handleCheckboxChange = (fieldKey: string, value: string, checked: boolean) => {
    const currentVals = selectedValues[fieldKey] || []
    let nextVals: string[]
    if (checked) {
      nextVals = [...currentVals, value]
    } else {
      nextVals = currentVals.filter(v => v !== value)
    }

    const nextValues = { ...selectedValues, [fieldKey]: nextVals }
    setSelectedValues(nextValues)
    updateFilters(selectedFields, nextValues, textValues, operators, betweenMinValues, betweenMaxValues)
  }

  const handleRadioChange = (fieldKey: string, value: string) => {
    const nextValues = { ...selectedValues, [fieldKey]: [value] }
    setSelectedValues(nextValues)
    updateFilters(selectedFields, nextValues, textValues, operators, betweenMinValues, betweenMaxValues)
  }

  const handleTextChange = (fieldKey: string, value: string) => {
    const nextTexts = { ...textValues, [fieldKey]: value }
    setTextValues(nextTexts)
    updateFilters(selectedFields, selectedValues, nextTexts, operators, betweenMinValues, betweenMaxValues)
  }

  const handleOperatorChange = (fieldKey: string, op: string) => {
    const nextOperators = { ...operators, [fieldKey]: op }
    setOperators(nextOperators)
    updateFilters(selectedFields, selectedValues, textValues, nextOperators, betweenMinValues, betweenMaxValues)
  }

  const handleMinChange = (fieldKey: string, val: string) => {
    const nextMins = { ...betweenMinValues, [fieldKey]: val }
    setBetweenMinValues(nextMins)
    updateFilters(selectedFields, selectedValues, textValues, operators, nextMins, betweenMaxValues)
  }

  const handleMaxChange = (fieldKey: string, val: string) => {
    const nextMaxs = { ...betweenMaxValues, [fieldKey]: val }
    setBetweenMaxValues(nextMaxs)
    updateFilters(selectedFields, selectedValues, textValues, operators, betweenMinValues, nextMaxs)
  }

  // Fetch preview of contacts matching campaign audience parameters
  const fetchPreview = async () => {
    if (!campaignId) return
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/preview`)
      if (res.ok) {
        const data = await res.json()
        const contacts = data.contacts || []

        // Resolve detailed custom fields in parallel for these previewed contacts (up to 25 contacts)
        const detailedContacts = await Promise.all(
          contacts.map(async (c: any) => {
            try {
              const detailRes = await fetch(`/api/contacts/${c.id}`)
              if (detailRes.ok) {
                const detailData = await detailRes.json()
                return {
                  ...c,
                  customFields: detailData.contact?.customFields || {}
                }
              }
            } catch (err) {
              console.error("Error loading contact details for preview:", err)
            }
            return c
          })
        )

        setPreviewContacts(detailedContacts)
      }
    } catch (err) {
      console.error("Error loading preview:", err)
    } finally {
      setLoadingPreview(false)
    }
  }

  // Auto-fetch preview on load or when listId/campaignId is set
  useEffect(() => {
    if (campaignId && listId) {
      const timer = setTimeout(fetchPreview, 1000)
      return () => clearTimeout(timer)
    }
  }, [campaignId, listId, audienceFilters])

  // Filter available fields for adding (exclude already selected ones)
  const addableFields = useMemo(() => {
    return fields.filter(f => !selectedFields.includes(f.key))
  }, [fields, selectedFields])

  if (!listId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <ListFilter className="h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Please select a contact list to enable targeting filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Add Field Row */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Targeting Filters</h4>
          <p className="text-xs text-slate-500">Add metadata-driven targeting parameters to segment your audience.</p>
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddFieldDropdown(!showAddFieldDropdown)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border-slate-200 shadow-none"
            disabled={loading || addableFields.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Field Filter
          </Button>

          {showAddFieldDropdown && (
            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                Available Fields
              </div>
              {addableFields.map(f => (
                <button
                  key={f.key}
                  onClick={() => handleAddField(f.key)}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center"
                >
                  <span className="font-medium">{f.displayName}</span>
                  <Badge variant="secondary" className="text-[9px] uppercase bg-slate-100 px-1 py-0.5">
                    {f.type}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          Loading field schema...
        </div>
      )}

      {/* Selected Filters List */}
      {selectedFields.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedFields.map(fieldKey => {
            const fieldInfo = fields.find(f => f.key === fieldKey)
            if (!fieldInfo) return null

            const distinctVals = fieldInfo.distinctValues || []
            const currentSearch = searchTerm[fieldKey] || ""
            const normCount = getNormalizedDistinctCount(distinctVals)

            // Render UI based on Field Type & Distinct Values Count
            return (
              <Card key={fieldKey} className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-none overflow-hidden flex flex-col max-h-[300px]">
                <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{fieldInfo.displayName}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize bg-white dark:bg-slate-800 text-slate-400">
                      {fieldInfo.type.toLowerCase()}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(fieldKey)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <CardContent className="p-3 flex-1 flex flex-col min-h-0">
                  {/* BOOLEAN UI (Radio buttons) */}
                  {fieldInfo.type === "BOOLEAN" && (
                    <div className="flex gap-4 p-2">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-350">
                        <input
                          type="radio"
                          name={`radio-${fieldKey}`}
                          checked={(selectedValues[fieldKey] || [])[0] === "true"}
                          onChange={() => handleRadioChange(fieldKey, "true")}
                          className="h-3.5 w-3.5 accent-blue-600"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-350">
                        <input
                          type="radio"
                          name={`radio-${fieldKey}`}
                          checked={(selectedValues[fieldKey] || [])[0] === "false"}
                          onChange={() => handleRadioChange(fieldKey, "false")}
                          className="h-3.5 w-3.5 accent-blue-600"
                        />
                        No
                      </label>
                    </div>
                  )}

                  {/* MULTI_SELECT or DROPDOWN with <= 50 Distinct Values (Search + Checkbox List) */}
                  {(fieldInfo.type === "MULTI_SELECT" || (fieldInfo.type === "DROPDOWN" && normCount <= 50)) && (
                    <>
                      {distinctVals.length > 5 && (
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Search options..."
                            value={currentSearch}
                            onChange={(e) => setSearchTerm(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                            className="pl-8 h-8 text-xs rounded-lg bg-slate-50"
                          />
                        </div>
                      )}

                      <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
                        {distinctVals.filter(v => v.value.toLowerCase().includes(currentSearch.toLowerCase())).length === 0 ? (
                          <div className="text-xs text-slate-400 text-center py-4">No matching options.</div>
                        ) : (
                          distinctVals
                            .filter(v => v.value.toLowerCase().includes(currentSearch.toLowerCase()))
                            .map(valItem => {
                              const isChecked = (selectedValues[fieldKey] || []).includes(valItem.value)
                              return (
                                <label
                                  key={valItem.value}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        handleCheckboxChange(fieldKey, valItem.value, !!checked)
                                      }
                                    />
                                    <span className="truncate font-medium text-slate-700 dark:text-slate-350">
                                      {valItem.value}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-semibold">
                                    {valItem.count}
                                  </span>
                                </label>
                              )
                            })
                        )}
                      </div>
                    </>
                  )}

                  {/* DROPDOWN with 51–200 Distinct Values (Searchable Dropdown / Pill selector) */}
                  {fieldInfo.type === "DROPDOWN" && normCount > 50 && normCount <= 200 && (
                    <div className="space-y-2 flex-1 flex flex-col min-h-0" ref={dropdownRef}>
                      {/* Selected option pills */}
                      <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-0.5">
                        {(selectedValues[fieldKey] || []).map(val => (
                          <Badge key={val} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                            {val}
                            <button
                              type="button"
                              onClick={() => handleCheckboxChange(fieldKey, val, false)}
                              className="hover:text-red-500"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {/* Dropdown Input Trigger */}
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Type or click to choose..."
                          value={searchTerm[fieldKey] || ""}
                          onChange={(e) => {
                            setSearchTerm(prev => ({ ...prev, [fieldKey]: e.target.value }))
                            setActiveDropdownField(fieldKey)
                          }}
                          onFocus={() => setActiveDropdownField(fieldKey)}
                          className="h-8 text-xs pr-8 rounded-lg"
                        />
                        <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-450 pointer-events-none" />
                      </div>

                      {/* Options overlay */}
                      {activeDropdownField === fieldKey && (
                        <div className="absolute left-3 right-3 mt-10 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
                          {distinctVals
                            .filter(v => v.value.toLowerCase().includes((searchTerm[fieldKey] || "").toLowerCase()))
                            .map(v => {
                              const isChecked = (selectedValues[fieldKey] || []).includes(v.value)
                              return (
                                <button
                                  key={v.value}
                                  type="button"
                                  onClick={() => handleCheckboxChange(fieldKey, v.value, !isChecked)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center"
                                >
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{v.value}</span>
                                  {isChecked && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                </button>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* NUMBER UI (Operator + Inputs) */}
                  {fieldInfo.type === "NUMBER" && (
                    <div className="space-y-2.5 p-1">
                      <select
                        value={operators[fieldKey] || "equals"}
                        onChange={(e) => handleOperatorChange(fieldKey, e.target.value)}
                        className="w-full h-8 px-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200"
                      >
                        <option value="equals">Equals</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="greater_than_or_equal">Greater Than Or Equal</option>
                        <option value="less_than_or_equal">Less Than Or Equal</option>
                        <option value="between">Between</option>
                      </select>

                      {(operators[fieldKey] || "equals") === "between" ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={betweenMinValues[fieldKey] || ""}
                            onChange={(e) => handleMinChange(fieldKey, e.target.value)}
                            className="h-8 text-xs rounded-lg flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={betweenMaxValues[fieldKey] || ""}
                            onChange={(e) => handleMaxChange(fieldKey, e.target.value)}
                            className="h-8 text-xs rounded-lg flex-1"
                          />
                        </div>
                      ) : (
                        <Input
                          type="number"
                          placeholder="Value"
                          value={textValues[fieldKey] || ""}
                          onChange={(e) => handleTextChange(fieldKey, e.target.value)}
                          className="h-8 text-xs rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {/* DATE UI (Operator + Inputs) */}
                  {fieldInfo.type === "DATE" && (
                    <div className="space-y-2.5 p-1">
                      <select
                        value={operators[fieldKey] || "after"}
                        onChange={(e) => handleOperatorChange(fieldKey, e.target.value)}
                        className="w-full h-8 px-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200"
                      >
                        <option value="after">After</option>
                        <option value="before">Before</option>
                        <option value="equals">Equals</option>
                        <option value="between">Between</option>
                      </select>

                      {(operators[fieldKey] || "after") === "between" ? (
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={betweenMinValues[fieldKey] || ""}
                            onChange={(e) => handleMinChange(fieldKey, e.target.value)}
                            className="h-8 text-xs rounded-lg flex-1"
                          />
                          <Input
                            type="date"
                            value={betweenMaxValues[fieldKey] || ""}
                            onChange={(e) => handleMaxChange(fieldKey, e.target.value)}
                            className="h-8 text-xs rounded-lg flex-1"
                          />
                        </div>
                      ) : (
                        <Input
                          type="date"
                          value={textValues[fieldKey] || ""}
                          onChange={(e) => handleTextChange(fieldKey, e.target.value)}
                          className="h-8 text-xs rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {/* TEXT UI or DROPDOWN with > 200 Distinct Values (Operator + Text Input) */}
                  {(fieldInfo.type === "TEXT" || (fieldInfo.type === "DROPDOWN" && normCount > 200)) && (
                    <div className="space-y-2.5 p-1">
                      <select
                        value={operators[fieldKey] || "contains"}
                        onChange={(e) => handleOperatorChange(fieldKey, e.target.value)}
                        className="w-full h-8 px-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200"
                      >
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                      </select>
                      <Input
                        type="text"
                        placeholder="Search query..."
                        value={textValues[fieldKey] || ""}
                        onChange={(e) => handleTextChange(fieldKey, e.target.value)}
                        className="text-xs h-8 rounded-lg"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <Filter className="h-7 w-7 text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Select list fields above to target matching recipients.
            </p>
            <p className="text-[11px] text-slate-400">
              When no filters are added, all active contacts in the list will be target recipients.
            </p>
          </div>
        )
      )}

      {/* Live Preview Section */}
      {listId && campaignId && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-none overflow-hidden mt-6">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Preview Recipient Contacts</h4>
              <p className="text-[11px] text-slate-400">Review a snapshot of contacts matching your rules.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchPreview}
              disabled={loadingPreview}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 h-8 border-slate-200 rounded-lg"
            >
              <RefreshCw className={`h-3 w-3 ${loadingPreview ? "animate-spin" : ""}`} />
              Refresh Preview
            </Button>
          </div>

          <CardContent className="p-0">
            {loadingPreview ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-8 justify-center">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                Compiling preview contacts...
              </div>
            ) : previewContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <AlertCircle className="h-6 w-6 text-slate-350 mb-1.5" />
                <p className="text-xs font-semibold text-slate-500">No contacts match the current filter rules.</p>
                <p className="text-[10px]">Try expanding your filter selections to match more recipients.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Email</th>
                      {selectedFields.map(key => (
                        <th key={key} className="px-4 py-2.5">{fields.find(f => f.key === key)?.displayName || key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {previewContacts.slice(0, 25).map((contact, idx) => (
                      <tr key={contact.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                          {contact.firstName || contact.lastName
                            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-550 dark:text-slate-400">{contact.email}</td>
                        {selectedFields.map(key => (
                          <td key={key} className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                            {contact.customFields?.[key] || contact[key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
