"use client"

import { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import VariablePicker from "./VariablePicker"

interface VariableInputProps {
  value: string
  onChange: (val: string) => void
  type?: "input" | "textarea"
  placeholder?: string
  className?: string
  rows?: number
  id?: string
}

export default function VariableInput({
  value,
  onChange,
  type = "input",
  placeholder = "",
  className = "",
  rows = 3,
  id
}: VariableInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    onChange(val)

    // Auto-popup variable picker when user types { or {{
    const selectionStart = e.target.selectionStart ?? 0
    const textBeforeCursor = val.substring(0, selectionStart)
    if (textBeforeCursor.endsWith("{") || textBeforeCursor.endsWith("{{")) {
      setPickerOpen(true)
    }
  }

  const handleInsertVariable = useCallback((tagValue: string) => {
    const input = inputRef.current
    if (!input) {
      // Fallback if ref is not bound
      onChange(value + tagValue)
      return
    }

    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const text = input.value

    const newValue = text.substring(0, start) + tagValue + text.substring(end)
    onChange(newValue)

    // Reset selection position in focus timeout
    setTimeout(() => {
      input.focus()
      const newCursorPos = start + tagValue.length
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 20)
  }, [value, onChange])

  return (
    <div className="relative w-full flex flex-col gap-1 text-slate-800">
      <div className="relative flex items-center w-full">
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={id}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={rows}
            className={`w-full pr-10 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-slate-100/30 transition-all text-slate-700 resize-none ${className}`}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id={id}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`pr-10 text-xs border border-slate-200 rounded-lg bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-500 hover:bg-slate-100/30 transition-all text-slate-700 h-8 ${className}`}
          />
        )}

        {/* Floating Variable Picker Button */}
        <div className="absolute right-2.5 top-[7px]">
          <button
            type="button"
            onClick={() => setPickerOpen(!pickerOpen)}
            className="text-xs font-semibold text-slate-450 hover:text-blue-600 transition-colors p-0.5 rounded focus:outline-none"
            title="Insert dynamic variable"
          >
            {"{}"}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <VariablePicker
          onSelect={handleInsertVariable}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
