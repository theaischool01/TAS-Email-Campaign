const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMMON_STYLES = `
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { padding: 32px; text-align: center; border-bottom: 1px solid #f1f5f9; }
    .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -1px; text-decoration: none; }
    .hero { padding: 48px 32px; text-align: center; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
    .hero-alt { padding: 48px 32px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; }
    .hero h1 { margin: 0; font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .hero-alt h1 { margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2; }
    .hero p { font-size: 18px; color: #475569; margin-top: 16px; line-height: 1.6; }
    .hero-alt p { font-size: 18px; color: #cbd5e1; margin-top: 16px; line-height: 1.6; }
    .content { padding: 40px 32px; line-height: 1.7; font-size: 16px; color: #334155; }
    .card-grid { padding: 0 32px 40px; display: table; width: 100%; border-collapse: separate; border-spacing: 16px 0; }
    .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; display: table-cell; width: 50%; vertical-align: top; }
    .card h3 { margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #0f172a; }
    .card p { margin: 0; font-size: 14px; color: #64748b; }
    .cta-box { padding: 0 32px 48px; text-align: center; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); transition: all 0.2s ease; }
    .btn-alt { display: inline-block; background-color: #ffffff; color: #2563eb !important; padding: 16px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 16px; border: 1px solid #e2e8f0; }
    .social { padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
    .social-link { display: inline-block; margin: 0 12px; color: #64748b; text-decoration: none; font-size: 14px; font-weight: 600; }
    .footer { padding: 40px 32px; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.6; }
    .footer a { color: #64748b; text-decoration: underline; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; background-color: #dcfce7; color: #166534; }
  </style>
`;

