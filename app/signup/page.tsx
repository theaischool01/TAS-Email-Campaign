"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Mail, CheckCircle, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create account")
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL — Branding */}
      <div className="hidden lg:flex w-1/2 bg-white flex-col items-center justify-center p-12 relative">
        <div className="absolute top-8 left-12">
          <Image
            src="/theaischool_LOGO.webp"
            alt="The AI School"
            width={280}
            height={80}
            className="object-contain"
          />
        </div>

        <div className="max-w-md">
          <h1 className="font-bold text-slate-900 leading-tight" style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
            Get Started
            <br />
            with <span className="text-red-600">MailFlow</span>
            <br />
            SaaS Platform.
          </h1>
          <p className="text-slate-600 mt-5 text-lg max-w-sm leading-relaxed">
            Create an account, receive 65 onboarding templates, and build marketing campaigns instantly.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-700 text-sm">
              <CheckCircle className="text-red-500 w-4 h-4 shrink-0" />
              <span>Isolated secure database tenant environment</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 text-sm">
              <CheckCircle className="text-red-500 w-4 h-4 shrink-0" />
              <span>Full drag-and-drop visual template editor</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 text-sm">
              <CheckCircle className="text-red-500 w-4 h-4 shrink-0" />
              <span>No credit card required to verify</span>
            </div>
          </div>
        </div>

        <span className="text-slate-400 text-xs absolute bottom-8 left-12">
          © 2026 THE AI SCHOOL. All rights reserved.
        </span>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {/* Mobile Logo Header */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">MailFlow</span>
            </div>

            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-5 h-5 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Create an Account</h2>
            <p className="text-slate-500 text-sm mt-1 mb-8">
              Sign up today and access your own template workspace.
            </p>

            {/* Status Alerts */}
            {error && (
              <div className="mb-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium text-green-800">
                  Account created successfully! Redirecting to login...
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading || success}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || success}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || success}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-150"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Must be at least 8 characters and contain a number, an uppercase letter, and a lowercase letter.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-150"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || success}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors duration-150 text-sm mt-4 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign Up <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center mt-6 text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
