import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
