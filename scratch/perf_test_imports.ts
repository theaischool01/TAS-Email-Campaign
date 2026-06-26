import { PrismaClient } from "@prisma/client";
import { ImportService } from "../lib/services/import-service";

const prisma = new PrismaClient({
  log: []
});

async function runPerformanceTest() {
  const userId = "cmqav8tnn0000tahoebfdik6q"; // Saheel's user ID
  
  // Ensure the list exists
  let list = await prisma.contactList.findFirst({
    where: { name: "Perf Import Test List", ownerId: userId }
  });
  if (!list) {
    list = await prisma.contactList.create({
      data: { name: "Perf Import Test List", ownerId: userId }
    });
  }

  const listId = list.id;
  const mappings = {
    "Email": { action: "SYSTEM" as const, field: "email" },
    "First Name": { action: "SYSTEM" as const, field: "firstName" },
    "Last Name": { action: "SYSTEM" as const, field: "lastName" }
  };

  const sizes = [100, 1000, 5000];

  console.log("=== STARTING IMPORT PERFORMANCE TESTING ===");

  for (const size of sizes) {
    console.log(`\nTesting import of ${size} contacts...`);
    
    // Generate mock contact data
    const rows = Array.from({ length: size }, (_, i) => ({
      "Email": `perf_${size}_${i}_${Date.now()}@example.com`,
      "First Name": `First_${i}`,
      "Last Name": `Last_${i}`
    }));

    // Clean memory & garbage collect if possible
    if (global.gc) {
      global.gc();
    }

    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Perform import
    const result = await ImportService.importContacts(
      userId,
      listId,
      rows,
      mappings,
      prisma
    );

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    const totalTime = endTime - startTime;
    const numBatches = Math.ceil(size / 100);
    const avgBatchTime = totalTime / numBatches;
    const peakMemoryUsed = endMemory - startMemory;

    console.log(`--- RESULTS FOR ${size} CONTACTS ---`);
    console.log(`Total Import Time   : ${totalTime} ms`);
    console.log(`Average Batch Time  : ${avgBatchTime.toFixed(2)} ms`);
    console.log(`Peak Memory Usage   : ${(peakMemoryUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Failed Rows Count   : ${result.results.failed}`);
    console.log(`New Contacts Created: ${result.results.newContactsCreated}`);
  }

  // Cleanup lists
  console.log("\nCleaning up test contacts and list...");
  await prisma.contactListMember.deleteMany({
    where: { contactListId: listId }
  });
  await prisma.contactToContactList.deleteMany({
    where: { B: listId }
  });
  await prisma.contact.deleteMany({
    where: {
      userId,
      email: { startsWith: "perf_" }
    }
  });
  await prisma.contactList.delete({
    where: { id: listId }
  });

  console.log("=== PERFORMANCE TESTING COMPLETED ===");
}

runPerformanceTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
