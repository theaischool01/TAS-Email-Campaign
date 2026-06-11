// Default templates file for multi-tenant SaaS seeding
// Standardized email layouts based on industry best practices (Mailchimp, Brevo, HubSpot)

function buildEmailHtml({
  title,
  content,
  ctaText,
  ctaUrl,
  accentColor = "#2563eb"
}: {
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  accentColor?: string;
}) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 30px 15px; margin: 0; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
        <!-- Header -->
        <div style="background-color: ${accentColor}; padding: 30px; text-align: center; color: #ffffff;">
          <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; opacity: 0.85;">{{companyName}}</span>
          <h1 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 800; line-height: 1.2;">${title}</h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; color: #1f2937; line-height: 1.6; font-size: 16px;">
          <p style="margin-top: 0; font-size: 18px; font-weight: 700; color: #111827;">Hello {{firstName}},</p>
          ${content}
          
          ${ctaText && ctaUrl ? `
            <div style="margin: 35px 0; text-align: center;">
              <a href="${ctaUrl}" style="background-color: ${accentColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">${ctaText}</a>
            </div>
          ` : ""}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.5;">
          <p style="margin-top: 0; font-weight: 600;">{{companyName}} Support Team</p>
          <p>If you have any questions, reach out to us at <a href="mailto:{{supportEmail}}" style="color: ${accentColor}; text-decoration: none;">{{supportEmail}}</a></p>
          <p style="margin-top: 20px;">
            You are receiving this because you are a registered user of {{companyName}}.<br />
            <a href="{{unsubscribeLink}}" style="color: #6b7280; text-decoration: underline; font-weight: 500;">Unsubscribe from all future emails</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

