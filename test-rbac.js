const { PrismaClient } = require("@prisma/client");
const { TemplateService } = require("./lib/services/template.service");

const prisma = new PrismaClient();

async function test() {
  const adminSession = {
    user: {
      id: "admin1",
      email: "admin@example.com",
      role: "SUPER_ADMIN"
    }
  };

  console.log("--- Testing Template Visibility for SUPER_ADMIN ---");
  const templates = await TemplateService.getTemplates(adminSession, prisma);
  console.log(`Found ${templates.length} templates for admin.`);
  templates.forEach(t => {
    console.log(`- ${t.name} (Owner: ${t.createdBy})`);
  });

  const managerSession = {
    user: {
      id: "manager1",
      email: "manager@example.com",
      role: "CAMPAIGN_MANAGER"
    }
  };

  console.log("\n--- Testing Template Visibility for CAMPAIGN_MANAGER ---");
  const mTemplates = await TemplateService.getTemplates(managerSession, prisma);
  console.log(`Found ${mTemplates.length} templates for manager.`);
  mTemplates.forEach(t => {
    console.log(`- ${t.name} (Owner: ${t.createdBy}, Public: ${t.isPublic})`);
  });
}

test().finally(() => prisma.$disconnect());
