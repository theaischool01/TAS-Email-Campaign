import React, { useState, useMemo } from "react"
import { SegmentRuleGroup, SegmentRule, CustomFieldSchema } from "./types"
import { Button } from "@/components/ui/button"

export interface FilterBuilderProps {
  value: SegmentRuleGroup;
  onChange: (value: SegmentRuleGroup) => void;
  customFields: CustomFieldSchema[];
  customFieldValueCounts?: Record<string, number>;
  contacts?: any[]; // Optional contacts to calculate distinct values on the fly
  allowSystemFields?: boolean;
}

export function FilterBuilder({
  value,
  onChange,
  customFields,
  customFieldValueCounts = {},
  contacts = [],
  allowSystemFields = false
}: FilterBuilderProps) {
  const [newRuleField, setNewRuleField] = useState("")
  const [newRuleOperator, setNewRuleOperator] = useState("equals")
  const [newRuleValue, setNewRuleValue] = useState("")

  const handleClearAll = () => {
    onChange({
      ...value,
      rules: []
    })
  }

  const handleRemoveRule = (ruleIndex: number) => {
    const updatedRules = value.rules.filter((_, idx) => idx !== ruleIndex)
    onChange({
      ...value,
      rules: updatedRules
    })
  }

  const handleAddRule = () => {
    if (!newRuleField) return

    const fieldSchema = customFields.find(f => f.key === newRuleField || `custom.${f.key}` === newRuleField)
    const fieldKey = fieldSchema ? `custom.${fieldSchema.key}` : newRuleField

    const newRule: SegmentRule = {
      type: "RULE",
      field: fieldKey,
      operator: newRuleOperator,
      value: newRuleValue
    }

    onChange({
      ...value,
      rules: [...value.rules, newRule]
    })

    // Reset draft state
    setNewRuleField("")
    setNewRuleOperator("equals")
    setNewRuleValue("")
  }

  const getOperatorsForField = (fieldKey: string) => {
    const cleanKey = fieldKey.startsWith("custom.") ? fieldKey.split(".")[1] : fieldKey
    const field = customFields.find(f => f.key === cleanKey)
    if (!field) {
      // Default system fields operators
      if (fieldKey === "list.id") {
        return [
          { label: "Is in list", value: "in_list" },
          { label: "Is not in list", value: "not_in_list" }
        ]
      }
      if (fieldKey === "contact.tags") {
        return [
          { label: "Contains any", value: "contains_any" },
          { label: "Contains all", value: "contains_all" },
          { label: "Is empty", value: "is_empty" },
          { label: "Is not empty", value: "is_not_empty" }
        ]
      }
      return [
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "not_equals" },
        { label: "Contains", value: "contains" },
        { label: "Does not contain", value: "not_contains" }
      ]
    }

    switch (field.type) {
      case "TEXT":
        return [
          { label: "contains", value: "contains" },
          { label: "equals", value: "equals" }
        ]
      case "NUMBER":
        return [
          { label: "equals", value: "equals" },
          { label: "greater than", value: "greater_than" },
          { label: "less than", value: "less_than" }
        ]
      case "BOOLEAN":
      case "DROPDOWN":
      default:
        return [
          { label: "equals", value: "equals" }
        ]
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with active rules and Clear All */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Active Filters</h4>
        {value.rules.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Rules list */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {value.rules.map((rule, idx) => {
          if (!("type" in rule) || rule.type !== "RULE") return null

          const cleanFieldKey = rule.field.startsWith("custom.") ? rule.field.split(".")[1] : rule.field
          const fieldSchema = customFields.find(f => f.key === cleanFieldKey)
          const displayName = fieldSchema?.displayName || rule.field

          return (
            <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-md border border-slate-100 dark:border-slate-750">
              <span className="truncate text-slate-700 dark:text-slate-300">
                <strong>{displayName}</strong> {rule.operator.replace("_", " ")} <em>{String(rule.value)}</em>
              </span>
              <button
                onClick={() => handleRemoveRule(idx)}
                className="text-slate-400 hover:text-red-500 font-bold ml-2 text-sm leading-none"
              >
                ✕
              </button>
            </div>
          )
        })}
        {value.rules.length === 0 && (
          <div className="text-xs text-slate-500 py-2 text-center">No active filters.</div>
        )}
      </div>

      {/* Form to add a new rule */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Filter Rule</h5>
        <select
          value={newRuleField}
          onChange={(e) => {
            const val = e.target.value
            setNewRuleField(val)
            const cleanKey = val.startsWith("custom.") ? val.split(".")[1] : val
            const field = customFields.find(f => f.key === cleanKey)
            if (field) {
              if (field.type === "BOOLEAN") setNewRuleOperator("equals")
              else if (field.type === "TEXT") setNewRuleOperator("contains")
              else if (field.type === "NUMBER") setNewRuleOperator("equals")
              else if (field.type === "DROPDOWN") setNewRuleOperator("equals")
            } else {
              setNewRuleOperator("equals")
            }
            setNewRuleValue("")
          }}
          className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white"
        >
          <option value="">Select field...</option>
          {allowSystemFields && (
            <optgroup label="System Columns">
              <option value="contact.email">Email</option>
              <option value="contact.firstName">First Name</option>
              <option value="contact.lastName">Last Name</option>
              <option value="contact.phone">Phone</option>
              <option value="contact.company">Company</option>
              <option value="contact.city">City</option>
              <option value="contact.tags">Tags</option>
              <option value="list.id">List Membership</option>
            </optgroup>
          )}
          <optgroup label="Custom Fields">
            {customFields.map(f => {
              const count = customFieldValueCounts[f.key] || 0
              return (
                <option key={f.key} value={f.key} disabled={count === 0}>
                  {f.displayName} ({count})
                </option>
              )
            })}
          </optgroup>
        </select>

        {newRuleField && (
          <>
            {/* Operator select */}
            <select
              value={newRuleOperator}
              onChange={(e) => setNewRuleOperator(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
            >
              {getOperatorsForField(newRuleField).map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {/* Value inputs */}
            {(() => {
              const cleanKey = newRuleField.startsWith("custom.") ? newRuleField.split(".")[1] : newRuleField
              const field = customFields.find(f => f.key === cleanKey)

              if (!field) {
                // Return generic text input for non-custom fields
                return (
                  <input
                    type="text"
                    placeholder="Enter comparison value..."
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                  />
                )
              }

              if (field.key === "state") {
                return (
                  <select
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                  >
                    <option value="">Select state...</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                )
              }

              if (field.key === "has_laptop") {
                return (
                  <select
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                  >
                    <option value="">Select laptop status...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                )
              }

              if (field.key === "passout_year") {
                const distinctValues = Array.from(
                  new Set(
                    contacts
                      .map(c => c.customFields?.[field.key])
                      .filter(val => val !== undefined && val !== null && String(val).trim() !== "")
                  )
                ).sort()

                return (
                  <select
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                  >
                    <option value="">Select passout year...</option>
                    {distinctValues.map(val => (
                      <option key={String(val)} value={String(val)}>{String(val)}</option>
                    ))}
                  </select>
                )
              }

              if (field.type === "DROPDOWN") {
                return (
                  <select
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                  >
                    <option value="">Select option...</option>
                    {field.options && Array.isArray(field.options) && field.options.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )
              }

              if (field.type === "BOOLEAN") {
                return (
                  <select
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                  >
                    <option value="">Select status...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )
              }

              return (
                <input
                  type={field.type === "NUMBER" ? "number" : "text"}
                  placeholder="Enter comparison value..."
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-800 dark:text-white mt-1"
                />
              )
            })()}

            {/* Add rule button */}
            {(() => {
              const cleanKey = newRuleField.startsWith("custom.") ? newRuleField.split(".")[1] : newRuleField
              const fieldCount = customFieldValueCounts[cleanKey] || 0
              const isDisabled = fieldCount === 0

              return (
                <div className="relative group mt-2">
                  <Button
                    onClick={handleAddRule}
                    disabled={isDisabled}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-xs py-1.5 rounded-md h-[32px]"
                  >
                    Add Filter
                  </Button>
                  {isDisabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-50 shadow-md">
                      No contact records contain values for this field.
                    </div>
                  )}
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
