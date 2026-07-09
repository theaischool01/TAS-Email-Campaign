"use client"

import React from "react"
import { 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  BookOpen, 
  Play, 
  Activity, 
  ArrowRight,
  HelpCircle
} from "lucide-react"

interface ResourceItem {
  title: string
  href: string
  icon: React.ReactNode
  colorClass: string
}

interface HelpTopicItem {
  title: string
  href: string
}

const QUICK_RESOURCES: ResourceItem[] = [
  {
    title: "Getting Started Guide",
    href: "#",
    icon: <BookOpen className="w-5 h-5" />,
    colorClass: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20"
  },
  {
    title: "Documentation",
    href: "#",
    icon: <ExternalLink className="w-5 h-5" />,
    colorClass: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20"
  },
  {
    title: "Video Tutorials",
    href: "#",
    icon: <Play className="w-5 h-5" />,
    colorClass: "text-purple-500 bg-purple-500/10 dark:bg-purple-500/20"
  },
  {
    title: "System Status",
    href: "#",
    icon: <Activity className="w-5 h-5" />,
    colorClass: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20"
  }
]

const POPULAR_TOPICS: HelpTopicItem[] = [
  { title: "How do I create my first campaign?", href: "#" },
  { title: "How do I verify my sending domain?", href: "#" },
  { title: "How do I import contacts?", href: "#" },
  { title: "Why did my email fail to send?", href: "#" },
  { title: "How do I use templates?", href: "#" }
]

export function SupportCenter() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm">
      {/* Title Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Support Center</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
          Need help? Explore resources, popular topics, or connect with our support desk.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left Columns (Resources & FAQ topics) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Quick Resources Compact Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Quick Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_RESOURCES.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.href}
                  className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/20 hover:shadow-md transition-all duration-300 h-28"
                >
                  <div className={`p-2 rounded-xl w-fit ${resource.colorClass}`}>
                    {resource.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {resource.title}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Popular Help Topics Rows */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Popular Help Topics
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
              {POPULAR_TOPICS.map((topic) => (
                <a
                  key={topic.title}
                  href={topic.href}
                  className="group flex items-center justify-between py-4 text-sm font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                >
                  <span>{topic.title}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transform group-hover:translate-x-1.5 transition-all duration-300" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Contact Details (Modern Cards/Info Panel) */}
        <div className="lg:col-span-1 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-10 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
              Contact Us
            </h3>
            
            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Office Address</h4>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 mt-1 leading-relaxed">
                    T-Hub 2.0, Knowledge City,<br />Hyderabad, Telangana
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Support Email</h4>
                  <a 
                    href="mailto:support@theaischool.co" 
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                  >
                    support@theaischool.co
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <Phone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Support Phone</h4>
                  <a 
                    href="tel:+919030906584" 
                    className="text-sm font-bold text-slate-800 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-1 block"
                  >
                    +91 90309 06584
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 lg:mt-12">
            <a
              href="mailto:support@theaischool.co"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-blue-500/10 text-center"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
            <a
              href="tel:+919030906584"
              className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
            >
              <Phone className="w-4 h-4" />
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
