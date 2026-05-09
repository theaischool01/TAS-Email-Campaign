const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if currentStep column exists
    const schemaCheck = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      AND column_name = 'currentStep'
    `
    
    console.log('📋 Schema check for currentStep column:', schemaCheck.length > 0 ? 'EXISTS' : 'MISSING')
    
    if (schemaCheck.length > 0) {
      schemaCheck.forEach(col => {
        console.log(`  - Column: ${col.column_name}, Type: ${col.data_type}`)
      })
    }
    
    // Check a sample campaign to see current structure
    const sampleCampaign = await prisma.campaign.findFirst({
      select: {
        id: true,
        name: true,
        currentStep: true,
        "createdAt": true,
        "updatedAt": true
      }
    })
    
    if (sampleCampaign) {
      console.log('📊 Sample campaign structure:')
      console.log(`  - ID: ${sampleCampaign.id}`)
      console.log(`  - Name: ${sampleCampaign.name}`)
      console.log(`  - Current Step: ${sampleCampaign.currentStep}`)
      console.log(`  - Created: ${sampleCampaign.createdAt}`)
      console.log(`  - Updated: ${sampleCampaign.updatedAt}`)
    } else {
      console.log('❌ No campaigns found in database')
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
  
  await prisma.$disconnect()
}

checkSchema()
  .catch(console.error)
  .finally(() => process.exit(0))
