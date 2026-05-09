const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate campaigns...')
  
  // Check campaigns
  const duplicateCampaigns = await prisma.$queryRaw`
    SELECT 
      "createdBy",
      name,
      COUNT(*) as duplicate_count,
      MIN("createdAt") as oldest_created
    FROM campaigns 
    GROUP BY "createdBy", name 
    HAVING COUNT(*) > 1 
    ORDER BY duplicate_count DESC, oldest_created
  `
  
  console.log('📊 Duplicate campaigns found:', duplicateCampaigns.length)
  
  if (duplicateCampaigns.length > 0) {
    console.log('⚠️  DUPLICATE CAMPAIGNS:')
    duplicateCampaigns.forEach(dup => {
      console.log(`  - ${dup.name} by ${dup.createdBy} (${dup.duplicate_count} copies)`)
      console.log(`    IDs: ${dup.duplicate_ids}`)
      console.log(`    Oldest: ${dup.oldest_created}`)
    })
  }
  
  // Check templates
  const duplicateTemplates = await prisma.$queryRaw`
    SELECT 
      "createdBy",
      name,
      COUNT(*) as duplicate_count,
      MIN("createdAt") as oldest_created
    FROM email_templates 
    GROUP BY "createdBy", name 
    HAVING COUNT(*) > 1 
    ORDER BY duplicate_count DESC, oldest_created
  `
  
  console.log('📊 Duplicate templates found:', duplicateTemplates.length)
  
  if (duplicateTemplates.length > 0) {
    console.log('⚠️  DUPLICATE TEMPLATES:')
    duplicateTemplates.forEach(dup => {
      console.log(`  - ${dup.name} by ${dup.createdBy} (${dup.duplicate_count} copies)`)
      console.log(`    IDs: ${dup.duplicate_ids}`)
      console.log(`    Oldest: ${dup.oldest_created}`)
    })
  }
  
  // Check old drafts
  const oldDrafts = await prisma.$queryRaw`
    SELECT 
      id,
      name,
      status,
      "createdAt",
      "updatedAt",
      EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) as age_hours
    FROM campaigns 
    WHERE status = 'DRAFT' 
      AND "createdAt" < NOW() - INTERVAL '7 days'
    ORDER BY "createdAt"
    LIMIT 10
  `
  
  console.log('📊 Old drafts found:', oldDrafts.length)
  
  if (oldDrafts.length > 0) {
    console.log('⚠️  OLD DRAFTS:')
    oldDrafts.forEach(draft => {
      console.log(`  - ${draft.name} (${draft.age_hours}h old) - ID: ${draft.id}`)
    })
  }
  
  await prisma.$disconnect()
}

checkDuplicates()
  .catch(console.error)
  .finally(() => process.exit(0))
