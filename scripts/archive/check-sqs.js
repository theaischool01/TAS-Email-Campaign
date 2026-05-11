const { SQSClient, GetQueueAttributesCommand, GetQueueUrlCommand } = require('@aws-sdk/client-sqs');
require('dotenv').config();

const awsConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const sqsClient = new SQSClient(awsConfig);
const QUEUE_NAME = "EmailDispatchQueue";

async function main() {
  try {
    const urlRes = await sqsClient.send(new GetQueueUrlCommand({ QueueName: QUEUE_NAME }));
    const queueUrl = urlRes.QueueUrl;
    console.log(`🔗 Queue URL: ${queueUrl}`);

    const attrRes = await sqsClient.send(new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
    }));

    console.log('📊 Queue Stats:', {
      Waiting: attrRes.Attributes.ApproximateNumberOfMessages,
      InFlight: attrRes.Attributes.ApproximateNumberOfMessagesNotVisible,
    });
  } catch (error) {
    console.error('❌ SQS Check Failed:', error.message);
  }
}

main();
