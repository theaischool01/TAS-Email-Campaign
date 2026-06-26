import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

async function checkRelationships() {
  const contacts = await prisma.contact.findMany({
    include: {
      lists: {
        include: {
          contactList: true
        }
      }
    }
  });

  console.log(`=== Contacts and their Lists (Total: ${contacts.length}) ===`);
  contacts.forEach((c: any) => {
    const listNames = c.lists.map((l: any) => l.contactList.name).join(", ");
    console.log(`- ${c.email}: Lists = [${listNames || "NONE"}]`);
  });
}

checkRelationships()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
