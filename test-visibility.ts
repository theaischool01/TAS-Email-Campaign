import { PrismaClient } from '@prisma/client'
import { TemplateService } from './lib/services/template.service'

const prisma = new PrismaClient()

async function main() {
  const adminSession = {
    user: {
      id: 'admin1',
      email: 'admin@example.com',
      role: 'SUPER_ADMIN'
    }
  }

  console.log("--- FETCHING TEMPLATES AS ADMIN ---")
  const templates = await TemplateService.getTemplates(adminSession as any, prisma)
  console.log("Found:", templates.length)
  console.log("Owners:", templates.map(t => t.createdBy))
}

main().catch(console.error).finally(() => prisma.$disconnect())
