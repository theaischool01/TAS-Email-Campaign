import { SQSClient, ListQueuesCommand, CreateQueueCommand } from "@aws-sdk/client-sqs"
import dotenv from "dotenv"
dotenv.config()

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

async function run() {
  try {
    const listRes = await sqsClient.send(new ListQueuesCommand({}))
    console.log("Existing queues:", listRes.QueueUrls)

    // Let's create the analytics queue if it doesn't exist
    const queueName = "MailFlowAnalyticsQueue"
    const createRes = await sqsClient.send(new CreateQueueCommand({
      QueueName: queueName,
      Attributes: {
        VisibilityTimeout: "120"
      }
    }))
    console.log("Created/Resolved Analytics Queue URL:", createRes.QueueUrl)
  } catch (err: any) {
    console.error("Error:", err)
  }
}

run()
