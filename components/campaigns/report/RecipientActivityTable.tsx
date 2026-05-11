import React from 'react'
import { format } from 'date-fns'

interface RecipientActivity {
  id: string
  createdAt: string
  action: string
  contact: {
    email: string
    firstName?: string
    lastName?: string
  }
}

export const RecipientActivityTable: React.FC<{ activities: RecipientActivity[] }> = ({ activities }) => {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Detailed Recipient Activity</h3>
        <span className="text-xs font-medium text-slate-400">Last {activities.length} events</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No activity recorded for this campaign yet</td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {activity.contact?.firstName 
                          ? `${activity.contact.firstName} ${activity.contact.lastName || ''}` 
                          : activity.contact?.email || 'System / Admin'}
                      </span>
                      {activity.contact?.firstName && (
                        <span className="text-xs text-slate-500">{activity.contact.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold 
                      ${activity.action === 'EMAIL_OPENED' ? 'bg-emerald-50 text-emerald-700' : 
                        activity.action === 'EMAIL_CLICKED' ? 'bg-blue-50 text-blue-700' : 
                        activity.action === 'EMAIL_BOUNCED' ? 'bg-rose-50 text-rose-700' :
                        activity.action === 'CAMPAIGN_LAUNCHED' ? 'bg-purple-50 text-purple-700' :
                        'bg-slate-50 text-slate-700'}`}>
                      {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace('Email ', '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
