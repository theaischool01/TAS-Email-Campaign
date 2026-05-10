const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand, CreateQueueCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SESv2Client } = require('@aws-sdk/client-sesv2');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const http = require('http');

// EMERGENCY LOGGING: Catch any crash and write it to a file
const logPath = path.join(process.cwd(), 'worker-error.log');
function logError(err) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] CRASH: ${err.stack || err}\n`;
  fs.appendFileSync(logPath, message);
  console.error(message);
}

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

console.log('🚀 Worker is initializing...');
fs.appendFileSync(logPath, `\n--- Worker Started at ${new Date().toISOString()} ---\n`);

// Render requires a web server to stay alive on the free tier
const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Worker is running and healthy!\n');
}).listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

const prisma = new PrismaClient();
const awsConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const sqsClient = new SQSClient(awsConfig);
const ses = new SESv2Client(awsConfig);
const transporter = nodemailer.createTransport({
  SES: { ses, aws: require('@aws-sdk/client-sesv2') }
});

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
    console.log(`Queue detection error, attempting creation...`);
    const command = new CreateQueueCommand({ QueueName: QUEUE_NAME });
    const response = await sqsClient.send(command);
    queueUrl = response.QueueUrl;
    return queueUrl;
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      include: {
        recipientLists: { include: { contactList: { include: { members: { include: { contact: true } } } } } },
        template: true
      }
    });

    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Launching Campaign: ${campaign.name}`);
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

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING', recipientCount: recipients.length, sentAt: new Date(), totalSent: 0 }
      });

      const qUrl = await getQueueUrl();
      for (const recipient of recipients) {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: qUrl,
          MessageBody: JSON.stringify({ campaignId: campaign.id, recipient })
        }));
      }
    }
  } catch (error) {
    console.error('❌ Scheduler Error:', error);
  }
});

// ─── Queue Processor ─────────────────────────────────────────────────────────
async function processQueue() {
  console.log('📬 Worker initialized and listening for messages...');
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
        const { campaignId, recipient } = JSON.parse(message.Body);
        
        try {
          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { template: true }
          });

          if (!campaign || campaign.status !== 'SENDING') {
            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
            continue;
          }

          // FIX: Ensure we use a verified sender email
          let fromEmail = campaign.senderEmail || process.env.SES_FROM_EMAIL;
          if (fromEmail.includes('example.com')) {
            fromEmail = process.env.SES_FROM_EMAIL;
          }
          
          const fromName = campaign.senderName || "Marketing Team";
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const contactId = recipient.contactId || 'unknown';
          const unsubscribeUrl = `${appUrl}/unsubscribe?cid=${contactId}&campaign=${campaignId}`;
          const trackingPixel = `<img src="${appUrl}/api/track/open/${campaignId}/${contactId}" width="1" height="1" style="display:none !important;" />`;
          
          let html = campaign.template?.html || "No content";
          html = html.replace(/{{first_name}}/gi, recipient.firstName || 'Friend')
                     .replace(/{{last_name}}/gi, recipient.lastName || '')
                     .replace(/{{email}}/gi, recipient.email)
                     .replace(/{{UNSUBSCRIBE_URL}}/gi, unsubscribeUrl);

          const fullHtml = html.includes('</body>') 
            ? html.replace('</body>', `${trackingPixel}</body>`) 
            : `${html}${trackingPixel}`;

          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient.email,
            subject: campaign.subject,
            html: fullHtml,
            list: {
              unsubscribe: { url: unsubscribeUrl, comment: 'One-Click Unsubscribe' }
            },
            headers: {
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'X-SES-MESSAGE-TAGS': `campaignId=${campaignId}, contactId=${contactId}`
            }
          });

          const updated = await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalSent: { increment: 1 } }
          });

          if (updated.totalSent + updated.totalFailed >= updated.recipientCount) {
            await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'SENT' } });
          }

          await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
          console.log(`✅ Sent to ${recipient.email}`);

        } catch (error) {
          console.error(`❌ Error sending to ${recipient.email}:`, error);
          await prisma.campaign.update({ where: { id: campaignId }, data: { totalFailed: { increment: 1 } } });
          
          // Log specific error in activity log
          await prisma.campaignActivityLog.create({
            data: {
              campaignId,
              action: 'SEND_FAILED',
              actorId: 'system-worker',
              metadata: { 
                email: recipient.email, 
                error: error.message 
              }
            }
          });

          await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
        }
      }
    } catch (error) {
      console.error('❌ Queue Error:', error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

processQueue();
