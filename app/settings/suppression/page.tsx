import { prisma } from "@/app/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Shield, Mail, AlertTriangle, UserX, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function SuppressionListPage() {
  const suppressedContacts = await (prisma as any).contact.findMany({
    where: {
      status: {
        in: ['BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED']
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Suppression List</h1>
          <p className="text-gray-500 mt-1">Manage contacts who have bounced, complained, or unsubscribed.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase">Total Suppressed</p>
            <p className="text-2xl font-black text-blue-900">{suppressedContacts.length}</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              Suppressed Contacts
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search emails..." className="pl-9 bg-gray-50 border-none" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppressedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Mail className="h-10 w-10 opacity-20" />
                        <p>No suppressed contacts found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppressedContacts.map((contact: any) => (
                    <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{contact.email}</span>
                          <span className="text-xs text-gray-500">
                            {contact.firstName} {contact.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="secondary"
                          className={`font-bold uppercase text-[10px] ${
                            contact.status === 'BOUNCED' ? 'bg-red-100 text-red-700' :
                            contact.status === 'COMPLAINED' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {contact.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {contact.status === 'BOUNCED' ? (
                            <><AlertTriangle className="h-4 w-4 text-red-400" /> Permanent Failure</>
                          ) : contact.status === 'COMPLAINED' ? (
                            <><AlertTriangle className="h-4 w-4 text-orange-400" /> User Reported Spam</>
                          ) : (
                            <><UserX className="h-4 w-4 text-gray-400" /> Manually Unsubscribed</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(contact.updatedAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
