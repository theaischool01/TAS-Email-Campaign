const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campaignId = 'cmp0454gg0006jv04lilxz1fn';
  console.log(`🔍 Inspecting Campaign: ${campaignId}`);
  
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: true }
  });
  
  if (!campaign) {
    console.log('❌ Campaign NOT FOUND');
    return;
  }
  
  console.log('📊 Campaign Details:', {
    id: campaign.id,
    name: campaign.name,
    templateId: campaign.templateId,
    hasTemplateRecord: !!campaign.template,
    hasTemplateHtml: !!campaign.template?.html,
    currentStep: campaign.currentStep
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
