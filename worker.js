const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand, CreateQueueCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
require('dotenv').config();

const prisma = new PrismaClient();

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

    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Triggering scheduled campaign: ${campaign.name} (${campaign.id})`);
      
      // Update status to SENDING
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING' }
      });

      // Enqueue all recipients
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

        if (!campaign || campaign.status === 'PAUSED' || campaign.status === 'CANCELLED') {
          console.log(`⏸️ Skipping send for campaign ${campaignId} (Status: ${campaign?.status || 'NOT_FOUND'})`);
          // Leave message in queue if paused, or delete if cancelled/not found
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
          console.log(`✉️ Sending to ${recipient.email} for campaign ${campaignId}`);
          
          const fromEmail = campaign.senderEmail || process.env.SES_FROM_EMAIL;
          const fromName = campaign.senderName || "Marketing Team";
          
          await sesClient.send(new SendEmailCommand({
            Source: `"${fromName}" <${fromEmail}>`,
            Destination: { ToAddresses: [recipient.email] },
            Message: {
              Subject: { Data: campaign.subject },
              Body: { Html: { Data: campaign.template?.html || "No content" } }
            }
          }));

          // Update DB
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalSent: { increment: 1 } }
          });

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
