import { prisma } from '../app/lib/prisma'
import { seedDefaultTemplatesForUser } from '../lib/services/default-template.service'
import logger from '../lib/logger'

async function main() {
  logger.info("Starting default template migration for existing users...")

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true
    }
  })

  logger.info({ userCount: users.length }, "Retrieved users list from database")

  for (const user of users) {
    try {
      logger.info({ userId: user.id, email: user.email }, "Migrating default templates for user")
      await seedDefaultTemplatesForUser(user.id)
    } catch (err: any) {
      logger.error({ userId: user.id, email: user.email, error: err.message }, "Failed to seed templates for user")
    }
  }

  logger.info("Default template migration for existing users completed successfully")
}

main()
  .catch((err) => {
    logger.error({ error: err.message }, "Fatal migration error")
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
