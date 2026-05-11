import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

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
            contactId: contactId,
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
            contactId: contactId,
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
      
      // M7: Handle Bounces
      if (eventType === 'Bounce') {
        const bounce = message.bounce;
        const recipients = bounce.bouncedRecipients || [];
        
        for (const recipient of recipients) {
          const email = recipient.emailAddress;
          console.log(`🚫 Bounced: ${email}`);
          
          await prisma.contact.updateMany({
            where: { email },
            data: { status: 'BOUNCED' }
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalBounced: { increment: 1 } }
          });

          await prisma.campaignActivityLog.create({
            data: {
              campaignId,
              action: 'EMAIL_BOUNCED',
              actorId: contactId || 'ses-native',
              contactId: contactId,
              metadata: { 
                email, 
                bounceType: bounce.bounceType,
                bounceSubType: bounce.bounceSubType 
              }
            }
          });
        }
      }

      // M7: Handle Complaints
      if (eventType === 'Complaint') {
        const complaint = message.complaint;
        const recipients = complaint.complainedRecipients || [];
        
        for (const recipient of recipients) {
          const email = recipient.emailAddress;
          console.log(`⚠️ Complaint: ${email}`);
          
          await prisma.contact.updateMany({
            where: { email },
            data: { status: 'COMPLAINED' }
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalComplained: { increment: 1 } }
          });

          await prisma.campaignActivityLog.create({
            data: {
              campaignId,
              action: 'EMAIL_COMPLAINED',
              actorId: contactId || 'ses-native',
              contactId: contactId,
              metadata: { email, complaintFeedbackType: complaint.complaintFeedbackType }
            }
          });
        }
      }

      // M8: Handle Subscriptions (Unsubscribes via List-Unsubscribe header)
      if (eventType === 'Subscription') {
        console.log(`🔕 Unsubscribe event received for Campaign: ${campaignId}`);
        // SES 'Subscription' event usually contains the email
        // We'll update the specific contact if contactId is present
        if (contactId) {
          await prisma.contact.update({
            where: { id: contactId },
            data: { status: 'UNSUBSCRIBED' }
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalUnsubscribed: { increment: 1 } }
          });
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ SES Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
