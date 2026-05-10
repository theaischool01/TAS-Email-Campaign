const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const id = 'cmp05h0zj0001jt04d65j9kp4';

async function main() {
  console.log(`🔍 Inspecting Campaign: ${id}`);
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { template: true }
  });

  if (!campaign) {
    console.log('❌ Campaign not found!');
    return;
  }

  console.log('📊 Campaign Details:', {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    templateId: campaign.templateId,
    hasTemplateRecord: !!campaign.template,
    hasTemplateHtml: !!campaign.template?.html,
    htmlPreview: campaign.template?.html ? (campaign.template.html.substring(0, 50) + '...') : 'NULL'
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
