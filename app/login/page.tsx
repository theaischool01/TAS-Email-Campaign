"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Mail, CheckCircle } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LEFT PANEL — Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0d1117] flex-col items-center justify-center p-12 relative">
        {/* Top-left Logo */}
        <div className="absolute top-8 left-12">
          <Image
            src="/theaischool_LOGO.webp"
            alt="The AI School"
            width={280}
            height={80}
            className="object-contain brightness-0 invert"
          />
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
              <CheckCircle className="text-red-500 w-4 h-4 shrink-0" />
              <span>Drag-and-drop email builder</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-sm">
              <CheckCircle className="text-red-500 w-4 h-4 shrink-0" />
              <span>Real-time open & click tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-sm">
              <CheckCircle className="text-red-500 w-4 h-4 shrink-0" />
              <span>Smart audience segmentation</span>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <span className="text-slate-600 text-xs absolute bottom-8 left-12">
          © 2026 THE AI SCHOOL. All rights reserved.
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

            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1 mb-8">
              Enter your email and password to access your account
            </p>

            {/* Error alerts */}
            {error && (
              <div className="mb-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Form */}
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

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-150"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Remember Me & Submit */}
              <div className="flex items-center gap-2 mt-4 mb-6">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal text-slate-600 cursor-pointer">
                  Remember me for 3 days
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors duration-150 text-sm mt-2"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
