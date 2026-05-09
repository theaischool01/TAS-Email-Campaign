const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function auditCampaigns() {
  console.log('🔍 Auditing campaigns for duplicates...')
  
  // Check for duplicate campaigns
  const duplicateCampaigns = await prisma.$queryRaw`
    SELECT 
      "createdBy",
      name,
      COUNT(*) as duplicate_count,
      MIN("createdAt") as oldest_created
    FROM campaigns 
    GROUP BY "createdBy", "name" 
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
  } else {
    console.log('✅ No duplicate campaigns found')
  }
  
  // Check for old drafts (older than 7 days)
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
  } else {
    console.log('✅ No old drafts found')
  }
  
  await prisma.$disconnect()
}

auditCampaigns()
  .catch(console.error)
  .finally(() => process.exit(0))
