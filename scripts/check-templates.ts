import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTemplates() {
  console.log('🔍 Checking database for templates...')
  
  const templates = await prisma.emailTemplate.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      createdBy: true,
      isPublic: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`📊 Found ${templates.length} templates:`)
  templates.forEach(template => {
    console.log(`  - ${template.name} (${template.category}) by ${template.user?.name} (${template.user?.role}) - Public: ${template.isPublic}`)
  })

  // Check admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })
  console.log(`👤 Admin user: ${adminUser?.name} (${adminUser?.email})`)

  await prisma.$disconnect()
}

checkTemplates().catch(console.error)