const TEMPLATES = [
  {
    name: 'Premium Welcome Email',
    category: 'Welcome',
    html: `
      <!DOCTYPE html>
      <html>
      <head>${COMMON_STYLES}</head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header"><a href="{{APP_URL}}" class="logo">BrandSpace</a></div>
            <div class="hero">
              <span class="badge">Success</span>
              <h1>Welcome to the inner circle, {{first_name}}!</h1>
              <p>You've just joined thousands of professionals growing their business with us. Let's make something amazing together.</p>
            </div>
            <div class="content">
              <p>Hi {{first_name}},</p>
              <p>We're absolutely thrilled to have you onboard. Our mission is to provide you with the most powerful email automation tools on the planet.</p>
              <p>To get started, we recommend exploring your new dashboard and setting up your first audience list.</p>
            </div>
            <div class="cta-box">
              <a href="{{APP_URL}}/dashboard" class="btn">Get Started Now</a>
            </div>
            <div class="card-grid">
              <div class="card">
                <h3>Quick Guide</h3>
                <p>Learn the basics of campaign creation in under 5 minutes.</p>
              </div>
              <div class="card">
                <h3>Template Lab</h3>
                <p>Browse our collection of high-converting designs.</p>
              </div>
            </div>
            <div class="social">
              <a href="#" class="social-link">Twitter</a>
              <a href="#" class="social-link">LinkedIn</a>
              <a href="#" class="social-link">Instagram</a>
            </div>
            <div class="footer">
              <p><strong>BrandSpace Inc.</strong><br>123 Digital Nomad Way, Suite 500<br>San Francisco, CA 94103</p>
              <p>You're receiving this because you signed up for BrandSpace. We promise to only send things you'll love.</p>
              <p style="margin-top: 24px;">
                <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> &bull; <a href="#">Manage Preferences</a> &bull; <a href="mailto:support@brandspace.com">Contact Support</a>
              </p>
              <p style="margin-top: 24px; font-size: 11px;">&copy; 2026 BrandSpace. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: 'Flash Sale Promo',
    category: 'Promotional',
    html: `
      <!DOCTYPE html>
      <html>
      <head>${COMMON_STYLES}</head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header"><a href="{{APP_URL}}" class="logo">BrandSpace</a></div>
            <div class="hero-alt">
              <span class="badge" style="background-color: #fee2e2; color: #991b1b;">Limited Time</span>
              <h1 style="color: #ffffff;">FLASH SALE: 40% OFF EVERYTHING!</h1>
              <p style="color: #e2e8f0;">Our biggest event of the season is here. Upgrade your plan and save big today.</p>
            </div>
            <div class="content" style="text-align: center;">
              <p>Don't wait! This offer expires in <strong>24 hours</strong>.</p>
              <p>Use the code <strong>SAVE40</strong> at checkout to claim your discount on any annual subscription.</p>
            </div>
            <div class="cta-box">
              <a href="{{APP_URL}}/pricing" class="btn" style="background-color: #ef4444; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);">Claim My 40% Discount</a>
            </div>
            <div style="padding: 0 32px 40px;">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px dashed #cbd5e1; text-align: center;">
                <p style="margin: 0; font-weight: 700; color: #1e293b;">Offer valid until {{campaign_name}} ends.</p>
              </div>
            </div>
            <div class="social">
              <a href="#" class="social-link">Twitter</a>
              <a href="#" class="social-link">LinkedIn</a>
            </div>
            <div class="footer">
              <p><strong>BrandSpace Inc.</strong><br>123 Digital Nomad Way, Suite 500<br>San Francisco, CA 94103</p>
              <p style="margin-top: 24px;">
                <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> &bull; <a href="#">Manage Preferences</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: 'Monthly Digest',
    category: 'Newsletter',
    html: `
      <!DOCTYPE html>
      <html>
      <head>${COMMON_STYLES}</head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header"><a href="{{APP_URL}}" class="logo">BrandSpace Digest</a></div>
            <div class="hero">
              <h1>The Monthly Edit</h1>
              <p>Insights, trends, and product updates from the world of digital marketing.</p>
            </div>
            <div class="content">
              <h2 style="font-size: 20px; color: #0f172a;">Top Stories This Month</h2>
              <div style="margin-top: 24px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
                <h3 style="margin: 0; color: #2563eb;">The Future of AI in Email</h3>
                <p style="margin-top: 8px; font-size: 14px;">Explore how generative AI is transforming personalized communication at scale.</p>
                <a href="#" style="color: #2563eb; font-size: 14px; font-weight: 600; text-decoration: none;">Read more &rarr;</a>
              </div>
              <div style="margin-top: 24px;">
                <h3 style="margin: 0; color: #2563eb;">10 Tips for Better Deliverability</h3>
                <p style="margin-top: 8px; font-size: 14px;">Stop landing in the spam folder with these essential authentication practices.</p>
                <a href="#" style="color: #2563eb; font-size: 14px; font-weight: 600; text-decoration: none;">Read more &rarr;</a>
              </div>
            </div>
            <div class="cta-box" style="text-align: left;">
              <a href="#" class="btn">View Full Newsletter</a>
            </div>
            <div class="social">
              <a href="#" class="social-link">Twitter</a>
              <a href="#" class="social-link">LinkedIn</a>
            </div>
            <div class="footer">
               <p><strong>BrandSpace Inc.</strong><br>123 Digital Nomad Way, Suite 500<br>San Francisco, CA 94103</p>
               <p style="margin-top: 24px;">
                <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> &bull; <a href="#">Manage Preferences</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  },
  {
    name: 'Event Invitation',
    category: 'Events',
    html: `
      <!DOCTYPE html>
      <html>
      <head>${COMMON_STYLES}</head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header"><a href="{{APP_URL}}" class="logo">BrandSpace Live</a></div>
            <div class="hero" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
              <span class="badge" style="background-color: #ffffff; color: #4f46e5;">Invitation</span>
              <h1 style="color: #ffffff;">Exclusive Webinar: Scaling to 10k Users</h1>
              <p style="color: #e0e7ff;">Join us for an hour of deep-dive strategy with industry experts.</p>
            </div>
            <div class="content">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">DATE & TIME</p>
                <p style="margin: 4px 0 0; font-size: 18px; color: #0f172a; font-weight: 700;">Thursday, June 12th @ 2:00 PM EST</p>
              </div>
              <p>Hi {{first_name}},</p>
              <p>You're invited to an exclusive session where we reveal the exact frameworks used by top startups to scale their audience acquisition.</p>
            </div>
            <div class="cta-box">
              <a href="#" class="btn" style="background-color: #4f46e5; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Reserve My Seat</a>
            </div>
            <div class="footer text-center">
               <p><strong>BrandSpace Inc.</strong><br>123 Digital Nomad Way, Suite 500<br>San Francisco, CA 94103</p>
               <p style="margin-top: 24px;">
                <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> &bull; <a href="#">Manage Preferences</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }
];

async function seed() {
  try {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('❌ No users found. Please register an account first.');
      return;
    }

    const userId = users[0].id;
    console.log(`🌱 Seeding templates for user: ${users[0].email}`);

    for (const t of TEMPLATES) {
      await prisma.emailTemplate.upsert({
        where: { 
          createdBy_name: { createdBy: userId, name: t.name } 
        },
        update: { 
          html: t.html,
          category: t.category 
        },
        create: {
          name: t.name,
          category: t.category,
          html: t.html,
          createdBy: userId,
          isPublic: true
        }
      });
      console.log(`✅ ${t.name} (Category: ${t.category})`);
    }

    // Also update generic ones if they exist
    const legacyTemplates = ['Welcome Email', 'Promotional Offer', 'Newsletter Template', 'Training Notice'];
    for (const name of legacyTemplates) {
       const template = TEMPLATES.find(temp => temp.name.includes(name.split(' ')[0])) || TEMPLATES[0];
       await prisma.emailTemplate.updateMany({
         where: { name },
         data: { html: template.html }
       });
    }

    console.log('\n🌟 ALL PREMIUM TEMPLATES SYNCED SUCCESSFULLY!');
  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
