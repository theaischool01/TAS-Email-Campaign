import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient() as any

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // SNS Message handling
    // SNS sends a 'SubscriptionConfirmation' first
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('📬 SES Webhook: Received SNS Subscription Confirmation')
      console.log('🔗 URL:', body.SubscribeURL)
      // In a real app, you would auto-confirm by fetching this URL
      return NextResponse.json({ message: "Subscription confirmation received" })
    }

    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message)
      const eventType = message.eventType
      const mail = message.mail
      
      // SES includes 'headers' or 'tags' where we can find campaignId and contactId
      // We should have sent these as Message Tags or Headers
      const tags = mail.tags || {}
      const campaignId = tags['campaignId']?.[0]
      const contactId = tags['contactId']?.[0]

      if (!campaignId) {
        console.warn('⚠️ SES Webhook: Missing campaignId in event tags')
        return NextResponse.json({ message: "Missing campaignId" })
      }

      console.log(`📊 SES Event: ${eventType} for Campaign: ${campaignId}`)

      if (eventType === 'Open') {
        await prisma.campaignActivityLog.create({
          data: {
            campaignId,
            action: 'EMAIL_OPENED',
            actorId: contactId || 'ses-native',
            metadata: {
              timestamp: message.open.timestamp,
              userAgent: message.open.userAgent,
              ipAddress: message.open.ipAddress
            }
          }
        })

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalOpened: { increment: 1 } }
        })
      }

      if (eventType === 'Click') {
        await prisma.campaignActivityLog.create({
          data: {
            campaignId,
            action: 'EMAIL_CLICKED',
            actorId: contactId || 'ses-native',
            metadata: {
              timestamp: message.click.timestamp,
              url: message.click.link,
              userAgent: message.click.userAgent,
              ipAddress: message.click.ipAddress
            }
          }
        })

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalClicked: { increment: 1 } }
        })
      }
      
      // Handle Bounces/Complaints if needed
      if (eventType === 'Bounce' || eventType === 'Complaint') {
        console.error(`❌ SES delivery issue: ${eventType}`)
        // Update contact status to BOUNCED or unsubscribed here
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ SES Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
