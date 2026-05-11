const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for empty templates...');
  const templates = await prisma.emailTemplate.findMany();
  
  for (const template of templates) {
    if (!template.html || template.html.trim() === '') {
      console.log(`⚠️ Template "${template.name}" (${template.id}) has NO HTML. Fixing...`);
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h1 style="color: #2563eb;">${template.name}</h1>
              <p>This is a default recovery template. Please customize it in the editor.</p>
              <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <p>Hello {{first_name}},</p>
                <p>We are excited to have you with us!</p>
              </div>
            </div>
          `
        }
      });
      console.log(`✅ Fixed template: ${template.name}`);
    }
  }
  
  console.log('🏁 Diagnostic complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
