const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand, CreateQueueCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
require('dotenv').config();
const http = require('http');

// Render requires a web server to stay alive on the free tier
const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Worker is running and healthy!\n');
}).listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

const prisma = new PrismaClient();
console.log('🔗 DB Connection check:', process.env.DATABASE_URL ? 'URL Found' : 'URL Missing');

const awsConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const sqsClient = new SQSClient(awsConfig);
const sesClient = new SESClient(awsConfig);
const QUEUE_NAME = "EmailDispatchQueue";

let queueUrl = null;

async function getQueueUrl() {
  if (queueUrl) return queueUrl;
  try {
    const command = new GetQueueUrlCommand({ QueueName: QUEUE_NAME });
    const response = await sqsClient.send(command);
    queueUrl = response.QueueUrl;
    return queueUrl;
  } catch (error) {
    if (error.name === "QueueDoesNotExist" || error.Code === "QueueDoesNotExist") {
      console.log(`Queue ${QUEUE_NAME} does not exist. Creating it...`);
      const command = new CreateQueueCommand({ QueueName: QUEUE_NAME });
      const response = await sqsClient.send(command);
      queueUrl = response.QueueUrl;
      return queueUrl;
    }
    throw error;
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

cron.schedule('* * * * *', async () => {
  console.log('⏰ Checking for scheduled campaigns...');
  try {
    const now = new Date();
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now }
      },
      include: {
        recipientLists: {
          include: {
            contactList: {
              include: {
                members: {
                  include: {
                    contact: true
                  }
                }
              }
            }
          }
        },
        template: true
      }
    });
    
    // ─── Status Cleanup ──────────────────────────────────────────────────
    // Find SENDING campaigns that are actually finished but got stuck
    const stuckCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SENDING'
      }
    });

    for (const campaign of stuckCampaigns) {
      if (campaign.totalSent + campaign.totalFailed >= campaign.recipientCount && campaign.recipientCount > 0) {
        console.log(`🧹 Cleaning up stuck campaign: ${campaign.name} (${campaign.id})`);
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'SENT', sentAt: campaign.sentAt || new Date() }
        });
      }
    }

    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Triggering scheduled campaign: ${campaign.name} (${campaign.id})`);
      
      // Collect all recipients
      const recipients = [];
      campaign.recipientLists.forEach(rl => {
        rl.contactList.members.forEach(m => {
          if (m.contact && m.contact.status === 'ACTIVE') {
            recipients.push({
              email: m.contact.email,
              firstName: m.contact.firstName,
              lastName: m.contact.lastName,
              contactId: m.contact.id
            });
          }
        });
      });

      // Update status to SENDING and set recipientCount
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { 
          status: 'SENDING',
          recipientCount: recipients.length,
          sentAt: new Date(),
          totalSent: 0
        }
      });

      const qUrl = await getQueueUrl();
      for (const recipient of recipients) {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: qUrl,
          MessageBody: JSON.stringify({
            campaignId: campaign.id,
            recipient
          })
        }));
      }
      
      console.log(`✅ Enqueued ${recipients.length} recipients for campaign ${campaign.id}`);
    }
  } catch (error) {
    console.error('❌ Error in scheduler:', error);
  }
});

// ─── Queue Processor ─────────────────────────────────────────────────────────

async function processQueue() {
  console.log('📬 Worker started, polling for messages...');
  const qUrl = await getQueueUrl();

  while (true) {
    try {
      const response = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: qUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
      }));

      if (!response.Messages || response.Messages.length === 0) {
        continue;
      }

      for (const message of response.Messages) {
        const body = JSON.parse(message.Body);
        const { campaignId, recipient } = body;

        // Check campaign status
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { template: true }
        });

        if (!campaign || campaign.status === 'PAUSED' || campaign.status === 'CANCELLED' || campaign.status === 'SENT') {
          console.log(`⏸️ Skipping send for campaign ${campaignId} (Status: ${campaign?.status || 'NOT_FOUND'})`);
          // Leave message in queue if paused, or delete if cancelled/sent/not found
          if (campaign?.status === 'PAUSED') {
             // Let it time out and return to queue
             continue;
          } else {
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl: qUrl,
              ReceiptHandle: message.ReceiptHandle
            }));
            continue;
          }
        }

        // Send Email
        try {
          // Check contact status again before sending
          const contact = await prisma.contact.findUnique({
            where: { id: recipient.contactId || '' }
          });
          
          if (contact && contact.status !== 'ACTIVE') {
            console.log(`⏩ Skipping ${recipient.email} (Status: ${contact.status})`);
            // Mark message as processed and continue
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl: qUrl,
              ReceiptHandle: message.ReceiptHandle
            }));
            continue;
          }

          console.log(`✉️ Sending to ${recipient.email} for campaign ${campaignId}`);
          
          const fromEmail = campaign.senderEmail || process.env.SES_FROM_EMAIL;
          const fromName = campaign.senderName || "Marketing Team";
          
          // Process HTML for tracking
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const contactId = recipient.contactId || 'unknown';
          let html = campaign.template?.html || "No content";
          
          // Inject Open Tracking Pixel
          const pixel = `<img src="${appUrl}/api/track/open/${campaignId}/${contactId}" width="1" height="1" style="display:none" />`;
          html = html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : html + pixel;
          
          // Inject Click Tracking (Wrap links)
          html = html.replace(/href="([^"]+)"/g, (match, url) => {
            if (url.startsWith('http') && !url.includes(appUrl)) {
              return `href="${appUrl}/api/track/click/${campaignId}/${contactId}?url=${encodeURIComponent(url)}"`;
            }
            return match;
          });

          // M8: Inject Unsubscribe Link
          const unsubscribeUrl = `${appUrl}/unsubscribe?cid=${contactId}&campaign=${campaignId}`;
          const unsubscribeHtml = `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-family: sans-serif; font-size: 12px;">
              <p>You received this because you're subscribed to our newsletter.</p>
              <p><a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: underline;">Unsubscribe</a></p>
            </div>
          `;
          html = html.includes('</body>') ? html.replace('</body>', `${unsubscribeHtml}</body>`) : html + unsubscribeHtml;

          try {
            await sesClient.send(new SendEmailCommand({
              Source: `"${fromName}" <${fromEmail}>`,
              Destination: { ToAddresses: [recipient.email] },
              Message: {
                Subject: { Data: campaign.subject },
                Body: { Html: { Data: html } }
              },
              ConfigurationSetName: process.env.SES_CONFIG_SET || "CampaignTracking",
              Tags: [
                { Name: "campaignId", Value: campaignId },
                { Name: "contactId", Value: contactId }
              ]
            }));

            // Respect SES rate limits (approx 5/sec)
            await new Promise(resolve => setTimeout(resolve, 200));

            // Update DB: Increment totalSent
            const updatedCampaign = await prisma.campaign.update({
              where: { id: campaignId },
              data: { totalSent: { increment: 1 } }
            });
            console.log(`📊 Progress: ${updatedCampaign.totalSent}/${updatedCampaign.recipientCount} for ${campaignId}`);
            await checkCompletion(updatedCampaign);

          } catch (sendError) {
            console.error(`❌ Failed to send to ${recipient.email}:`, sendError);
            
            // Update DB: Increment totalFailed
            const updatedCampaign = await prisma.campaign.update({
              where: { id: campaignId },
              data: { totalFailed: { increment: 1 } }
            });
            
            await prisma.campaignActivityLog.create({
              data: {
                campaignId,
                action: 'SEND_FAILED',
                actorId: campaign.createdBy,
                metadata: { 
                  email: recipient.email, 
                  error: sendError instanceof Error ? sendError.message : String(sendError) 
                }
              }
            });
            
            await checkCompletion(updatedCampaign);
          }

          async function checkCompletion() {
            // Fetch fresh data to avoid race conditions
            const freshCampaign = await prisma.campaign.findUnique({
              where: { id: campaignId }
            });
            
            if (freshCampaign.totalSent + freshCampaign.totalFailed >= freshCampaign.recipientCount) {
              console.log(`🏁 All recipients processed for ${campaignId}. Sent: ${freshCampaign.totalSent}, Failed: ${freshCampaign.totalFailed}`);
              
              if (freshCampaign.status !== 'SENT') {
                await prisma.campaign.update({
                  where: { id: campaignId },
                  data: { 
                    status: 'SENT',
                    sentAt: new Date()
                  }
                });
                console.log(`✅ Status updated to SENT for ${campaignId}`);

                // Handle Recurring Campaigns
                if (freshCampaign.isRecurring && freshCampaign.recurrenceInterval) {
                  await handleRecurrence(freshCampaign);
                }
              }
            }
          }

          async function handleRecurrence(campaign) {
            console.log(`🔄 Handling recurrence for: ${campaign.name}`);
            
            const nextSchedule = new Date(campaign.scheduledAt || campaign.sentAt || new Date());
            
            if (campaign.recurrenceInterval === 'DAILY') {
              nextSchedule.setDate(nextSchedule.getDate() + 1);
            } else if (campaign.recurrenceInterval === 'WEEKLY') {
              nextSchedule.setDate(nextSchedule.getDate() + 7);
            } else if (campaign.recurrenceInterval === 'MONTHLY') {
              nextSchedule.setMonth(nextSchedule.getMonth() + 1);
            }

            // Create clone
            const newCampaign = await prisma.campaign.create({
              data: {
                name: `${campaign.name} (Recurring)`,
                subject: campaign.subject,
                previewText: campaign.previewText,
                senderName: campaign.senderName,
                senderEmail: campaign.senderEmail,
                replyToEmail: campaign.replyToEmail,
                templateId: campaign.templateId,
                status: 'SCHEDULED',
                scheduledAt: nextSchedule,
                timezone: campaign.timezone,
                isRecurring: true,
                recurrenceInterval: campaign.recurrenceInterval,
                createdBy: campaign.createdBy,
                tags: campaign.tags,
                recipientCount: campaign.recipientCount
              }
            });

            console.log(`✅ Scheduled next occurrence: ${newCampaign.id} for ${nextSchedule.toISOString()}`);
            
            // Note: In a real app, you'd also need to clone the recipient lists/segments
            // For now, we'll assume the user wants the same recipients.
            // We need to clone CampaignRecipientList and CampaignRecipientSegment records.
            const recipientLists = await prisma.campaignRecipientList.findMany({ where: { campaignId: campaign.id } });
            for (const rl of recipientLists) {
              await prisma.campaignRecipientList.create({
                data: { campaignId: newCampaign.id, contactListId: rl.contactListId }
              });
            }

            const recipientSegments = await prisma.campaignRecipientSegment.findMany({ where: { campaignId: campaign.id } });
            for (const rs of recipientSegments) {
              await prisma.campaignRecipientSegment.create({
                data: { campaignId: newCampaign.id, segmentId: rs.segmentId }
              });
            }
          }

          // Delete from queue
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: qUrl,
            ReceiptHandle: message.ReceiptHandle
          }));

          // 🕒 Rate limiting: 1 email per second
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
          
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { 
              activityLogs: {
                create: {
                  action: 'SEND_FAILED',
                  actorId: campaign.createdBy,
                  metadata: { email: recipient.email, error: error.message }
                }
              }
            }
          });
          
          // Optionally delete or keep in queue based on error type
          // For now, let's delete to avoid infinite loops on invalid emails
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: qUrl,
            ReceiptHandle: message.ReceiptHandle
          }));
        }
      }
    } catch (error) {
      console.error('❌ Error processing queue:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

processQueue();
