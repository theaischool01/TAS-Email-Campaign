import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  console.log("🚀 STARTING TAG DATA MIGRATION...");

  // Find all contacts that have tags
  const contacts = await (prisma.contact as any).findMany({
    where: {
      tags: {
        not: null,
      },
    },
  });

  console.log(`Found ${contacts.length} contacts with tags field populated.`);

  let createdTagsCount = 0;
  let createdLinksCount = 0;

  for (const contact of contacts) {
    if (!contact.tags || contact.tags.trim() === "") continue;

    const rawTags = contact.tags.split(",");
    for (const rawTag of rawTags) {
      const name = rawTag.trim();
      if (!name) continue;

      const slug = slugify(name);
      if (!slug) continue;

      // Ensure Tag exists for this user
      let tag = await prisma.tag.findUnique({
        where: {
          userId_slug: {
            userId: contact.userId,
            slug,
          },
        },
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name,
            slug,
            userId: contact.userId,
            color: "#3B82F6", // default color
          },
        });
        createdTagsCount++;
        console.log(`[TAG CREATE] Created Tag: "${name}" (slug: "${slug}") for user ${contact.userId}`);
      }

      // Establish link if not already exists
      const link = await prisma.contactTag.findUnique({
        where: {
          contactId_tagId: {
            contactId: contact.id,
            tagId: tag.id,
          },
        },
      });

      if (!link) {
        await prisma.contactTag.create({
          data: {
            contactId: contact.id,
            tagId: tag.id,
          },
        });
        createdLinksCount++;
      }
    }
  }

  console.log("\n✅ MIGRATION COMPLETED SUCCESSFULY!");
  console.log(`Created tags: ${createdTagsCount}`);
  console.log(`Linked contacts to tags: ${createdLinksCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
