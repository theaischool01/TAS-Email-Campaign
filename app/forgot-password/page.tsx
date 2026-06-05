"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Intentionally swallow errors — always show the same message
    } finally {
      setIsLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LEFT PANEL — Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#1a1f2e] flex-col items-center justify-center p-12 relative">
        {/* Top-left Brand Header */}
        <div className="absolute top-8 left-12 flex items-center gap-2">
          <Mail className="h-6 w-6 text-blue-500 shrink-0" />
          <span className="text-lg font-bold text-white tracking-tight">MailFlow</span>
        </div>

        {/* Center content */}
        <div className="max-w-md">
          <h1 className="font-bold text-4xl text-white leading-tight">
            Send smarter campaigns.
          </h1>
          <p className="text-slate-400 mt-4 text-lg max-w-sm leading-relaxed">
            Reach the right people at the right time with powerful email automation.
          </p>

          {/* Feature highlights */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-300 text-sm">
              <CheckCircle className="text-blue-500 w-4 h-4 shrink-0" />
              <span>Drag-and-drop email builder</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-sm">
              <CheckCircle className="text-blue-500 w-4 h-4 shrink-0" />
              <span>Real-time open & click tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-sm">
              <CheckCircle className="text-blue-500 w-4 h-4 shrink-0" />
              <span>Smart audience segmentation</span>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <span className="text-slate-600 text-xs absolute bottom-8 left-12">
          © 2026 MailFlow. All rights reserved.
        </span>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          {/* Card Wrapper */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {/* Mobile Logo Header */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">
                MailFlow
              </span>
            </div>

            {/* Top of Card */}
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-5 h-5 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Reset password</h2>
            <p className="text-slate-500 text-sm mt-1 mb-8">
              Enter your email and we'll send you a reset link
            </p>

            {submitted ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <AlertDescription className="text-green-800 ml-2">
                    If this email exists, a reset link has been sent.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  Check your inbox and follow the link in the email.
                  The link expires in <strong>1 hour</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-150"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors duration-150 text-sm mt-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            )}

            {/* Back to Login Footer */}
            <div className="flex justify-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mt-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
