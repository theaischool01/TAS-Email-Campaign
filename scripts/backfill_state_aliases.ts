import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const stateField = await prisma.contactCustomField.findFirst({
    where: {
      key: "state",
      isArchived: false
    }
  });

  if (!stateField) {
    console.log("State field not found.");
    return;
  }

  console.log("State Field ID:", stateField.id);

  // Update TS -> Telangana
  const updateTS = await prisma.contactFieldValue.updateMany({
    where: { fieldId: stateField.id, textValue: "TS" },
    data: { textValue: "Telangana" }
  });
  console.log(`Updated TS -> Telangana: ${updateTS.count} rows`);

  // Update AP -> Andhra Pradesh
  const updateAP = await prisma.contactFieldValue.updateMany({
    where: { fieldId: stateField.id, textValue: "AP" },
    data: { textValue: "Andhra Pradesh" }
  });
  console.log(`Updated AP -> Andhra Pradesh: ${updateAP.count} rows`);

  // Update TN -> Tamil Nadu
  const updateTN = await prisma.contactFieldValue.updateMany({
    where: { fieldId: stateField.id, textValue: "TN" },
    data: { textValue: "Tamil Nadu" }
  });
  console.log(`Updated TN -> Tamil Nadu: ${updateTN.count} rows`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
