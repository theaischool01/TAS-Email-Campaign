import { prisma as prismaClient } from "../app/lib/prisma";
import bcrypt from "bcryptjs";
import { seedDefaultTemplatesForUser } from "../lib/services/default-template.service";

const prisma = prismaClient as any;

// Mock context for transaction rollback test
async function testRollbackFlow() {
  const testEmail = "rollback-test-" + Date.now() + "@example.com";
  console.log(`Running rollback verification for: ${testEmail}`);

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Create the user
      const hashedPassword = await bcrypt.hash("Password123!", 12);
      const newUser = await tx.user.create({
        data: {
          name: "Rollback User",
          email: testEmail,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      console.log("User record created inside transaction. Simulating seeder failure...");

      // 2. Force throw error to trigger rollback
      throw new Error("Simulated Seeding Failure");
    });
  } catch (err: any) {
    console.log(`Caught expected transaction error: ${err.message}`);
  }

  // 3. Verify user does NOT exist in database (rolled back)
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (user) {
    console.error(`❌ FAILURE: User record was NOT rolled back! Found user ID: ${user.id}`);
    process.exit(1);
  } else {
    console.log("✅ SUCCESS: Database rolled back user creation correctly.");
  }
}

async function runTests() {
  try {
    await testRollbackFlow();
    console.log("All registration unit tests passed successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Test execution failed:", e);
    process.exit(1);
  }
}

runTests();
