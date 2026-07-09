"use client"

import React, { useState, useMemo } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Search, ChevronDown, ChevronUp, Mail, HelpCircle } from "lucide-react"
import { FAQ_DATA, FAQItem, FAQCategory } from "@/lib/faq-data"

interface FAQDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_LABELS: Record<FAQCategory | "all", string> = {
  all: "All",
  "getting-started": "Getting Started",
  campaigns: "Campaigns",
  templates: "Templates",
  contacts: "Contacts",
  deliverability: "Deliverability",
  settings: "Settings",
}

export function FAQDrawer({ isOpen, onClose }: FAQDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | "all">("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Reset states when closed / opened
  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setSelectedCategory("all")
      setExpandedId(null)
    }
  }, [isOpen])

  // Filter FAQs based on search term and category
  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const query = searchTerm.toLowerCase().trim()
      const matchesSearch =
        query === "" ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [searchTerm, selectedCategory])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        {/* Semi-transparent dark overlay */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-xs" />

        {/* Right-aligned panel container */}
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 focus:outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right duration-200"
        >
          {/* Header (Sticky) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                FAQ Library
              </DialogTitle>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4.5 w-4.5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Search bar & Category filters (Sticky top below header) */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Live Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Tabs (Scrollable on overflow) */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-none -mx-2 px-2 scroll-smooth">
              {(Object.keys(CATEGORY_LABELS) as Array<FAQCategory | "all">).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Q&A List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item) => {
                const isExpanded = expandedId === item.id
                return (
                  <div
                    key={item.id}
                    className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-colors"
                  >
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <span className="pr-4">{item.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 mt-1 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                <HelpCircle className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm font-semibold">No questions match your filter.</p>
              </div>
            )}
          </div>

          {/* Footer Support Panel */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 text-center space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Can't find your answer?
            </p>
            <a
              href="mailto:support@theaischool.co"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-blue-500/10"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
