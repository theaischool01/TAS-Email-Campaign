import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { PrismaClient } from "@prisma/client"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import { sendSingleEmail } from "@/lib/services/email.service"
import { z } from "zod"

const prisma = new PrismaClient() as any

const testSendSchema = z.object({
  emails: z
    .array(z.string().email("Invalid email format"))
    .min(1, "At least one email is required")
    .max(5, "Maximum 5 test emails allowed"),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: campaignId } = await params
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: { select: { id: true, html: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC: Check if user can access campaign
    if (!CampaignAccessControl.canAccessCampaign(session, campaign.createdBy)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only allow testing drafts
    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft campaigns can be tested" },
        { status: 400 }
      )
    }

    if (!campaign.template?.html) {
      return NextResponse.json(
        { error: "Campaign has no template or the template has no HTML content. Please select a template in Step 3 before sending a test." },
        { status: 422 }
      )
    }

    const body = await request.json()
    const validatedData = testSendSchema.parse(body)

    // Prepend [TEST] to the subject
    const testSubject = `[TEST] ${campaign.subject || "Test Email"}`

    // Send real emails via AWS SES
    const sendResults = await Promise.allSettled(
      validatedData.emails.map((email) =>
        sendSingleEmail({
          to: { email, firstName: "Test", lastName: "Recipient" },
          subject: testSubject,
          html: campaign.template.html,
          fromName: campaign.senderName || campaign.user?.name || "Email Campaign Platform",
          fromEmail: campaign.senderEmail || process.env.SES_FROM_EMAIL,
          replyTo: campaign.replyToEmail || undefined,
          // No campaignId here so we don't inject tracking in test emails
        })
      )
    )

    const sent: string[] = []
    const failed: string[] = []
    sendResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        sent.push(validatedData.emails[index])
      } else {
        failed.push(validatedData.emails[index])
        console.error(`❌ Test send failed for ${validatedData.emails[index]}:`, result.reason)
      }
    })

    // Log test sends in DB
    await Promise.allSettled(
      sent.map((email) =>
        prisma.campaignTestSend.create({
          data: {
            campaignId,
            email,
            sentBy: session.user.id,
            sentAt: new Date(),
          },
        })
      )
    )

    if (failed.length > 0 && sent.length === 0) {
      return NextResponse.json(
        {
          error: "All test emails failed to send. Please check your AWS SES configuration and ensure your sender email is verified.",
          failed,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${sent.length} recipient(s)${failed.length > 0 ? `. ${failed.length} failed.` : ""}`,
      sent,
      failed,
    })
  } catch (error) {
    console.error("❌ POST /api/campaigns/[id]/test error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
