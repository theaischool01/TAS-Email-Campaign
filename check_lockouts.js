const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const attempts = await prisma.loginAttempt.findMany();
    console.log('Login Attempts:', JSON.stringify(attempts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
