'use client'
import React from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface TimelineProps {
  data: Array<{ time: string, count: number }>
}

export const OpenTimelineChart: React.FC<TimelineProps> = ({ data }) => {
  // Format the time for display (just show HH:00 or DD/MM)
  const chartData = data.map(item => ({
    ...item,
    displayTime: item.time.split(' ').length > 1 ? item.time.split(' ')[1] : item.time
  }))

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Engagement Over Time</h3>
        <p className="text-sm text-slate-500">Hourly/Daily distribution of email opens</p>
      </div>
      
      <div className="h-[300px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            No engagement data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="displayTime" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  backgroundColor: '#ffffff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
