import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  EnvelopeIcon, 
  CursorArrowRaysIcon, 
  NoSymbolIcon, 
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline'

interface ActivityItem {
  id: string
  action: string
  createdAt: string
  campaign: { name: string }
  contact?: { email: string; firstName?: string; lastName?: string }
  metadata?: any
}

export const RecentActivity: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'EMAIL_OPENED': return <EnvelopeIcon className="w-4 h-4 text-emerald-500" />
      case 'EMAIL_CLICKED': return <CursorArrowRaysIcon className="w-4 h-4 text-blue-500" />
      case 'EMAIL_BOUNCED': return <NoSymbolIcon className="w-4 h-4 text-rose-500" />
      case 'EMAIL_COMPLAINED': return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
      case 'CAMPAIGN_LAUNCHED': return <RocketLaunchIcon className="w-4 h-4 text-indigo-500" />
      case 'EMAIL_UNSUBSCRIBED': return <UserMinusIcon className="w-4 h-4 text-slate-500" />
      default: return <EnvelopeIcon className="w-4 h-4 text-slate-400" />
    }
  }

  const getActionText = (item: ActivityItem) => {
    const contactName = item.contact?.email || 'A recipient'
    switch (item.action) {
      case 'EMAIL_OPENED': return <span><b>{contactName}</b> opened <b>{item.campaign.name}</b></span>
      case 'EMAIL_CLICKED': return <span><b>{contactName}</b> clicked a link in <b>{item.campaign.name}</b></span>
      case 'EMAIL_BOUNCED': return <span><b>{contactName}</b> bounced for <b>{item.campaign.name}</b></span>
      case 'EMAIL_COMPLAINED': return <span><b>{contactName}</b> reported spam for <b>{item.campaign.name}</b></span>
      case 'CAMPAIGN_LAUNCHED': return <span><b>{item.campaign.name}</b> was launched</span>
      default: return <span>Activity on <b>{item.campaign.name}</b></span>
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-bottom border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
        <span className="text-xs font-medium text-slate-400">Live Feed</span>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic">No recent activity found</div>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start space-x-4">
              <div className="mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                {getActionIcon(item.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                  {getActionText(item)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
