import { Prisma } from "@prisma/client";
import { prisma as prismaClient } from "@/app/lib/prisma";
import logger from "@/lib/logger";
import { DEFAULT_EMAIL_TEMPLATES } from "../default-templates";

export async function seedDefaultTemplatesForUser(userId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? (prismaClient as any);
  
  try {
    const defaultNames = DEFAULT_EMAIL_TEMPLATES.map(t => t.name);
    
    const existingTemplates = await db.emailTemplate.findMany({
      where: {
        createdBy: userId,
        name: { in: defaultNames }
      },
      select: { name: true }
    });

    const existingNames = new Set(existingTemplates.map((t: any) => t.name));
    const templatesToSeed = DEFAULT_EMAIL_TEMPLATES.filter(t => !existingNames.has(t.name));

    if (templatesToSeed.length === 0) {
      logger.info({ userId, existingTemplates: existingTemplates.length }, "Default template seeding skipped (all default templates already exist)");
      return;
    }

    const { renderBlocksToHTML } = require("../../components/templates/utils/html-renderer")

    await db.emailTemplate.createMany({
      data: templatesToSeed.map(template => ({
        name: template.name,
        category: template.category,
        thumbnail: template.thumbnail,
        html: renderBlocksToHTML(template.blocks),
        json: template.json,
        isPublic: template.isPublic,
        isSystem: template.isSystem,
        createdBy: userId
      }))
    });

    logger.info({ userId, templateCount: templatesToSeed.length }, "Default templates seeded successfully");
  } catch (error: any) {
    logger.error({ userId, error: error.message }, "Failed to seed default templates for user");
    throw error;
  }
}
