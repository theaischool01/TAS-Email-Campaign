import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const starterTemplates = [
  {
    name: "Welcome Email",
    category: "welcome",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Our Service</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background-color: #007bff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .logo-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-text">W</div>
            </div>
          </div>
          
          <div class="content">
            <h1>Welcome {{first_name}}!</h1>
            <p>Thank you for joining our service. We're excited to have you on board.</p>
            <p>Your account has been successfully created and you can now access all our features.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>
              <a href="#" class="button">Get Started</a>
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: "Newsletter Template",
    category: "newsletter",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Newsletter</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .article {
            margin-bottom: 20px;
          }
          .article h2 {
            color: #007bff;
            font-size: 20px;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{company}} Newsletter</h1>
            <p>Your monthly update of news and insights</p>
          </div>
          
          <div class="content">
            <div class="article">
              <h2>Feature Article: New Product Launch</h2>
              <p>We're excited to announce our latest product that will revolutionize how you work.</p>
              <p>Learn more about the features and benefits in this exclusive preview.</p>
              <a href="#" class="button">Read More</a>
            </div>
            
            <div class="article">
              <h2>Industry Insight</h2>
              <p>Discover the latest trends and best practices in your field.</p>
              <p>Our experts have analyzed market data to bring you valuable insights.</p>
              <a href="#" class="button">View Analysis</a>
            </div>
            
            <div class="article">
              <h2>Upcoming Event</h2>
              <p>Join us for our exclusive webinar on industry innovations.</p>
              <p>Connect with peers and learn from the best in the business.</p>
              <a href="#" class="button">Register Now</a>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 {{company}}. All rights reserved.</p>
            <p><a href="#" style="color: #666;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: "Promotional Offer",
    category: "promotional",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Special Offer - 50% Off</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .offer {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .offer h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .offer h2 {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .discount {
            font-size: 48px;
            font-weight: bold;
            color: #ffcc00;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 18px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="offer">
            <h1>LIMITED TIME OFFER</h1>
            <h2>Get 50% Off Everything</h2>
            <div class="discount">50% OFF</div>
            <p>Use this exclusive discount to save big on your next purchase.</p>
            <p>Valid until the end of this month. Don't miss out!</p>
            <a href="#" class="button">Shop Now</a>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 {{company}}. All rights reserved.</p>
            <p><a href="#" style="color: #666;">No thanks, I'm not interested</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: "Event Invitation",
    category: "event",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited! - {{company}} Event</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
          }
          .event-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .event-title {
            font-size: 24px;
            color: #007bff;
            margin-bottom: 10px;
          }
          .event-info {
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          
          <div class="content">
            <div class="event-details">
              <div class="event-title">{{company}} Annual Conference</div>
              <div class="event-info">
                <p><strong>Date:</strong> December 15, 2024</p>
                <p><strong>Time:</strong> 2:00 PM - 6:00 PM</p>
                <p><strong>Location:</strong> Main Convention Center</p>
                <p><strong>Dress Code:</strong> Business Casual</p>
              </div>
            </div>
            
            <p>Join us for an exciting day of networking, learning, and celebration.</p>
            <p>Connect with industry leaders and discover new opportunities.</p>
            <a href="#" class="button">RSVP Now</a>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 {{company}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: "Training Notice",
    category: "notification",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Training Session Reminder</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background-color: #17a2b8;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
          }
          .training-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-item {
            margin-bottom: 15px;
          }
          .info-item h3 {
            color: #17a2b8;
            margin-bottom: 5px;
          }
          .button {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Training Session</h1>
          </div>
          
          <div class="content">
            <p>Hello {{first_name}},</p>
            <p>This is a reminder about your upcoming training session.</p>
            
            <div class="training-info">
              <div class="info-item">
                <h3>Session Details</h3>
                <p><strong>Date:</strong> December 20, 2024</p>
                <p><strong>Time:</strong> 10:00 AM - 2:00 PM</p>
                <p><strong>Location:</strong> Training Room A</p>
                <p><strong>Instructor:</strong> John Smith</p>
              </div>
              
              <div class="info-item">
                <h3>What to Bring</h3>
                <p>• Laptop or tablet</p>
                <p>• Notepad and pen</p>
                <p>• Questions about current projects</p>
              </div>
              
              <div class="info-item">
                <h3>Preparation</h3>
                <p>• Review the training materials sent earlier</p>
                <p>• Think about challenges you're facing</p>
                <p>• Prepare questions for the Q&A session</p>
              </div>
            </div>
            
            <p>We look forward to seeing you there!</p>
            <a href="#" class="button">Confirm Attendance</a>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 {{company}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
]

async function createStarterTemplates(): Promise<void> {
  try {
    console.log('Creating starter templates...')
    
    // Get or create a SUPER_ADMIN user for template creation
    let adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (!adminUser) {
      // Create a default admin user if none exists
      const hashedPassword = await bcrypt.hash('admin123')
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@template.com',
          name: 'Template Admin',
          role: 'SUPER_ADMIN',
          password: hashedPassword
        }
      })
      console.log('Created admin user for templates:', adminUser.email)
    }
    
    // Create starter templates
    for (const template of starterTemplates) {
      await prisma.emailTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          html: template.html,
          json: JSON.stringify({ blocks: [], styles: {} }),
          isPublic: true,
          createdBy: adminUser.id
        }
      })
      console.log(`Created template: ${template.name}`)
    }
    
    console.log('Starter templates created successfully!')
    
  } catch (error) {
    console.error('Error creating starter templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createStarterTemplates()