export const DEFAULT_EMAIL_TEMPLATES = [
  // A. Welcome & Onboarding (Blue: #2563eb)
  {
    name: "Welcome to Our Community",
    subject: "Welcome to {{companyName}}!",
    category: "Welcome & Onboarding",
    thumbnail: "/templates/welcome-community.png",
    html: buildEmailHtml({
      title: "Welcome to the Family!",
      content: "<p>We're thrilled to have you here. Our platform is designed to make your journey simple, fast, and successful. Take a look around and explore your new workspace today.</p>",
      ctaText: "Go to Dashboard",
      ctaUrl: "{{websiteUrl}}/dashboard",
      accentColor: "#2563eb"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Getting Started Guide",
    subject: "Your Quick Start Guide for {{productName}}",
    category: "Welcome & Onboarding",
    thumbnail: "/templates/getting-started.png",
    html: buildEmailHtml({
      title: "Get Started in 3 Steps",
      content: "<p>To help you get the most out of {{productName}}, we've created a simple quick-start guide. Follow these steps to set up your profile, import your contacts, and launch your first email campaign.</p><ul><li>Step 1: Complete your organization settings</li><li>Step 2: Upload your first list</li><li>Step 3: Draft and test a campaign</li></ul>",
      ctaText: "View Quick Start Guide",
      ctaUrl: "{{websiteUrl}}/docs/getting-started",
      accentColor: "#2563eb"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Account Verification",
    subject: "Verify your email address for {{companyName}}",
    category: "Welcome & Onboarding",
    thumbnail: "/templates/verify-account.png",
    html: buildEmailHtml({
      title: "Confirm Your Email",
      content: "<p>Please verify your email address to complete your account setup. This ensures that you receive notifications, updates, and secure account alerts.</p>",
      ctaText: "Verify Account",
      ctaUrl: "{{websiteUrl}}/auth/verify?email={{email}}",
      accentColor: "#2563eb"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Complete Your Profile",
    subject: "Finish setting up {{productName}}",
    category: "Welcome & Onboarding",
    thumbnail: "/templates/complete-profile.png",
    html: buildEmailHtml({
      title: "Complete Your Setup",
      content: "<p>You're almost there! Complete your organization profile details now to activate all platform integrations and start sending bulk emails with SES.</p>",
      ctaText: "Complete Profile",
      ctaUrl: "{{websiteUrl}}/settings",
      accentColor: "#2563eb"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "First Purchase Welcome Offer",
    subject: "Special gift inside: Welcome to {{companyName}}!",
    category: "Welcome & Onboarding",
    thumbnail: "/templates/welcome-offer.png",
    html: buildEmailHtml({
      title: "Welcome Special Offer",
      content: "<p>To welcome you to our community, we've prepared a special discount for your first transaction. Use the code below at checkout to redeem it.</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #2563eb; background:#eff6ff; border-radius:6px;'><strong style='font-size:24px; color:#2563eb;'>{{discountCode}}</strong></div>",
      ctaText: "Claim Offer",
      ctaUrl: "{{websiteUrl}}/shop",
      accentColor: "#2563eb"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Thank You for Signing Up",
    subject: "Thanks for joining {{companyName}}",
    category: "Welcome & Onboarding",
    thumbnail: "/templates/thank-you-signup.png",
    html: buildEmailHtml({
      title: "Thank You!",
      content: "<p>Thank you for creating an account with {{companyName}}. We're dedicated to providing the best tools and support to help you achieve your goals.</p>",
      ctaText: "Explore Workspace",
      ctaUrl: "{{websiteUrl}}/dashboard",
      accentColor: "#2563eb"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // B. Birthday & Personal Occasions (Pink/Purple: #db2777)
  {
    name: "Happy Birthday Wishes",
    subject: "Happy Birthday from {{companyName}}!",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/birthday-wishes.png",
    html: buildEmailHtml({
      title: "Happy Birthday!",
      content: "<p>We wish you a wonderful day filled with joy, celebration, and success. Thank you for being an important member of our community!</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Birthday Special Discount",
    subject: "A birthday gift for you from {{companyName}} 🎂",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/birthday-discount.png",
    html: buildEmailHtml({
      title: "Your Birthday Gift!",
      content: "<p>Celebrate your special day with an exclusive discount code. Enter this promo code during checkout to claim your gift:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #db2777; background:#fdf2f8; border-radius:6px;'><strong style='font-size:24px; color:#db2777;'>{{discountCode}}</strong></div>",
      ctaText: "Redeem Gift",
      ctaUrl: "{{websiteUrl}}/shop",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Anniversary Celebration",
    subject: "Happy Anniversary from {{companyName}}!",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/anniversary.png",
    html: buildEmailHtml({
      title: "Happy Anniversary!",
      content: "<p>We're celebrating another milestone with you today. Thank you for your continued trust and partnership with {{companyName}}.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Customer Membership Anniversary",
    subject: "Celebrating your {{companyName}} anniversary!",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/membership-anniversary.png",
    html: buildEmailHtml({
      title: "Congratulations on {{companyName}} Anniversary!",
      content: "<p>It's been a year since you joined {{companyName}}! We wanted to take a moment to thank you for your support and for being a valued part of our platform.</p>",
      ctaText: "Check Rewards",
      ctaUrl: "{{websiteUrl}}/profile/rewards",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Holiday Greeting Card",
    subject: "Warmest wishes from {{companyName}}",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/holiday-greeting.png",
    html: buildEmailHtml({
      title: "Happy Holidays!",
      content: "<p>Wishing you and your family a safe, peaceful, and joyful holiday season. Thank you for your support and dedication throughout the year.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "New Year Wishes",
    subject: "Happy New Year from {{companyName}}! 🎉",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/new-year.png",
    html: buildEmailHtml({
      title: "Happy New Year!",
      content: "<p>Here's to a fresh start, new achievements, and continued growth. Wishing you a successful and prosperous year ahead.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Christmas Greetings",
    subject: "Merry Christmas from {{companyName}} 🎄",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/christmas.png",
    html: buildEmailHtml({
      title: "Merry Christmas!",
      content: "<p>May your heart and home be filled with peace, love, and happiness this holiday season. Warmest wishes from the entire {{companyName}} team.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Diwali Wishes",
    subject: "Happy Diwali from {{companyName}}! 🪔",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/diwali.png",
    html: buildEmailHtml({
      title: "Happy Diwali!",
      content: "<p>May the festival of lights bring prosperity, happiness, and success to your life. Wishing you and your loved ones a brilliant Diwali.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Eid Mubarak Greeting",
    subject: "Eid Mubarak from {{companyName}}!",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/eid.png",
    html: buildEmailHtml({
      title: "Eid Mubarak!",
      content: "<p>Wishing you and your family a peaceful, blessed, and joyous Eid. May this special day bring happiness and success to your home.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Ramadan Greetings",
    subject: "Ramadan Kareem from {{companyName}}",
    category: "Birthday & Personal Occasions",
    thumbnail: "/templates/ramadan.png",
    html: buildEmailHtml({
      title: "Ramadan Kareem!",
      content: "<p>Wishing you a blessed, holy, and reflective Ramadan. May this month bring peace, health, and harmony to you and your family.</p>",
      accentColor: "#db2777"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // C. Marketing & Promotions (Orange/Red: #ea580c)
  {
    name: "New Product Launch",
    subject: "Announcing the launch of {{productName}}!",
    category: "Marketing & Promotions",
    thumbnail: "/templates/product-launch.png",
    html: buildEmailHtml({
      title: "Introducing {{productName}}!",
      content: "<p>We are thrilled to unveil our latest release. {{productName}} is designed to enhance your workflow, streamline tasks, and deliver faster performance.</p>",
      ctaText: "Discover Features",
      ctaUrl: "{{websiteUrl}}/products/new",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Limited Time Offer",
    subject: "Hurry! Limited time offer from {{companyName}}",
    category: "Marketing & Promotions",
    thumbnail: "/templates/limited-offer.png",
    html: buildEmailHtml({
      title: "Don't Miss Out!",
      content: "<p>This is a limited-time opportunity to access premium features at a special price. Offer ends on {{eventDate}}.</p>",
      ctaText: "Shop Sale Now",
      ctaUrl: "{{websiteUrl}}/pricing",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Flash Sale",
    subject: "Flash Sale: Save big at {{companyName}} today!",
    category: "Marketing & Promotions",
    thumbnail: "/templates/flash-sale.png",
    html: buildEmailHtml({
      title: "24-Hour Flash Sale!",
      content: "<p>Save on all plans and features during our 24-hour flash sale. Enter coupon code below during purchase:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #ea580c; background:#fff7ed; border-radius:6px;'><strong style='font-size:24px; color:#ea580c;'>{{discountCode}}</strong></div>",
      ctaText: "Shop the Flash Sale",
      ctaUrl: "{{websiteUrl}}/shop",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Seasonal Sale",
    subject: "Seasonal Sale: Exclusive discounts at {{companyName}}",
    category: "Marketing & Promotions",
    thumbnail: "/templates/seasonal-sale.png",
    html: buildEmailHtml({
      title: "New Season, New Deals!",
      content: "<p>Upgrade your platform workspace and tools for the new season with our exclusive catalog-wide deals.</p>",
      ctaText: "View Collection",
      ctaUrl: "{{websiteUrl}}/catalog",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Black Friday Sale",
    subject: "Black Friday Sale: Our biggest deals of the year!",
    category: "Marketing & Promotions",
    thumbnail: "/templates/black-friday.png",
    html: buildEmailHtml({
      title: "Black Friday is Live!",
      content: "<p>Black Friday has arrived. Take advantage of our most significant discounts of the year on all pricing tiers and setups.</p>",
      ctaText: "Get Black Friday Deals",
      ctaUrl: "{{websiteUrl}}/deals/black-friday",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Cyber Monday Deal",
    subject: "Cyber Monday Special Deals from {{companyName}}",
    category: "Marketing & Promotions",
    thumbnail: "/templates/cyber-monday.png",
    html: buildEmailHtml({
      title: "Cyber Monday Special",
      content: "<p>Skip the crowds and shop our exclusive digital deals online. These offers are valid for today only.</p>",
      ctaText: "Claim Cyber Deal",
      ctaUrl: "{{websiteUrl}}/deals/cyber-monday",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Buy One Get One Offer",
    subject: "BOGO Special Offer from {{companyName}}",
    category: "Marketing & Promotions",
    thumbnail: "/templates/bogo.png",
    html: buildEmailHtml({
      title: "Buy One, Get One Free!",
      content: "<p>Add any plan or tool to your account today and receive an identical package completely free. Offer ends soon.</p>",
      ctaText: "Shop BOGO Offer",
      ctaUrl: "{{websiteUrl}}/shop/bogo",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Coupon Code Promotion",
    subject: "Your exclusive coupon code from {{companyName}}",
    category: "Marketing & Promotions",
    thumbnail: "/templates/coupon.png",
    html: buildEmailHtml({
      title: "Save on Your Next Purchase",
      content: "<p>We appreciate having you with us. Enjoy this special coupon code on your next campaign upgrade:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #ea580c; background:#fff7ed; border-radius:6px;'><strong style='font-size:24px; color:#ea580c;'>{{discountCode}}</strong></div>",
      ctaText: "Apply Coupon",
      ctaUrl: "{{websiteUrl}}/checkout?coupon={{discountCode}}",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Referral Program",
    subject: "Refer a friend, get rewarded by {{companyName}}!",
    category: "Marketing & Promotions",
    thumbnail: "/templates/referral.png",
    html: buildEmailHtml({
      title: "Share and Earn Rewards",
      content: "<p>Invite your friends, colleagues, or clients to {{companyName}}. When they register, both of you will receive platform credits.</p>",
      ctaText: "Get Referral Link",
      ctaUrl: "{{websiteUrl}}/referral",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Product Recommendation",
    subject: "Selected just for you by {{companyName}}",
    category: "Marketing & Promotions",
    thumbnail: "/templates/recommendations.png",
    html: buildEmailHtml({
      title: "Recommended Just For You",
      content: "<p>Based on your profile activity and previous setups, our engine has identified products and updates that can save you time.</p>",
      ctaText: "View Recommendations",
      ctaUrl: "{{websiteUrl}}/products/recommendations",
      accentColor: "#ea580c"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // D. E-commerce Customer Journey (Teal: #0d9488)
  {
    name: "Order Confirmation",
    subject: "Order Confirmation: {{orderNumber}}",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/order-confirm.png",
    html: buildEmailHtml({
      title: "Thank You for Your Order!",
      content: "<p>We have successfully received your order <strong>{{orderNumber}}</strong>. Our team is processing it now, and we'll send a shipping update as soon as it leaves the warehouse.</p>",
      ctaText: "Track Order Status",
      ctaUrl: "{{websiteUrl}}/orders/{{orderNumber}}",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Payment Confirmation",
    subject: "Payment Receipt: {{orderNumber}}",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/payment-confirm.png",
    html: buildEmailHtml({
      title: "Payment Received",
      content: "<p>We have successfully processed your payment for order <strong>{{orderNumber}}</strong>. A PDF copy of your official invoice is now available in your portal profile.</p>",
      ctaText: "View Invoice",
      ctaUrl: "{{websiteUrl}}/profile/invoices",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Shipping Update",
    subject: "Your order {{orderNumber}} has shipped!",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/shipping-update.png",
    html: buildEmailHtml({
      title: "Your Order is on the Way!",
      content: "<p>Great news! Your package for order <strong>{{orderNumber}}</strong> has been handed over to the courier. You can trace its journey using the tracking reference link below.</p>",
      ctaText: "Track Package Delivery",
      ctaUrl: "{{websiteUrl}}/shipping/track?id={{orderNumber}}",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Delivery Confirmation",
    subject: "Delivered: Order {{orderNumber}}",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/delivery-confirm.png",
    html: buildEmailHtml({
      title: "Package Delivered",
      content: "<p>Our records show that order <strong>{{orderNumber}}</strong> was successfully delivered to your shipping address today. Please let us know if you experience any issues.</p>",
      ctaText: "Confirm Delivery Receipt",
      ctaUrl: "{{websiteUrl}}/orders/confirm?id={{orderNumber}}",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Order Delay Apology",
    subject: "Update regarding your order {{orderNumber}}",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/order-delay.png",
    html: buildEmailHtml({
      title: "We Apologize for the Delay",
      content: "<p>We wanted to let you know that shipment of order <strong>{{orderNumber}}</strong> is delayed due to high volume. We apologize for the inconvenience and are working to ship it as quickly as possible.</p>",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Abandoned Cart Reminder",
    subject: "Did you forget something in your cart?",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/abandoned-cart.png",
    html: buildEmailHtml({
      title: "Items Left in Your Cart",
      content: "<p>We noticed you left some items in your cart. We've saved them for you so you can easily complete your purchase.</p>",
      ctaText: "Return to Cart",
      ctaUrl: "{{websiteUrl}}/cart",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Back in Stock Alert",
    subject: "Good news: {{productName}} is back in stock!",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/back-in-stock.png",
    html: buildEmailHtml({
      title: "Back in Stock!",
      content: "<p>The item you were watching, <strong>{{productName}}</strong>, is now restocked and ready for shipping. Stock is limited, so grab yours before it runs out.</p>",
      ctaText: "Buy Now",
      ctaUrl: "{{websiteUrl}}/products/{{productName}}",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Price Drop Alert",
    subject: "Price drop on {{productName}}!",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/price-drop.png",
    html: buildEmailHtml({
      title: "Price Decreased!",
      content: "<p>Good news! The price of <strong>{{productName}}</strong> has dropped. Save instantly by placing your order today.</p>",
      ctaText: "View New Price",
      ctaUrl: "{{websiteUrl}}/products/{{productName}}",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Review Request",
    subject: "How do you like your purchase? Tell us!",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/review-request.png",
    html: buildEmailHtml({
      title: "Share Your Feedback",
      content: "<p>We hope you are enjoying your recent purchase. We would love to hear your thoughts. Your feedback helps us improve and guides other customers.</p>",
      ctaText: "Write a Review",
      ctaUrl: "{{websiteUrl}}/reviews/new?order={{orderNumber}}",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Thank You For Your Purchase",
    subject: "Thank you for your order!",
    category: "E-commerce Customer Journey",
    thumbnail: "/templates/thank-you-purchase.png",
    html: buildEmailHtml({
      title: "Thank You!",
      content: "<p>Thank you for choosing {{companyName}} for your recent purchase. We value your business and hope to serve you again soon.</p>",
      ctaText: "Explore More",
      ctaUrl: "{{websiteUrl}}/shop",
      accentColor: "#0d9488"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // E. Newsletter & Content (Gray/Slate: #475569)
  {
    name: "Weekly Newsletter",
    subject: "Your Weekly Newsletter from {{companyName}}",
    category: "Newsletter & Content",
    thumbnail: "/templates/weekly-newsletter.png",
    html: buildEmailHtml({
      title: "Weekly Summary",
      content: "<p>Stay informed with this week's collection of articles, updates, and product tips curated to improve your platform productivity.</p>",
      ctaText: "Read All Articles",
      ctaUrl: "{{websiteUrl}}/blog",
      accentColor: "#475569"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Monthly Newsletter",
    subject: "Monthly Newsletter: What's new at {{companyName}}",
    category: "Newsletter & Content",
    thumbnail: "/templates/monthly-newsletter.png",
    html: buildEmailHtml({
      title: "Monthly Round-up",
      content: "<p>Here is your monthly summary of platform updates, popular case studies, and insights from the team.</p>",
      ctaText: "Read Monthly Digest",
      ctaUrl: "{{websiteUrl}}/newsletter/archive",
      accentColor: "#475569"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Company Updates",
    subject: "Latest company news from {{companyName}}",
    category: "Newsletter & Content",
    thumbnail: "/templates/company-updates.png",
    html: buildEmailHtml({
      title: "Company News & Updates",
      content: "<p>We're sharing some exciting milestones, team updates, and vision maps for the upcoming quarter with our community.</p>",
      ctaText: "Learn More",
      ctaUrl: "{{websiteUrl}}/about/news",
      accentColor: "#475569"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Blog Announcement",
    subject: "New blog post: Scaling your email campaigns",
    category: "Newsletter & Content",
    thumbnail: "/templates/blog-announcement.png",
    html: buildEmailHtml({
      title: "New on the Blog",
      content: "<p>Read our latest post to learn advanced techniques for managing email lists, setting up triggers, and optimizing inbox deliverability.</p>",
      ctaText: "Read Blog Post",
      ctaUrl: "{{websiteUrl}}/blog/post",
      accentColor: "#475569"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Industry Insights",
    subject: "Key email SaaS trends this month",
    category: "Newsletter & Content",
    thumbnail: "/templates/industry-insights.png",
    html: buildEmailHtml({
      title: "Industry Reports",
      content: "<p>Our experts have gathered the latest industry metrics and benchmarks. Compare your deliverability rates and trends today.</p>",
      ctaText: "Download Report",
      ctaUrl: "{{websiteUrl}}/resources/insights",
      accentColor: "#475569"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Tips & Tricks Newsletter",
    subject: "Tips & tricks to scale {{productName}} usage",
    category: "Newsletter & Content",
    thumbnail: "/templates/tips-tricks.png",
    html: buildEmailHtml({
      title: "Power User Tips",
      content: "<p>Unlock hidden shortcuts and features in your account. These quick tips will save you hours on your next setup.</p>",
      ctaText: "View Tips",
      ctaUrl: "{{websiteUrl}}/docs/tips",
      accentColor: "#475569"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // F. Events & Community (Purple: #7c3aed)
  {
    name: "Event Invitation",
    subject: "Join us for our upcoming community meetup!",
    category: "Events & Community",
    thumbnail: "/templates/event-invite.png",
    html: buildEmailHtml({
      title: "You're Invited!",
      content: "<p>We are hosting a community meetup on <strong>{{eventDate}}</strong> at <strong>{{eventLocation}}</strong>. Connect with fellow users, share your setups, and meet the founders.</p>",
      ctaText: "Register for Event",
      ctaUrl: "{{websiteUrl}}/events/rsvp",
      accentColor: "#7c3aed"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Event Reminder",
    subject: "Reminder: Community meetup starts tomorrow!",
    category: "Events & Community",
    thumbnail: "/templates/event-reminder.png",
    html: buildEmailHtml({
      title: "See You Tomorrow!",
      content: "<p>This is a quick reminder that our event at <strong>{{eventLocation}}</strong> starts tomorrow. We look forward to seeing you there!</p>",
      ctaText: "View Event Details",
      ctaUrl: "{{websiteUrl}}/events/details",
      accentColor: "#7c3aed"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Webinar Invitation",
    subject: "Webinar: Optimizing SQS and Background Workers",
    category: "Events & Community",
    thumbnail: "/templates/webinar-invite.png",
    html: buildEmailHtml({
      title: "Live Webinar",
      content: "<p>Join our engineering team on <strong>{{eventDate}}</strong> for a live technical webinar on setting up robust background worker processes.</p>",
      ctaText: "Reserve Your Seat",
      ctaUrl: "{{websiteUrl}}/webinars/register",
      accentColor: "#7c3aed"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Webinar Reminder",
    subject: "Starting in 1 hour: Live SQS Webinar",
    category: "Events & Community",
    thumbnail: "/templates/webinar-reminder.png",
    html: buildEmailHtml({
      title: "Starting Soon!",
      content: "<p>Our live webinar starts in exactly one hour. Click the join link below to access the stream window.</p>",
      ctaText: "Join Stream",
      ctaUrl: "{{meetingLink}}",
      accentColor: "#7c3aed"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Thank You For Attending",
    subject: "Thank you for attending our meetup!",
    category: "Events & Community",
    thumbnail: "/templates/thank-you-attending.png",
    html: buildEmailHtml({
      title: "Thank You!",
      content: "<p>We hope you enjoyed the event. The slides and recording link are now available for review.</p>",
      ctaText: "Access Resources",
      ctaUrl: "{{websiteUrl}}/events/resources",
      accentColor: "#7c3aed"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Community Announcement",
    subject: "Important announcement for our community",
    category: "Events & Community",
    thumbnail: "/templates/community-announcement.png",
    html: buildEmailHtml({
      title: "Community News",
      content: "<p>We're introducing new community forums and chat channels to make it easier for our users to connect and collaborate.</p>",
      ctaText: "Join Discord",
      ctaUrl: "{{websiteUrl}}/community/discord",
      accentColor: "#7c3aed"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // G. Business & Professional (Dark Slate: #1e293b)
  {
    name: "Meeting Invitation",
    subject: "Meeting Request: Campaign Strategy",
    category: "Business & Professional",
    thumbnail: "/templates/meeting-invite.png",
    html: buildEmailHtml({
      title: "Let's Connect",
      content: "<p>I would love to schedule a brief meeting to sync on our campaign strategy, integrations, and setup timelines.</p>",
      ctaText: "Book a Slot",
      ctaUrl: "{{meetingLink}}",
      accentColor: "#1e293b"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Partnership Proposal",
    subject: "Partnership Proposal from {{companyName}}",
    category: "Business & Professional",
    thumbnail: "/templates/partnership.png",
    html: buildEmailHtml({
      title: "Collaboration Opportunity",
      content: "<p>Our team has identified potential synergies between our platforms. Let's explore how we can collaborate to deliver more value to our users.</p>",
      ctaText: "Review Proposal",
      ctaUrl: "{{websiteUrl}}/proposals/partnership",
      accentColor: "#1e293b"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Business Proposal",
    subject: "SaaS Enterprise Proposal",
    category: "Business & Professional",
    thumbnail: "/templates/business-proposal.png",
    html: buildEmailHtml({
      title: "Enterprise Solutions",
      content: "<p>Here is our customized enterprise setup proposal matching your scaling and security parameters.</p>",
      ctaText: "View Proposal PDF",
      ctaUrl: "{{websiteUrl}}/proposals/enterprise",
      accentColor: "#1e293b"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Follow-up Email",
    subject: "Following up on our campaign sync",
    category: "Business & Professional",
    thumbnail: "/templates/follow-up.png",
    html: buildEmailHtml({
      title: "Just Checking In",
      content: "<p>Following up on our meeting yesterday. Please let me know if you need any additional files or clarifications.</p>",
      accentColor: "#1e293b"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Customer Appreciation Message",
    subject: "A note of appreciation from {{companyName}}",
    category: "Business & Professional",
    thumbnail: "/templates/appreciation.png",
    html: buildEmailHtml({
      title: "Thank You for Your Trust",
      content: "<p>We wanted to take a moment to express our gratitude for your continued support and trust in our team.</p>",
      accentColor: "#1e293b"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // H. SaaS & Technology (Indigo: #4f46e5)
  {
    name: "Free Trial Welcome",
    subject: "Welcome to your free trial of {{productName}}",
    category: "SaaS & Technology",
    thumbnail: "/templates/trial-welcome.png",
    html: buildEmailHtml({
      title: "Start Your Free Trial!",
      content: "<p>Your 14-day free trial of {{productName}} is active. Take advantage of all premium features during this period.</p>",
      ctaText: "Launch Workspace",
      ctaUrl: "{{websiteUrl}}/dashboard",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Trial Ending Reminder",
    subject: "Your {{productName}} trial is ending soon",
    category: "SaaS & Technology",
    thumbnail: "/templates/trial-ending.png",
    html: buildEmailHtml({
      title: "Upgrade to Keep Access",
      content: "<p>Your free trial of {{productName}} expires in 3 days. Upgrade your account today to prevent any campaign delivery interruptions.</p>",
      ctaText: "Upgrade Account",
      ctaUrl: "{{websiteUrl}}/upgrade",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Subscription Renewal Reminder",
    subject: "Renewal notice: {{productName}} subscription",
    category: "SaaS & Technology",
    thumbnail: "/templates/renewal-notice.png",
    html: buildEmailHtml({
      title: "Upcoming Subscription Renewal",
      content: "<p>This is a quick notification that your subscription for {{productName}} is scheduled to renew on {{eventDate}}.</p>",
      ctaText: "Manage Billing",
      ctaUrl: "{{websiteUrl}}/settings/billing",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Subscription Expiry Notice",
    subject: "Your {{productName}} subscription has expired",
    category: "SaaS & Technology",
    thumbnail: "/templates/expiry-notice.png",
    html: buildEmailHtml({
      title: "Subscription Expired",
      content: "<p>Your subscription for {{productName}} has ended. Your active campaigns are paused. Reactivate your subscription now to resume.</p>",
      ctaText: "Reactivate Subscription",
      ctaUrl: "{{websiteUrl}}/billing/reactivate",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "New Feature Announcement",
    subject: "New feature: Automated tenant templates",
    category: "SaaS & Technology",
    thumbnail: "/templates/feature-announcement.png",
    html: buildEmailHtml({
      title: "New Integration Live!",
      content: "<p>We've launched the new seeder integration which automatically handles template populates. Try it now in your workspace.</p>",
      ctaText: "Try New Feature",
      ctaUrl: "{{websiteUrl}}/templates",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Service Update",
    subject: "Important service update for {{productName}}",
    category: "SaaS & Technology",
    thumbnail: "/templates/service-update.png",
    html: buildEmailHtml({
      title: "Service Improvement",
      content: "<p>We've optimized our queue processing loops and SQS configurations. These changes have been applied automatically to your environment.</p>",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Scheduled Maintenance Notice",
    subject: "Scheduled maintenance notice: {{productName}}",
    category: "SaaS & Technology",
    thumbnail: "/templates/maintenance.png",
    html: buildEmailHtml({
      title: "Scheduled Maintenance",
      content: "<p>We will be performing scheduled updates on <strong>{{eventDate}}</strong>. The platform will remain online, but you might experience brief latency.</p>",
      accentColor: "#4f46e5"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },

  // I. Customer Success & Retention (Emerald: #059669)
  {
    name: "Customer Feedback Survey",
    subject: "Help us improve: Share your feedback!",
    category: "Customer Success & Retention",
    thumbnail: "/templates/feedback.png",
    html: buildEmailHtml({
      title: "We Value Your Feedback",
      content: "<p>We are dedicated to providing the best experience possible. Please take a few minutes to share your thoughts on the platform.</p>",
      ctaText: "Take Survey",
      ctaUrl: "{{websiteUrl}}/surveys/feedback",
      accentColor: "#059669"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "NPS Survey Request",
    subject: "Quick question: How likely are you to recommend us?",
    category: "Customer Success & Retention",
    thumbnail: "/templates/nps.png",
    html: buildEmailHtml({
      title: "Quick NPS Survey",
      content: "<p>On a scale of 0 to 10, how likely are you to recommend {{companyName}} to a colleague or business partner?</p>",
      ctaText: "Rate Us",
      ctaUrl: "{{websiteUrl}}/surveys/nps",
      accentColor: "#059669"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Re-engagement Campaign",
    subject: "A special discount just for you",
    category: "Customer Success & Retention",
    thumbnail: "/templates/reengagement.png",
    html: buildEmailHtml({
      title: "Exclusive Return Offer!",
      content: "<p>It's been a while since we saw you. We've introduced major dashboard and worker improvements. Try them today with this coupon:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #059669; background:#ecfdf5; border-radius:6px;'><strong style='font-size:24px; color:#059669;'>{{discountCode}}</strong></div>",
      ctaText: "Apply Offer Code",
      ctaUrl: "{{websiteUrl}}/shop",
      accentColor: "#059669"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "We Miss You Email",
    subject: "We miss you at {{companyName}}!",
    category: "Customer Success & Retention",
    thumbnail: "/templates/we-miss-you.png",
    html: buildEmailHtml({
      title: "We Miss You!",
      content: "<p>We noticed your workspace has been inactive. Check out the latest tips to reactivate your campaign queue flows.</p>",
      ctaText: "Reopen Workspace",
      ctaUrl: "{{websiteUrl}}/dashboard",
      accentColor: "#059669"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  },
  {
    name: "Upgrade to Premium Plan",
    subject: "Unlock enterprise power with Premium",
    category: "Customer Success & Retention",
    thumbnail: "/templates/upgrade-premium.png",
    html: buildEmailHtml({
      title: "Upgrade to Premium",
      content: "<p>Get access to advanced rate limits, dedicated SQS dispatch handles, and unlimited multi-tenant templates. Upgrade today.</p>",
      ctaText: "Upgrade Now",
      ctaUrl: "{{websiteUrl}}/pricing/premium",
      accentColor: "#059669"
    }),
    json: JSON.stringify({ version: "1.0", elements: [] }),
    isPublic: false,
    isSystem: false
  }
];
