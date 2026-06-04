import { Mail, ShieldCheck, Globe, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Mail className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Email Campaign Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Communicate with <span className="text-blue-600">Impact</span>.
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          The enterprise-grade platform for managing your email campaigns, 
          contact lists, and detailed analytics with ease and precision.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button size="lg" className="px-10 py-7 text-lg rounded-full" asChild>
            <Link href="/login">Login to Dashboard</Link>
          </Button>
        </div>

        {/* Simple Features */}
        <div className="grid md:grid-cols-3 gap-12 w-full mt-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">High Deliverability</h3>
            <p className="text-gray-500 text-sm">Powered by AWS SES for maximum reliability.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Privacy First</h3>
            <p className="text-gray-500 text-sm">Secure data handling and easy opt-outs.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Global Scale</h3>
            <p className="text-gray-500 text-sm">Send to thousands of recipients in seconds.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">
            &copy; 2026 Email Campaign Platform. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
