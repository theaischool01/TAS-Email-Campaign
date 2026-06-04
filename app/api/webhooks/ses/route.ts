import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { isBotUserAgent } from "@/lib/utils/bot-detection"
// @ts-ignore
import MessageValidator from "sns-validator"
import logger from "@/lib/logger"

const prisma = prismaClient as any
const validator = new MessageValidator()

function validateSnsMessage(payload: any): Promise<boolean> {
  return new Promise((resolve) => {
    validator.validate(payload, (err: any) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // SNS signature verification gate
    const isValid = await validateSnsMessage(body)
    if (!isValid) {
      logger.warn({ timestamp: new Date().toISOString() }, "SNS signature validation failed")
      return NextResponse.json({ error: "Invalid SNS signature" }, { status: 403 })
    }
    
    // SNS Message handling
    if (body.Type === 'SubscriptionConfirmation') {
      const subscribeUrl = body.SubscribeURL
      if (subscribeUrl) {
        await fetch(subscribeUrl)
        logger.info(`[SES WEBHOOK] Successfully confirmed subscription via GET to: ${subscribeUrl}`)
      }
      return NextResponse.json({ message: "Subscription confirmed" })
    }

    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message)
      const eventType = message.eventType
      const campaignId = message.mail.tags?.['campaignId']?.[0] || message.mail.headers?.find((h: any) => h.name === 'X-Campaign-ID')?.value
      const contactId = message.mail.tags?.['contactId']?.[0] || message.mail.headers?.find((h: any) => h.name === 'X-Contact-ID')?.value

      logger.info(`[SES WEBHOOK] Event: ${eventType}, Campaign: ${campaignId}, Contact: ${contactId}`);
      if (!campaignId) {
        logger.info({ mail: message.mail }, '[SES WEBHOOK] Missing campaignId. Full mail object:');
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
        const isHardBounce = bounce.bounceType === 'Permanent';
        const isSoftBounce = bounce.bounceType === 'Transient' || 
                             bounce.bounceType === 'Undetermined';

        for (const recipient of recipients) {
          const email = recipient.emailAddress;

          const existingBounce = await prisma.campaignActivityLog.findFirst({
            where: { 
              campaignId, 
              action: 'EMAIL_BOUNCED', 
              metadata: { path: ['email'], equals: email } 
            }
          })

          if (!existingBounce) {
            if (isHardBounce) {
              // Hard bounce — mark BOUNCED immediately + add to suppression
              await prisma.contact.updateMany({
                where: { email },
                data: { status: 'BOUNCED' }
              });

              await prisma.suppressionList.upsert({
                where: { email },
                update: { reason: `SES Permanent Bounce (${bounce.bounceSubType})` },
                create: { email, reason: `SES Permanent Bounce (${bounce.bounceSubType})` }
              });

              logger.warn({ email, bounceSubType: bounce.bounceSubType }, 
                'Hard bounce — contact marked BOUNCED and suppressed')

            } else if (isSoftBounce) {
              // Soft bounce — increment counter, only suppress after 3
              const contact = await prisma.contact.findFirst({
                where: { email },
                select: { id: true, softBounceCount: true }
              });

              if (contact) {
                const newCount = (contact.softBounceCount || 0) + 1;

                if (newCount >= 3) {
                  // 3 soft bounces = treat as hard bounce
                  await prisma.contact.update({
                    where: { id: contact.id },
                    data: { 
                      status: 'BOUNCED',
                      softBounceCount: newCount
                    }
                  });

                  await prisma.suppressionList.upsert({
                    where: { email },
                    update: { reason: `SES Soft Bounce x3 (${bounce.bounceSubType})` },
                    create: { email, reason: `SES Soft Bounce x3 (${bounce.bounceSubType})` }
                  });

                  logger.warn({ email, softBounceCount: newCount }, 
                    'Soft bounce x3 — contact marked BOUNCED and suppressed')
                } else {
                  // Under 3 — just increment, keep ACTIVE
                  await prisma.contact.update({
                    where: { id: contact.id },
                    data: { softBounceCount: newCount }
                  });

                  logger.info({ email, softBounceCount: newCount }, 
                    'Soft bounce recorded — contact still ACTIVE')
                }
              }
            }

            // Always log the bounce activity
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
                  bounceSubType: bounce.bounceSubType,
                  isSoftBounce: isSoftBounce
                }
              }
            });
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

            // Calculate complaint rate and alert if threshold exceeded
            const updatedCampaign = await prisma.campaign.findUnique({
              where: { id: campaignId },
              select: { totalComplained: true, totalSent: true, name: true }
            })

            if (updatedCampaign && updatedCampaign.totalSent > 0) {
              const complaintRate = updatedCampaign.totalComplained / updatedCampaign.totalSent

              if (complaintRate >= 0.005) {
                // 0.5% — SES suspension risk
                logger.error({ 
                  campaignId, 
                  campaignName: updatedCampaign.name,
                  complaintRate: (complaintRate * 100).toFixed(3) + '%',
                  totalComplained: updatedCampaign.totalComplained,
                  totalSent: updatedCampaign.totalSent
                }, 'CRITICAL: Complaint rate above 0.5% — SES suspension risk')

                await prisma.campaign.update({
                  where: { id: campaignId },
                  data: { status: 'PAUSED' }
                })

                await prisma.campaignActivityLog.create({
                  data: {
                    campaignId,
                    action: 'COMPLAINT_RATE_CRITICAL',
                    actorId: 'ses-native',
                    metadata: {
                      complaintRate,
                      totalComplained: updatedCampaign.totalComplained,
                      totalSent: updatedCampaign.totalSent,
                      action: 'campaign_paused'
                    }
                  }
                })

              } else if (complaintRate >= 0.001) {
                // 0.1% — SES warning threshold
                logger.warn({ 
                  campaignId,
                  campaignName: updatedCampaign.name,
                  complaintRate: (complaintRate * 100).toFixed(3) + '%',
                  totalComplained: updatedCampaign.totalComplained,
                  totalSent: updatedCampaign.totalSent
                }, 'WARNING: Complaint rate above 0.1% — monitor closely')

                await prisma.campaignActivityLog.create({
                  data: {
                    campaignId,
                    action: 'COMPLAINT_RATE_WARNING',
                    actorId: 'ses-native',
                    metadata: {
                      complaintRate,
                      totalComplained: updatedCampaign.totalComplained,
                      totalSent: updatedCampaign.totalSent
                    }
                  }
                })
              }
            }
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
    logger.error({ error }, '❌ SES Webhook Error:')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
