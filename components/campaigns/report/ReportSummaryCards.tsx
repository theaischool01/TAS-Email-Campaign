import React from 'react'
import { StatCard } from '@/components/dashboard/StatCard'
import { 
  PaperAirplaneIcon, 
  CheckBadgeIcon, 
  EnvelopeOpenIcon, 
  CursorArrowRippleIcon,
  NoSymbolIcon,
  HandRaisedIcon
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
  const openRate = data.delivered > 0 ? (data.uniqueOpens / data.delivered) * 100 : 0
  const clickRate = data.delivered > 0 ? (data.uniqueClicks / data.delivered) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <StatCard 
        title="Sent" 
        value={data.sent.toLocaleString()} 
        icon={<PaperAirplaneIcon className="w-6 h-6" />}
      />
      <StatCard 
        title="Open Rate" 
        value={`${openRate.toFixed(1)}%`} 
        icon={<EnvelopeOpenIcon className="w-6 h-6" />}
        status={openRate >= 20 ? 'success' : 'warning'}
      />
      <StatCard 
        title="Click Rate" 
        value={`${clickRate.toFixed(1)}%`} 
        icon={<CursorArrowRippleIcon className="w-6 h-6" />}
        status={clickRate >= 2 ? 'success' : 'warning'}
      />
      <StatCard 
        title="Bounces" 
        value={data.bounced.toLocaleString()} 
        icon={<NoSymbolIcon className="w-6 h-6" />}
        status={data.bounced > 0 ? 'danger' : 'success'}
      />
      <StatCard 
        title="Complaints" 
        value={data.complained.toLocaleString()} 
        icon={<HandRaisedIcon className="w-6 h-6" />}
        status={data.complained > 0 ? 'danger' : 'success'}
      />
    </div>
  )
}
