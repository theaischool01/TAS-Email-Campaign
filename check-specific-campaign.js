const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificCampaign(campaignId) {
  console.log(`🔍 AUDITING CAMPAIGN: ${campaignId}`);
  
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true
      }
    });

    if (!campaign) {
      console.log("❌ Campaign not found");
      return;
    }

    console.log("📋 CAMPAIGN DATA:");
    console.log(`- Status: ${campaign.status}`);
    console.log(`- TemplateID: ${campaign.templateId}`);
    
    if (campaign.template) {
      const t = campaign.template;
      console.log("📄 TEMPLATE DATA (EmailTemplate Table):");
      console.log(`- ID: ${t.id}`);
      console.log(`- Name: ${t.name}`);
      console.log(`- HTML Field Length: ${t.html ? t.html.length : 'NULL/UNDEFINED'}`);
      console.log(`- HTML Field Snippet: ${t.html ? t.html.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`- JSON Field Length: ${t.json ? t.json.length : 'NULL/UNDEFINED'}`);
      
      // Check for common alternative field names just in case Prisma/DB is out of sync
      console.log("🧪 CHECKING ALTERNATIVE FIELDS:");
      console.log(`- 'content' exists: ${'content' in t}`);
      console.log(`- 'body' exists: ${'body' in t}`);
      console.log(`- 'templateHtml' exists: ${'templateHtml' in t}`);
      
      if (t.html === "" || t.html === null) {
        console.log("⚠️ WARNING: HTML field is EMPTY for this template ID in the database.");
      } else {
        console.log("✅ HTML content IS present in the database.");
      }
    } else {
      console.log("❌ NO TEMPLATE RELATION found for this campaign.");
      if (campaign.templateId) {
        console.log(`🔍 Searching directly for template record with ID: ${campaign.templateId}...`);
        const directT = await prisma.emailTemplate.findUnique({
          where: { id: campaign.templateId }
        });
        if (directT) {
          console.log("✅ Template record FOUND directly, but relation was broken.");
          console.log(`- HTML Length: ${directT.html ? directT.html.length : 'EMPTY'}`);
        } else {
          console.log("❌ Template record DOES NOT EXIST in EmailTemplate table.");
        }
      }
    }

  } catch (err) {
    console.error("❌ ERROR DURING AUDIT:", err);
  } finally {
    await prisma.$disconnect();
  }
}

// Get campaign ID from command line
const cid = process.argv[2];
if (!cid) {
  console.log("Usage: node check-specific-campaign.js <campaignId>");
  process.exit(1);
}

checkSpecificCampaign(cid);
