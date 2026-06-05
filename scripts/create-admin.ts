import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  const args = process.argv.slice(2)
  const email = args[0] || 'saheelyadav67@gmail.com'
  const password = args[1] || process.env.ADMIN_DEFAULT_PASSWORD
  const name = args[2] || 'Admin'

  if (!password) {
    console.error('Error: Password required: provide as CLI arg or set ADMIN_DEFAULT_PASSWORD in .env')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role: 'ADMIN'
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN'
    }
  })



  console.log('✅ Admin user created/updated:', user.email)
  console.log('📧 Email:', email)
  console.log('🔑 Password:', password)
  console.log('👤 Role: ADMIN')
}

createAdminUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
