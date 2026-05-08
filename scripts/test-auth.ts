import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuth() {
  console.log('🔐 Testing authentication...')
  
  // Check admin user exists
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@example.com' }
  })
  
  if (!adminUser) {
    console.log('❌ Admin user not found')
    return
  }
  
  console.log(`✅ Admin user found: ${adminUser.name} (${adminUser.role})`)
  
  // Test password
  const isValidPassword = await bcrypt.compare('admin123', adminUser.password || '')
  console.log(`🔑 Password valid: ${isValidPassword}`)
  
  await prisma.$disconnect()
}

testAuth().catch(console.error)
