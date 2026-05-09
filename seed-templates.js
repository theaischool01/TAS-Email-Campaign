const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const defaultTemplates = [
  {
    name: "Promotional Offer",
    category: "Promotional",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; padding: 20px 0; background-color: #f3f4f6; border-radius: 6px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Special Offer!</h1>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">Don't miss out on our latest deals!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          We are excited to offer you an exclusive discount. Click the button below to claim your offer and start saving today.
        </p>
        <div style="text-align: center;">
          <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Claim Your Discount</a>
        </div>
      </div>
    </div>`,
    json: JSON.stringify({})
  },
  {
    name: "Monthly Newsletter",
    category: "Newsletter",
    html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-top: 5px solid #10b981;">
      <h1 style="color: #111827; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">Monthly Newsletter</h1>
      <div style="margin-top: 25px;">
        <h3 style="color: #1f2937; font-size: 18px;">Latest Update</h3>
        <p style="color: #4b5563; line-height: 1.6;">Welcome to our latest newsletter. Here are the top stories and updates from our team this month.</p>
      </div>
    </div>`,
    json: JSON.stringify({})
  },
  {
    name: "Event Invitation",
    category: "Event",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #8b5cf6; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 32px;">You're Invited!</h1>
        <p style="font-size: 18px; opacity: 0.9; margin-top: 10px;">Join us for our upcoming exclusive event.</p>
      </div>
    </div>`,
    json: JSON.stringify({})
  }
];

async function main() {
  console.log("Seeding default templates for all admins...");
  
  // Find all users with SUPER_ADMIN or CAMPAIGN_MANAGER roles
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "CAMPAIGN_MANAGER"]
      }
    }
  });

  console.log(`Found ${admins.length} admins. Creating templates...`);

  let totalCreated = 0;

  for (const admin of admins) {
    for (const tpl of defaultTemplates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: {
          createdBy_name: {
            createdBy: admin.id,
            name: tpl.name
          }
        }
      });

      if (!existing) {
        await prisma.emailTemplate.create({
          data: {
            ...tpl,
            createdBy: admin.id,
            isPublic: true
          }
        });
        totalCreated++;
        console.log(`Created '${tpl.name}' for ${admin.email}`);
      }
    }
  }

  console.log(`Done! Created ${totalCreated} total templates.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
