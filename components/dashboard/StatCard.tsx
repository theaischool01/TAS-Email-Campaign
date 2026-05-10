import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

interface StatCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    label: string
    isUp: boolean
  }
  status?: 'success' | 'warning' | 'danger' | 'neutral'
  icon?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, status = 'neutral', icon }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'success': return 'text-emerald-500 bg-emerald-500/10'
      case 'warning': return 'text-amber-500 bg-amber-500/10'
      case 'danger': return 'text-rose-500 bg-rose-500/10'
      default: return 'text-blue-500 bg-blue-500/10'
    }
  }

  return (
    <div className="relative overflow-hidden group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Background Decorative Gradient */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity rounded-full ${status === 'success' ? 'bg-emerald-500' : status === 'danger' ? 'bg-rose-500' : 'bg-blue-500'}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
          
          {trend && (
            <div className="mt-3 flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${trend.isUp ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
                {trend.isUp ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-400 font-medium">{trend.label}</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${getStatusClasses()}`}>
          {icon || <div className="w-6 h-6" />}
        </div>
      </div>
    </div>
  )
}
