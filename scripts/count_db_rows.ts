import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

async function countRows() {
  const contactCount = await prisma.contact.count();
  const membershipCount = await prisma.contactListMember.count();
  const contactToContactListCount = await prisma.contactToContactList.count();
  const lists = await prisma.contactList.findMany({
    include: {
      _count: {
        select: {
          members: true,
          ContactToContactList: true,
        }
      }
    }
  });

  console.log("=== DB ROW COUNTS ===");
  console.log(`Total Contacts: ${contactCount}`);
  console.log(`Total ContactListMember (members): ${membershipCount}`);
  console.log(`Total ContactToContactList: ${contactToContactListCount}`);
  console.log("\nLists Details:");
  lists.forEach((l: any) => {
    console.log(`- List "${l.name}" (ID: ${l.id}): members count = ${l._count.members}, ContactToContactList count = ${l._count.ContactToContactList}`);
  });
}

countRows()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
