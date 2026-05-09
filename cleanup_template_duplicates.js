const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function cleanupTemplateDuplicates() {
  console.log('🧹 Cleaning up duplicate templates...')
  
  // Find all 'New Template' templates and check for duplicates
  const allNewTemplates = await prisma.emailTemplate.findMany({
    where: {
      name: 'New Template',
      createdBy: 'manager1'
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  
  console.log(`📋 Total 'New Template' templates found: ${allNewTemplates.length}`)
  
  // Check if we have duplicates
  if (allNewTemplates.length > 1) {
    console.log('📋 Found duplicate templates to clean:', allNewTemplates.length - 1)
    
    // Keep the first one (oldest), delete the rest
    const toDelete = allNewTemplates.slice(1) // Delete all except the first one
    
    console.log(`🗑️  Deleting ${toDelete.length} duplicate templates:`)
    toDelete.forEach((template, index) => {
      console.log(`  - Deleting: ${template.name} (ID: ${template.id})`)
    })
    
    // Delete the duplicates
    const deleteResult = await prisma.emailTemplate.deleteMany({
      where: {
        id: {
          in: toDelete.map(t => t.id)
        }
      }
    })
    
    console.log(`✅  Deleted ${deleteResult.count} duplicate templates`)
    console.log(`✅  Kept oldest template: ${allNewTemplates[0].name} (ID: ${allNewTemplates[0].id})`)
  } else {
    console.log('✅ No duplicate templates found to clean')
  }
  
  await prisma.$disconnect()
}

cleanupTemplateDuplicates()
  .catch(console.error)
  .finally(() => process.exit(0))
