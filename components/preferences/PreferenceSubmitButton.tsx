"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"

export function PreferenceSubmitButton() {
  const { pending } = useFormStatus()
  const [success, setSuccess] = useState(false)
  const [wasPending, setWasPending] = useState(false)

  useEffect(() => {
    if (wasPending && !pending) {
      setSuccess(true)
      const timer = setTimeout(() => setSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
    setWasPending(pending)
  }, [pending, wasPending])

  if (success) {
    return (
      <Button 
        type="button" 
        className="w-full h-14 rounded-2xl text-lg font-bold transition-all bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="h-6 w-6" />
        Preferences Saved ✓
      </Button>
    )
  }

  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.01] transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          Saving...
        </>
      ) : (
        "Save My Preferences"
      )}
    </Button>
  )
}
