
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplates() {
  console.log("🔍 DB AUDIT: Fetching all templates...");
  const templates = await prisma.emailTemplate.findMany({
    select: {
      id: true,
      name: true,
      html: true,
      createdBy: true,
      createdAt: true
    }
  });

  console.log(`📊 Found ${templates.length} templates in database.`);

  templates.forEach(t => {
    const htmlLength = t.html ? t.html.length : 0;
    console.log(`---`);
    console.log(`ID:   ${t.id}`);
    console.log(`Name: ${t.name}`);
    console.log(`Len:  ${htmlLength} characters`);
    if (htmlLength > 0) {
      console.log(`Preview: ${t.html.substring(0, 100).replace(/\n/g, ' ')}...`);
    } else {
      console.log(`❌ ERROR: HTML IS EMPTY!`);
    }
    console.log(`User: ${t.createdBy}`);
  });

  console.log("\n🔍 DB AUDIT: Checking campaigns that have templates...");
  const campaigns = await prisma.campaign.findMany({
    where: { NOT: { templateId: null } },
    select: {
      id: true,
      name: true,
      templateId: true,
      template: {
        select: {
          id: true,
          name: true,
          html: true
        }
      }
    }
  });

  console.log(`📊 Found ${campaigns.length} campaigns with template references.`);

  campaigns.forEach(c => {
    console.log(`---`);
    console.log(`Campaign: ${c.name} (${c.id})`);
    console.log(`Ref ID:   ${c.templateId}`);
    if (c.template) {
      console.log(`Template: ${c.template.name}`);
      console.log(`HTML Len: ${c.template.html ? c.template.html.length : 0}`);
    } else {
      console.log(`❌ ERROR: Campaign has ID but RELATION IS NULL! (Broken Link)`);
    }
  });

  process.exit(0);
}

checkTemplates().catch(err => {
  console.error("❌ AUDIT FAILED:", err);
  process.exit(1);
});
