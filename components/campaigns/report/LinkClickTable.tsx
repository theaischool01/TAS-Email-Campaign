import React from 'react'

interface LinkStat {
  url: string
  clicks: number
  uniqueClicks: number
  percent: number
}

export const LinkClickTable: React.FC<{ links: LinkStat[] }> = ({ links }) => {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Link Click Breakdown</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Target URL</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Clicks</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unique Clicks</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {links.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No links clicked in this campaign</td>
              </tr>
            ) : (
              links.map((link, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate text-sm font-medium text-blue-600 hover:underline">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{link.clicks}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-500 dark:text-slate-400">{link.uniqueClicks}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                      {link.percent.toFixed(1)}%
                    </span>
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
