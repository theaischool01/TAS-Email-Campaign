import React from 'react'
import { StatCard } from '@/components/dashboard/StatCard'
import { 
  PaperAirplaneIcon, 
  EnvelopeOpenIcon, 
  CursorArrowRippleIcon,
  NoSymbolIcon,
  HandRaisedIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline'

interface SummaryProps {
  data: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    unsubscribed: number
    uniqueOpens: number
    uniqueClicks: number
  }
}

export const ReportSummaryCards: React.FC<SummaryProps> = ({ data }) => {
  const total = data.sent || 0
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard 
        title="Sent" 
        value={data.sent.toLocaleString()} 
        icon={<PaperAirplaneIcon className="w-6 h-6" />}
      />
      <StatCard 
        title="Open Rate" 
        value={`${data.uniqueOpens} / ${total}`} 
        icon={<EnvelopeOpenIcon className="w-6 h-6" />}
        status={(data.uniqueOpens / (total || 1)) >= 0.2 ? 'success' : 'warning'}
      />
      <StatCard 
        title="Click Rate" 
        value={`${data.uniqueClicks} / ${total}`} 
        icon={<CursorArrowRippleIcon className="w-6 h-6" />}
        status={(data.uniqueClicks / (total || 1)) >= 0.02 ? 'success' : 'warning'}
      />
      <StatCard 
        title="Bounces" 
        value={`${data.bounced} / ${total}`} 
        icon={<NoSymbolIcon className="w-6 h-6" />}
        status={data.bounced > 0 ? 'danger' : 'success'}
      />
      <StatCard 
        title="Complaints" 
        value={`${data.complained} / ${total}`} 
        icon={<HandRaisedIcon className="w-6 h-6" />}
        status={data.complained > 0 ? 'danger' : 'success'}
      />
      <StatCard 
        title="Unsubscribed" 
        value={`${data.unsubscribed || 0} / ${total}`} 
        icon={<UserMinusIcon className="w-6 h-6" />}
        status={data.unsubscribed > 0 ? 'warning' : 'success'}
      />
    </div>
  )
}
