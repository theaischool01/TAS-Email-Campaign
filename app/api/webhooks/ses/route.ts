import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { isBotUserAgent } from "@/lib/utils/bot-detection"

const prisma = prismaClient as any

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // SNS Message handling
    if (body.Type === 'SubscriptionConfirmation') {
      return NextResponse.json({ message: "Subscription confirmation received" })
    }

    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message)
      const eventType = message.eventType
      const campaignId = message.mail.tags?.['campaignId']?.[0] || message.mail.headers?.find((h: any) => h.name === 'X-Campaign-ID')?.value
      const contactId = message.mail.tags?.['contactId']?.[0] || message.mail.headers?.find((h: any) => h.name === 'X-Contact-ID')?.value

      console.log(`[SES WEBHOOK] Event: ${eventType}, Campaign: ${campaignId}, Contact: ${contactId}`);
      if (!campaignId) {
        console.log('[SES WEBHOOK] Missing campaignId. Full mail object:', JSON.stringify(message.mail, null, 2));
        return NextResponse.json({ message: "Missing campaignId" })
      }

      if (eventType === 'Open') {
        const ua = message.open?.userAgent || ''
        const ip = message.open?.ipAddress || ''
        const isBot = isBotUserAgent(ua, ip)

        const existingOpen = await prisma.campaignActivityLog.findFirst({
          where: { campaignId, contactId, action: 'EMAIL_OPENED', metadata: { path: ['isBot'], equals: false } }
        })

        if (!existingOpen && !isBot) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalOpened: { increment: 1 } }
          })
        }
      }

      if (eventType === 'Click') {
        const ua = message.click?.userAgent || ''
        const ip = message.click?.ipAddress || ''
        const isBot = isBotUserAgent(ua, ip)

        // Check if already counted
        const existingClick = await prisma.campaignActivityLog.findFirst({
          where: { campaignId, contactId, action: 'EMAIL_CLICKED', metadata: { path: ['isBot'], equals: false } }
        })

        await prisma.campaignActivityLog.create({
          data: {
            campaignId,
            action: 'EMAIL_CLICKED',
            actorId: contactId || 'ses-native',
            contactId: contactId,
            metadata: {
              source: 'ses-native',
              isBot,
              timestamp: message.click.timestamp,
              url: message.click.link,
              userAgent: ua,
              ipAddress: message.click.ipAddress
            }
          }
        })

        if (!existingClick && !isBot) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalClicked: { increment: 1 } }
          })
        }
      }
      
      // M7: Handle Bounces
      if (eventType === 'Bounce') {
        const bounce = message.bounce;
        const recipients = bounce.bouncedRecipients || [];
        
        for (const recipient of recipients) {
          const email = recipient.emailAddress;
          
          // Check if this bounce was already recorded for this campaign
          const existingBounce = await prisma.campaignActivityLog.findFirst({
            where: { campaignId, action: 'EMAIL_BOUNCED', metadata: { path: ['email'], equals: email } }
          })

          if (!existingBounce) {
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
                  source: 'ses-native',
                  bounceType: bounce.bounceType,
                  bounceSubType: bounce.bounceSubType 
                }
              }
            });

            // Add to suppression list for permanent bounces
            if (bounce.bounceType === 'Permanent') {
              await prisma.suppressionList.upsert({
                where: { email },
                update: { reason: `SES Permanent Bounce (${bounce.bounceSubType})` },
                create: { email, reason: `SES Permanent Bounce (${bounce.bounceSubType})` }
              });
            }
          }
        }
      }

      // M7: Handle Complaints
      if (eventType === 'Complaint') {
        const complaint = message.complaint;
        const recipients = complaint.complainedRecipients || [];
        
        for (const recipient of recipients) {
          const email = recipient.emailAddress;

          // Check if already recorded
          const existingComplaint = await prisma.campaignActivityLog.findFirst({
            where: { campaignId, action: 'EMAIL_COMPLAINED', metadata: { path: ['email'], equals: email } }
          })

          if (!existingComplaint) {
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
                metadata: { 
                  email, 
                  source: 'ses-native',
                  complaintFeedbackType: complaint.complaintFeedbackType 
                }
              }
            });

            // Add to suppression list for complaints
            await prisma.suppressionList.upsert({
              where: { email },
              update: { reason: `SES Complaint (${complaint.complaintFeedbackType})` },
              create: { email, reason: `SES Complaint (${complaint.complaintFeedbackType})` }
            });
          }
        }
      }

      // M8: Handle Subscriptions
      if (eventType === 'Subscription') {
        // Check if already recorded
        const existingUnsub = await prisma.campaignActivityLog.findFirst({
          where: { campaignId, contactId, action: 'EMAIL_UNSUBSCRIBED' }
        })

        if (contactId && !existingUnsub) {
          await prisma.contact.update({
            where: { id: contactId },
            data: { status: 'UNSUBSCRIBED' }
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalUnsubscribed: { increment: 1 } }
          });

          await prisma.campaignActivityLog.create({
            data: {
              campaignId,
              action: 'EMAIL_UNSUBSCRIBED',
              actorId: contactId,
              contactId: contactId,
              metadata: { source: 'ses-native' }
            }
          })

          // Add to suppression list for SES-native unsubscribes
          const contact = await prisma.contact.findUnique({ where: { id: contactId } });
          if (contact) {
            await prisma.suppressionList.upsert({
              where: { email: contact.email },
              update: { reason: 'SES Native Unsubscribe' },
              create: { email: contact.email, reason: 'SES Native Unsubscribe' }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ SES Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
