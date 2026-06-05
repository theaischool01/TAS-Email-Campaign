import { SQSClient, SendMessageCommand, CreateQueueCommand, GetQueueUrlCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand, SetQueueAttributesCommand } from "@aws-sdk/client-sqs"

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const QUEUE_NAME = process.env.SQS_QUEUE_NAME || "EmailDispatchQueue"

export interface QueueMessage {
  campaignId: string
  recipient: {
    email: string
    firstName?: string | null
    lastName?: string | null
    contactId?: string
  }
}

export class QueueService {
  private static queueUrl: string | null = null

  static async getQueueUrl(): Promise<string> {
    if (this.queueUrl) return this.queueUrl

    try {
      const command = new GetQueueUrlCommand({ QueueName: QUEUE_NAME })
      const response = await sqsClient.send(command)
      this.queueUrl = response.QueueUrl || null
      if (this.queueUrl) return this.queueUrl
    } catch (error: any) {
      if (error.name === "QueueDoesNotExist") {
        console.log(`Queue ${QUEUE_NAME} does not exist. Creating it...`)
        return await this.createQueue()
      }
      throw error
    }
    throw new Error("Failed to get queue URL")
  }

  static async createQueue(): Promise<string> {
    const dlqName = `${QUEUE_NAME}_DLQ`
    let dlqUrl: string | undefined

    // 1. Create DLQ
    try {
      const dlqCommand = new CreateQueueCommand({
        QueueName: dlqName,
        Attributes: {
          VisibilityTimeout: "120"
        }
      })
      const dlqRes = await sqsClient.send(dlqCommand)
      dlqUrl = dlqRes.QueueUrl
    } catch (e) {
      console.log(`DLQ ${dlqName} detection error/exists, fetching URL...`)
      const getDlqUrlCmd = new GetQueueUrlCommand({ QueueName: dlqName })
      const getRes = await sqsClient.send(getDlqUrlCmd)
      dlqUrl = getRes.QueueUrl
    }

    if (!dlqUrl) throw new Error("Failed to resolve DLQ URL")

    // 2. Get DLQ ARN
    const getAttrsCmd = new GetQueueAttributesCommand({
      QueueUrl: dlqUrl,
      AttributeNames: ["QueueArn"]
    })
    const attrsRes = await sqsClient.send(getAttrsCmd)
    const dlqArn = attrsRes.Attributes?.QueueArn

    if (!dlqArn) throw new Error("Failed to get DLQ ARN")

    // 3. Create/Update Primary Queue with RedrivePolicy & 120s VisibilityTimeout
    const queueAttributes = {
      VisibilityTimeout: "120", // 2 minutes
      RedrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlqArn,
        maxReceiveCount: 3
      })
    }

    try {
      const command = new CreateQueueCommand({
        QueueName: QUEUE_NAME,
        Attributes: queueAttributes
      })
      const response = await sqsClient.send(command)
      this.queueUrl = response.QueueUrl || null
    } catch (error: any) {
      if (error.name === "QueueAlreadyExists" || error.Code === "QueueAlreadyExists" || error.message.includes("already exists")) {
        console.log(`Queue ${QUEUE_NAME} exists with different attributes. Updating attributes via SetQueueAttributes...`)
        const getRes = await sqsClient.send(new GetQueueUrlCommand({ QueueName: QUEUE_NAME }))
        this.queueUrl = getRes.QueueUrl || null
        if (this.queueUrl) {
          await sqsClient.send(new SetQueueAttributesCommand({
            QueueUrl: this.queueUrl,
            Attributes: queueAttributes
          }))
        }
      } else {
        throw error
      }
    }

    if (!this.queueUrl) throw new Error("Failed to create queue")
    return this.queueUrl
  }

  static async enqueueEmail(message: QueueMessage): Promise<void> {
    const queueUrl = await this.getQueueUrl()
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
    await sqsClient.send(command)
  }

  static async enqueueBatch(messages: QueueMessage[]): Promise<void> {
    // SQS supports Batch Send, but for simplicity and to avoid batch limits initially, 
    // we'll send them individually or in chunks.
    // AWS SQS SendMessageBatch has a limit of 10 messages.
    const queueUrl = await this.getQueueUrl()
    
    for (let i = 0; i < messages.length; i += 10) {
      const batch = messages.slice(i, i + 10)
      const entries = batch.map((msg, index) => ({
        Id: `msg_${Date.now()}_${i + index}`,
        MessageBody: JSON.stringify(msg),
      }))
      
      // Using individual sends for now to be safe, but batching is better for performance
      await Promise.all(batch.map(msg => this.enqueueEmail(msg)))
    }
  }

  static async receiveMessages(maxMessages = 10): Promise<any[]> {
    const queueUrl = await this.getQueueUrl()
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20, // Long polling
    })
    const response = await sqsClient.send(command)
    return response.Messages || []
  }

  static async deleteMessage(receiptHandle: string): Promise<void> {
    const queueUrl = await this.getQueueUrl()
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
    await sqsClient.send(command)
  }
}
