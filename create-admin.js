require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function createAdmin() {
  const prisma = new PrismaClient()
  
  try {
    const email = 'admin@example.com'
    const password = 'admin123'
    const name = 'Super Admin'
    const role = 'SUPER_ADMIN'

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN'
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN'
      }
    })

    console.log('✅ Admin user created/updated:', user.email)
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 Role:', role)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
