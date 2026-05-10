import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"

const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        activityLogs: {
          include: {
            contact: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!campaign) {
      return new Response("Campaign not found", { status: 404 })
    }

    if (!CampaignAccessControl.canViewCampaign(session, campaign)) {
      return new Response("Forbidden", { status: 403 })
    }

    // Generate CSV
    const headers = ["Timestamp", "Email", "Name", "Action", "Detail"]
    const rows = campaign.activityLogs.map((log: any) => {
      const metadata = log.metadata || {}
      let detail = ""
      if (log.action === 'EMAIL_CLICKED') detail = metadata.url || ""
      if (log.action === 'EMAIL_BOUNCED') detail = metadata.bounceType || ""
      
      return [
        log.createdAt.toISOString(),
        log.contact?.email || "Unknown",
        `${log.contact?.firstName || ""} ${log.contact?.lastName || ""}`.trim(),
        log.action,
        detail
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="campaign-report-${id}.csv"`
      }
    })
  } catch (error) {
    console.error("📊 CSV Export Error:", error)
    return new Response("Failed to generate export", { status: 500 })
  }
}
