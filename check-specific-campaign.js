
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const campaignId = "cmp06qme30001l204jewmkm0y";

async function checkSpecific() {
  console.log(`🔍 SPECIFIC AUDIT: Fetching campaign ${campaignId}...`);
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true
    }
  });

  if (!campaign) {
    console.log("❌ ERROR: Campaign not found!");
    process.exit(1);
  }

  console.log("--- CAMPAIGN DATA ---");
  console.log(`ID:           ${campaign.id}`);
  console.log(`Name:         ${campaign.name}`);
  console.log(`Status:       ${campaign.status}`);
  console.log(`TemplateId:   ${campaign.templateId}`);
  console.log(`Has Template: ${!!campaign.template}`);
  
  if (campaign.template) {
    console.log(`Template Name: ${campaign.template.name}`);
    console.log(`Template HTML: ${campaign.template.html ? campaign.template.html.length : 0} chars`);
    if (campaign.template.html) {
      console.log(`Preview: ${campaign.template.html.substring(0, 100)}...`);
    }
  } else if (campaign.templateId) {
    console.log("❌ CRITICAL: TemplateId is set but relation is NULL!");
    
    // Try to fetch template directly
    const directTemplate = await prisma.emailTemplate.findUnique({
      where: { id: campaign.templateId }
    });
    console.log(`Direct Fetch Result: ${!!directTemplate}`);
  }

  process.exit(0);
}

checkSpecific().catch(err => {
  console.error(err);
  process.exit(1);
});
