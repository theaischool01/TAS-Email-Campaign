"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2, RotateCcw, Bell } from "lucide-react"

interface ResubscribeButtonProps {
  variant?: "outline" | "ghost" | "default"
  actionType: "resubscribe" | "reset"
  className?: string
}

export function ResubscribeButton({ variant = "outline", actionType, className }: ResubscribeButtonProps) {
  const { pending } = useFormStatus()

  const isReset = actionType === "reset"

  return (
    <Button 
      type="submit" 
      variant={variant}
      disabled={pending}
      className={`${className} flex items-center justify-center gap-2`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isReset ? (
        <Bell className="h-4 w-4" />
      ) : (
        <RotateCcw className="h-4 w-4" />
      )}
      {pending ? "Processing..." : isReset ? "Reset to Active" : "Re-subscribe me"}
    </Button>
  )
}
