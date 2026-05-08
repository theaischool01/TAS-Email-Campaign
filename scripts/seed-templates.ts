import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTemplates() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (!adminUser) {
    console.error('❌ Admin user not found. Please run main seed first.')
    return
  }

  const templates = [
    {
      name: 'Welcome Email',
      category: 'welcome',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Our Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px;">
              <h1 style="margin: 0; font-size: 24px;">Welcome to Our Platform!</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 5px;">
              <h2 style="color: #007bff;">Getting Started</h2>
              <p>Thank you for joining our platform! We're excited to have you on board.</p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile</li>
                <li>Explore our features</li>
                <li>Connect with other users</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
              <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Privacy Policy</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      json: JSON.stringify([
        {
          id: "header-1",
          type: "header",
          content: { text: "Welcome to Our Platform!" },
          styles: { backgroundColor: "#007bff", color: "#ffffff", padding: "20px" }
        },
        {
          id: "text-1",
          type: "text",
          content: { text: "Thank you for joining our platform! We're excited to have you on board. Here's what you can do next: Complete your profile, Explore our features, Connect with other users" },
          styles: { fontSize: "16px", color: "#333333", padding: "20px" }
        },
        {
          id: "button-1",
          type: "button",
          content: { text: "Get Started", url: "#", backgroundColor: "#28a745", color: "#ffffff" },
          styles: { textAlign: "center", padding: "20px" }
        },
        {
          id: "footer-1",
          type: "footer",
          content: { 
            unsubscribeText: "Unsubscribe",
            company: "Your Company",
            address: "123 Business St, City, State 12345",
            copyright: "© 2024 Your Company. All rights reserved."
          },
          styles: { backgroundColor: "#f8f9fa", padding: "20px", textAlign: "center" }
        }
      ]),
      isPublic: true,
      createdBy: adminUser.id
    },
    {
      name: 'Newsletter Template',
      category: 'newsletter',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monthly Newsletter</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
              <h1 style="margin: 0; font-size: 28px;">Monthly Newsletter</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your monthly dose of updates and insights</p>
            </div>
            <div style="padding: 30px; background: white; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea;">This Month's Highlights</h2>
              <div style="margin: 20px 0;">
                <h3>🚀 New Features</h3>
                <p>We've launched exciting new features that will enhance your experience...</p>
              </div>
              <div style="margin: 20px 0;">
                <h3>📊 Performance Updates</h3>
                <p>Your engagement has increased by 25% this month...</p>
              </div>
              <div style="margin: 20px 0;">
                <h3>🎯 Upcoming Events</h3>
                <p>Join us for our upcoming webinar on best practices...</p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Read More</a>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
              <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Privacy Policy</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      json: JSON.stringify([
        {
          id: "header-1",
          type: "header",
          content: { text: "Monthly Newsletter" },
          styles: { backgroundColor: "#667eea", color: "#ffffff", padding: "30px" }
        },
        {
          id: "text-1",
          type: "text",
          content: { text: "This Month's Highlights: 🚀 New Features: We've launched exciting new features that will enhance your experience... 📊 Performance Updates: Your engagement has increased by 25% this month... 🎯 Upcoming Events: Join us for our upcoming webinar on best practices..." },
          styles: { fontSize: "16px", color: "#333333", padding: "30px" }
        },
        {
          id: "button-1",
          type: "button",
          content: { text: "Read More", url: "#", backgroundColor: "#667eea", color: "#ffffff" },
          styles: { textAlign: "center", padding: "20px" }
        },
        {
          id: "footer-1",
          type: "footer",
          content: { 
            unsubscribeText: "Unsubscribe",
            company: "Your Company",
            address: "123 Business St, City, State 12345",
            copyright: "© 2024 Your Company. All rights reserved."
          },
          styles: { backgroundColor: "#f8f9fa", padding: "20px", textAlign: "center" }
        }
      ]),
      isPublic: true,
      createdBy: adminUser.id
    },
    {
      name: 'Promotional Offer',
      category: 'promotional',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Special Offer - 50% Off!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px;">
              <h1 style="margin: 0; font-size: 32px;">🔥 LIMITED TIME OFFER</h1>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">50% OFF EVERYTHING!</p>
              <p style="margin: 5px 0 0 0; font-size: 16px;">Use code: SAVE50</p>
            </div>
            <div style="padding: 30px; background: white; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #ff6b6b;">Don't Miss Out!</h2>
              <p>This is your chance to get amazing products at half price. Our biggest sale of the year is happening now!</p>
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⏰ Hurry! Offer ends in 48 hours</strong></p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">Shop Now - Save 50%</a>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
              <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Privacy Policy</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      json: JSON.stringify([
        {
          id: "header-1",
          type: "header",
          content: { text: "🔥 LIMITED TIME OFFER" },
          styles: { backgroundColor: "#ff6b6b", color: "#ffffff", padding: "30px" }
        },
        {
          id: "text-1",
          type: "text",
          content: { text: "Don't Miss Out! This is your chance to get amazing products at half price. Our biggest sale of the year is happening now! ⏰ Hurry! Offer ends in 48 hours" },
          styles: { fontSize: "16px", color: "#333333", padding: "30px" }
        },
        {
          id: "button-1",
          type: "button",
          content: { text: "Shop Now - Save 50%", url: "#", backgroundColor: "#ff6b6b", color: "#ffffff" },
          styles: { textAlign: "center", padding: "20px" }
        },
        {
          id: "footer-1",
          type: "footer",
          content: { 
            unsubscribeText: "Unsubscribe",
            company: "Your Company",
            address: "123 Business St, City, State 12345",
            copyright: "© 2024 Your Company. All rights reserved."
          },
          styles: { backgroundColor: "#f8f9fa", padding: "20px", textAlign: "center" }
        }
      ]),
      isPublic: true,
      createdBy: adminUser.id
    },
    {
      name: 'Event Invitation',
      category: 'event',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're Invited! Annual Summit 2024</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
              <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
              <p style="margin: 10px 0 0 0; font-size: 20px;">Annual Summit 2024</p>
            </div>
            <div style="padding: 30px; background: white; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #f093fb;">Join Us for an Amazing Event</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>📅 Date:</strong> December 15, 2024</p>
                <p><strong>⏰ Time:</strong> 9:00 AM - 6:00 PM EST</p>
                <p><strong>📍 Location:</strong> Virtual Event</p>
              </div>
              <h3>What to Expect:</h3>
              <ul>
                <li>Keynote speeches from industry leaders</li>
                <li>Interactive workshops and sessions</li>
                <li>Networking opportunities</li>
                <li>Product announcements and demos</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #f093fb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">RSVP Now</a>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
              <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Privacy Policy</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      json: JSON.stringify([
        {
          id: "header-1",
          type: "header",
          content: { text: "🎉 You're Invited!" },
          styles: { backgroundColor: "#f093fb", color: "#ffffff", padding: "30px" }
        },
        {
          id: "text-1",
          type: "text",
          content: { text: "Join Us for an Amazing Event! 📅 Date: December 15, 2024 ⏰ Time: 9:00 AM - 6:00 PM EST 📍 Location: Virtual Event What to Expect: Keynote speeches from industry leaders, Interactive workshops and sessions, Networking opportunities, Product announcements and demos" },
          styles: { fontSize: "16px", color: "#333333", padding: "30px" }
        },
        {
          id: "button-1",
          type: "button",
          content: { text: "RSVP Now", url: "#", backgroundColor: "#f093fb", color: "#ffffff" },
          styles: { textAlign: "center", padding: "20px" }
        },
        {
          id: "footer-1",
          type: "footer",
          content: { 
            unsubscribeText: "Unsubscribe",
            company: "Your Company",
            address: "123 Business St, City, State 12345",
            copyright: "© 2024 Your Company. All rights reserved."
          },
          styles: { backgroundColor: "#f8f9fa", padding: "20px", textAlign: "center" }
        }
      ]),
      isPublic: true,
      createdBy: adminUser.id
    },
    {
      name: 'Training Notice',
      category: 'notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Training Session Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #20c997; color: white; padding: 25px; text-align: center; border-radius: 10px;">
              <h1 style="margin: 0; font-size: 24px;">📚 Training Session</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Advanced Features Workshop</p>
            </div>
            <div style="padding: 25px; background: white; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #20c997;">Upcoming Training</h2>
              <div style="background: #e8f5e8; border-left: 4px solid #20c997; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Topic:</strong> Master Advanced Platform Features</p>
                <p style="margin: 10px 0 0 0;"><strong>Duration:</strong> 2 hours</p>
                <p style="margin: 10px 0 0 0;"><strong>Level:</strong> Intermediate to Advanced</p>
              </div>
              <h3>What You'll Learn:</h3>
              <ul>
                <li>Advanced automation techniques</li>
                <li>Custom integration strategies</li>
                <li>Performance optimization tips</li>
                <li>Best practices and workflows</li>
              </ul>
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>💡 Prerequisites:</strong> Basic platform knowledge required</p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #20c997; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Register Now</a>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
              <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Privacy Policy</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      json: JSON.stringify([
        {
          id: "header-1",
          type: "header",
          content: { text: "📚 Training Session" },
          styles: { backgroundColor: "#20c997", color: "#ffffff", padding: "25px" }
        },
        {
          id: "text-1",
          type: "text",
          content: { text: "Upcoming Training: Topic: Master Advanced Platform Features Duration: 2 hours Level: Intermediate to Advanced What You'll Learn: Advanced automation techniques, Custom integration strategies, Performance optimization tips, Best practices and workflows 💡 Prerequisites: Basic platform knowledge required" },
          styles: { fontSize: "16px", color: "#333333", padding: "25px" }
        },
        {
          id: "button-1",
          type: "button",
          content: { text: "Register Now", url: "#", backgroundColor: "#20c997", color: "#ffffff" },
          styles: { textAlign: "center", padding: "20px" }
        },
        {
          id: "footer-1",
          type: "footer",
          content: { 
            unsubscribeText: "Unsubscribe",
            company: "Your Company",
            address: "123 Business St, City, State 12345",
            copyright: "© 2024 Your Company. All rights reserved."
          },
          styles: { backgroundColor: "#f8f9fa", padding: "20px", textAlign: "center" }
        }
      ]),
      isPublic: true,
      createdBy: adminUser.id
    }
  ]

  console.log('🌱 Seeding starter templates...')
  
  for (const template of templates) {
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: { 
        name: template.name,
        createdBy: template.createdBy 
      }
    })

    if (existingTemplate) {
      console.log(`⚠️  Template "${template.name}" already exists, skipping...`)
      continue
    }

    const createdTemplate = await prisma.emailTemplate.create({
      data: template
    })
    
    console.log(`✅ Created template: ${createdTemplate.name} (${createdTemplate.category})`)
  }

  console.log('🎉 Template seeding completed!')
}

seedTemplates()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
