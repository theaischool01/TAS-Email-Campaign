import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (!adminUser) {
    console.error('❌ No admin user found. Run seed first.')
    return
  }

  const starterTemplates = [
    {
      name: 'Welcome Email',
      category: 'Welcome',
      json: JSON.stringify([
        {
          id: 'header-1',
          type: 'header',
          content: { text: 'Welcome to Our Community!' },
          styles: { backgroundColor: '#3b82f6', color: '#ffffff', padding: '40px 20px' }
        },
        {
          id: 'image-1',
          type: 'image',
          content: { src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=300&fit=crop', alt: 'Welcome' },
          styles: {}
        },
        {
          id: 'text-1',
          type: 'text',
          content: { text: "Hi there!\n\nWe're thrilled to have you on board. Our platform is designed to help you reach your audience more effectively than ever before.\n\nTo get started, check out our quick-start guide below." },
          styles: { padding: '30px 20px', fontSize: '16px', lineHeight: '1.6' }
        },
        {
          id: 'button-1',
          type: 'button',
          content: { text: 'Get Started Now', url: 'https://example.com/start', backgroundColor: '#3b82f6', color: '#ffffff' },
          styles: { padding: '20px' }
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: {},
          styles: { padding: '20px 0' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          content: { 
            company: 'EmailPro SaaS', 
            address: '123 Tech Avenue, San Francisco, CA 94105',
            unsubscribeText: 'You received this because you signed up for our service.'
          },
          styles: { backgroundColor: '#f9fafb', padding: '30px' }
        }
      ]),
      html: '<h1>Welcome to Our Community!</h1><p>Hi there! We\'re thrilled to have you on board...</p>'
    },
    {
      name: 'Monthly Newsletter',
      category: 'Newsletter',
      json: JSON.stringify([
        {
          id: 'header-1',
          type: 'header',
          content: { text: 'Monthly News & Updates' },
          styles: { backgroundColor: '#111827', color: '#ffffff', padding: '30px 20px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: { text: 'Greetings!\n\nHere is what happened in our world this month. We have some exciting new features and stories to share with you.' },
          styles: { padding: '20px', fontSize: '15px' }
        },
        {
          id: '2column-1',
          type: '2column',
          content: {},
          styles: {}
        },
        {
          id: 'text-2',
          type: 'text',
          content: { text: 'Feature One: Real-time Analytics\nNow you can see your campaign performance as it happens.' },
          styles: { padding: '20px', backgroundColor: '#f3f4f6' }
        },
        {
          id: 'text-3',
          type: 'text',
          content: { text: 'Feature Two: AI Content Assistant\nLet our AI help you write better subject lines.' },
          styles: { padding: '20px' }
        },
        {
          id: 'social-1',
          type: 'social',
          content: { 
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com',
            linkedin: 'https://linkedin.com'
          },
          styles: { padding: '30px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          content: { company: 'EmailPro SaaS', address: '123 Tech Avenue' },
          styles: { backgroundColor: '#f9fafb' }
        }
      ]),
      html: '<h1>Monthly News & Updates</h1><p>Greetings! Here is what happened in our world this month...</p>'
    },
    {
      name: 'Promotional Offer',
      category: 'Promotional',
      json: JSON.stringify([
        {
          id: 'header-1',
          type: 'header',
          content: { text: 'FLASH SALE: 40% OFF!' },
          styles: { backgroundColor: '#dc2626', color: '#ffffff', padding: '40px 20px' }
        },
        {
          id: 'image-1',
          type: 'image',
          content: { src: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=300&fit=crop', alt: 'Sale' },
          styles: {}
        },
        {
          id: 'text-1',
          type: 'text',
          content: { text: "Don't miss out! For the next 48 hours, enjoy a massive 40% discount on all our plans.\n\nUse code: SAVE40 at checkout." },
          styles: { padding: '30px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }
        },
        {
          id: 'button-1',
          type: 'button',
          content: { text: 'Shop the Sale', url: 'https://example.com/shop', backgroundColor: '#dc2626', color: '#ffffff' },
          styles: { padding: '20px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          content: { company: 'EmailPro SaaS' },
          styles: { backgroundColor: '#f9fafb' }
        }
      ]),
      html: '<h1>FLASH SALE: 40% OFF!</h1><p>Don\'t miss out! Use code SAVE40...</p>'
    },
    {
      name: 'Event Invitation',
      category: 'Event',
      json: JSON.stringify([
        {
          id: 'header-1',
          type: 'header',
          content: { text: 'You are Invited!' },
          styles: { backgroundColor: '#8b5cf6', color: '#ffffff', padding: '40px 20px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: { text: 'Join us for our upcoming webinar on "The Future of Email Marketing".\n\nDate: October 25th\nTime: 2:00 PM EST' },
          styles: { padding: '30px', fontSize: '16px' }
        },
        {
          id: 'button-1',
          type: 'button',
          content: { text: 'Reserve My Spot', url: 'https://example.com/webinar', backgroundColor: '#8b5cf6', color: '#ffffff' },
          styles: { padding: '20px' }
        },
        {
          id: 'spacer-1',
          type: 'spacer',
          content: { height: '30px' },
          styles: {}
        },
        {
          id: 'footer-1',
          type: 'footer',
          content: { company: 'EmailPro SaaS' },
          styles: { backgroundColor: '#f9fafb' }
        }
      ]),
      html: '<h1>You are Invited!</h1><p>Join us for our upcoming webinar...</p>'
    },
    {
      name: 'Training Notice',
      category: 'Training',
      json: JSON.stringify([
        {
          id: 'header-1',
          type: 'header',
          content: { text: 'New Training Module Available' },
          styles: { backgroundColor: '#059669', color: '#ffffff', padding: '30px 20px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: { text: "We've just added a new training module to your dashboard.\n\nModule Title: Advanced Segmentation Techniques\nEstimated Duration: 45 Minutes" },
          styles: { padding: '20px' }
        },
        {
          id: 'divider-1',
          type: 'divider',
          content: {},
          styles: {}
        },
        {
          id: 'text-2',
          type: 'text',
          content: { text: 'Please complete this module by the end of the week to stay compliant with our latest marketing standards.' },
          styles: { padding: '20px', fontStyle: 'italic' }
        },
        {
          id: 'button-1',
          type: 'button',
          content: { text: 'Start Training', url: 'https://example.com/training', backgroundColor: '#059669', color: '#ffffff' },
          styles: { padding: '20px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          content: { company: 'EmailPro SaaS' },
          styles: { backgroundColor: '#f9fafb' }
        }
      ]),
      html: '<h1>New Training Module Available</h1><p>We\'ve just added a new training module...</p>'
    }
  ]

  console.log('🌱 Seeding starter templates...')

  for (const template of starterTemplates) {
    await prisma.emailTemplate.upsert({
      where: { 
        createdBy_name: {
          name: template.name,
          createdBy: adminUser.id
        }
      },
      update: template,
      create: {
        ...template,
        createdBy: adminUser.id,
        isPublic: true
      }
    })
    console.log(`✅ Created/Updated template: ${template.name}`)
  }

  console.log('✨ Starter templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
