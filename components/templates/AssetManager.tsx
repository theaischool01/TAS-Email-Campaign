"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Upload, Image as ImageIcon, Check, Loader2, X, Folder, AlertTriangle } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"

interface Asset {
  id: string
  name: string
  url: string
  category: "recent" | "logos" | "images" | "icons"
  size?: string
}

// ─── Default Company Logos & Illustration Assets ──────────────────────────
const DEFAULT_ASSETS: Asset[] = [
  {
    id: "logo-main",
    name: "Main Corporate Logo",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60",
    category: "logos"
  },
  {
    id: "logo-dark",
    name: "Dark Mode Logo",
    url: "https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=200&auto=format&fit=crop&q=60",
    category: "logos"
  },
  {
    id: "logo-light",
    name: "Light Mode Logo",
    url: "https://images.unsplash.com/photo-1618005158179-023f9ec367eb?w=200&auto=format&fit=crop&q=60",
    category: "logos"
  },
  {
    id: "logo-footer",
    name: "Footer Branding Logo",
    url: "https://images.unsplash.com/photo-1618004611127-ae8a1950e118?w=200&auto=format&fit=crop&q=60",
    category: "logos"
  },
  {
    id: "img-hero-placeholder",
    name: "Hero Placeholder Banner",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80",
    category: "images"
  },
  {
    id: "img-products-placeholder",
    name: "Product Collection Group",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80",
    category: "images"
  },
  {
    id: "icon-fb",
    name: "Facebook Square Icon",
    url: "https://cdn-icons-png.flaticon.com/512/124/124010.png",
    category: "icons"
  },
  {
    id: "icon-tw",
    name: "Twitter Circle Icon",
    url: "https://cdn-icons-png.flaticon.com/512/124/124021.png",
    category: "icons"
  },
  {
    id: "icon-ln",
    name: "LinkedIn Rounded Icon",
    url: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
    category: "icons"
  }
]

interface AssetManagerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function AssetManager({ onSelect, onClose }: AssetManagerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "logos" | "images" | "icons">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Load uploaded assets from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mailflow_uploaded_assets")
      if (stored) {
        const uploaded: Asset[] = JSON.parse(stored)
        setAssets([...uploaded, ...DEFAULT_ASSETS])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // 2. Setup UploadThing Hook
  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url
        const newAsset: Asset = {
          id: `uploaded-${Date.now()}`,
          name: res[0].name || "Uploaded File",
          url: uploadedUrl,
          category: "recent",
          size: `${Math.round(res[0].size / 1024)} KB`
        }

        // Save to local state and localStorage
        const stored = localStorage.getItem("mailflow_uploaded_assets")
        const uploadedList: Asset[] = stored ? JSON.parse(stored) : []
        const newList = [newAsset, ...uploadedList]
        localStorage.setItem("mailflow_uploaded_assets", JSON.stringify(newList))

        setAssets([...newList, ...DEFAULT_ASSETS])
        setValidationWarning(null)
        
        // Auto select and close
        onSelect(uploadedUrl)
        onClose()
      }
    },
    onUploadError: (err) => {
      console.error("Upload error:", err)
      setValidationWarning(`Upload failed: ${err.message}`)
    }
  })

  // 3. File upload handler with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Size Validation (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setValidationWarning("File size exceeds 4MB. Please compress the image.")
      return
    }

    // Format Validation
    const allowedFormats = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
    if (!allowedFormats.includes(file.type)) {
      setValidationWarning("Unsupported file format. Please upload PNG, JPG, GIF or WEBP.")
      return
    }

    setValidationWarning(null)
    startUpload([file])
  }

  // 4. Filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || asset.category === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl h-[560px] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <ImageIcon className="h-4.5 w-4.5 text-indigo-650" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Media Asset Manager</h3>
              <p className="text-[10px] text-slate-450 font-medium">Manage corporate logos, campaign banners, and dynamic icons</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-650 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel category sidebar */}
          <div className="w-48 border-r border-slate-100 bg-slate-50/20 p-3 flex flex-col gap-1 shrink-0 select-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">Library</span>
            <button
              onClick={() => setActiveTab("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "all" ? "bg-indigo-50 text-indigo-650" : "hover:bg-slate-100/60 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              All Assets
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "recent" ? "bg-indigo-50 text-indigo-650" : "hover:bg-slate-100/60 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              Recent Uploads
            </button>
            <button
              onClick={() => setActiveTab("logos")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "logos" ? "bg-indigo-50 text-indigo-650" : "hover:bg-slate-100/60 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              Company Logos
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "images" ? "bg-indigo-50 text-indigo-650" : "hover:bg-slate-100/60 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              Images
            </button>
            <button
              onClick={() => setActiveTab("icons")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "icons" ? "bg-indigo-50 text-indigo-650" : "hover:bg-slate-100/60 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              Icons
            </button>
          </div>

          {/* Main workspace */}
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4 bg-white">
            {/* Search and upload bar */}
            <div className="flex gap-3 items-center shrink-0">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets by file name..."
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-700 bg-slate-50 h-9"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-750 text-white font-semibold text-xs px-4 h-9 shadow-sm shrink-0 flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>

            {/* Warning banner */}
            {validationWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 shrink-0 text-amber-800 text-[11px] font-medium leading-relaxed">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Thumbnail grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <ImageIcon className="h-10 w-10 text-slate-200 mb-2.5" />
                  No assets match your search
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 pb-4">
                  {filteredAssets.map((asset) => (
                    <div 
                      key={asset.id}
                      onClick={() => onSelect(asset.url)}
                      className="group cursor-pointer border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-500 hover:shadow-md transition-all duration-200 bg-slate-50/50 flex flex-col relative aspect-[4/3] max-h-36"
                    >
                      <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center p-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.name}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-2 border-t border-slate-100 bg-white shrink-0">
                        <p className="text-[10px] font-semibold text-slate-700 truncate" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wide">
                          {asset.size || asset.category}
                        </p>
                      </div>
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
