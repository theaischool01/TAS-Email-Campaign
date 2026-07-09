"use client"

import { useState, useEffect, useRef } from "react"
import { Search, History, FolderOpen, Tag, X } from "lucide-react"
import { SYSTEM_MERGE_TAGS, MergeTagCategory, MergeTag } from "./registry/merge-tags"

interface VariablePickerProps {
  onSelect: (value: string) => void
  onClose: () => void
}

export default function VariablePicker({ onSelect, onClose }: VariablePickerProps) {
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<MergeTagCategory[]>(SYSTEM_MERGE_TAGS)
  const [recentTags, setRecentTags] = useState<MergeTag[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Dynamic Custom Fields & Load Recent Tags
  useEffect(() => {
    async function fetchCustomFields() {
      try {
        const response = await fetch("/api/contacts/custom-fields")
        if (response.ok) {
          const fields = await response.json()
          if (Array.isArray(fields) && fields.length > 0) {
            const customCategory: MergeTagCategory = {
              id: "custom",
              label: "Custom Fields",
              tags: fields.map((f: any) => ({
                label: f.displayName || f.key,
                value: `{{${f.key}}}`,
                description: `Custom field: ${f.type}`
              }))
            }
            setCategories([...SYSTEM_MERGE_TAGS, customCategory])
          }
        }
      } catch (err) {
        console.error("Failed to fetch custom fields for VariablePicker:", err)
      }
    }

    fetchCustomFields()

    // Load recent tags from localStorage
    try {
      const stored = localStorage.getItem("mailflow_recent_merge_tags")
      if (stored) {
        setRecentTags(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load recent tags:", e)
    }
  }, [])

  // 2. Click Outside & Keyboard Listeners
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  // 3. Handle Select
  const handleSelectTag = (tag: MergeTag) => {
    onSelect(tag.value)

    // Save to recents
    const updatedRecents = [
      tag,
      ...recentTags.filter(r => r.value !== tag.value)
    ].slice(0, 5) // Keep top 5

    setRecentTags(updatedRecents)
    try {
      localStorage.setItem("mailflow_recent_merge_tags", JSON.stringify(updatedRecents))
    } catch (e) {
      console.error(e)
    }

    onClose()
  }

  // 4. Search Filter
  const filteredCategories = categories.map(cat => {
    const matchingTags = cat.tags.filter(t => 
      t.label.toLowerCase().includes(search.toLowerCase()) || 
      t.value.toLowerCase().includes(search.toLowerCase())
    )
    return {
      ...cat,
      tags: matchingTags
    }
  }).filter(cat => cat.tags.length > 0)

  return (
    <div 
      ref={containerRef}
      className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] flex flex-col overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ top: "100%" }}
    >
      {/* Search Header */}
      <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50/50 shrink-0">
        <Search className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search variables..."
          className="w-full bg-transparent border-none text-xs focus:ring-0 focus:outline-none placeholder-slate-400 py-0.5 px-0 h-6"
          autoFocus
        />
        {search && (
          <button 
            onClick={() => setSearch("")} 
            className="p-0.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto max-h-60 p-2 space-y-3">
        {/* Recents Section */}
        {recentTags.length > 0 && !search && (
          <div>
            <div className="flex items-center gap-1 px-2 mb-1.5">
              <History className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recently Used</span>
            </div>
            <div className="space-y-0.5">
              {recentTags.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-xs flex flex-col"
                >
                  <span className="font-semibold text-slate-700">{tag.label}</span>
                  <code className="text-[10px] text-blue-600 font-mono mt-0.5">{tag.value}</code>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories Section */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No variables found
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-1 px-2 mb-1.5">
                <FolderOpen className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{cat.label}</span>
              </div>
              <div className="space-y-0.5">
                {cat.tags.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-xs flex flex-col group"
                  >
                    <span className="font-semibold text-slate-750 group-hover:text-blue-600 transition-colors">{tag.label}</span>
                    <code className="text-[10px] text-blue-500 font-mono mt-0.5">{tag.value}</code>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
