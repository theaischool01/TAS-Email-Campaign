const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fix() {
  const user = await p.user.findFirst();
  console.log('Using admin:', user.email, user.id);
  
  const result = await p.$executeRaw`
    UPDATE campaigns 
    SET "createdBy" = ${user.id}
    WHERE "createdBy" IS NULL
  `;
  
  console.log('Fixed campaigns:', result);
  await p.$disconnect();
}

fix().catch(console.error);