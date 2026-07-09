import { ColorTheme, RegistryEntry } from "./types"
import {
  SaaSTheme,
  MarketingTheme,
  BusinessTheme,
  HRTheme,
  EducationTheme,
  NewsletterTheme,
  EventsTheme,
  CustomerSuccessTheme
} from "./themes"
import { generateTemplateBlocks } from "./generators"

// Shared helper to build content and structure registry configs
export const TEMPLATE_REGISTRY: RegistryEntry[] = [
  // A. Welcome & Onboarding (SaaS Theme)
  {
    id: "welcome-community-v2",
    name: "Welcome to Our Community",
    subject: "Welcome to {{companyName}}!",
    category: "Welcome & Onboarding",
    theme: SaaSTheme,
    designFamily: "SaaS",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    featured: true,
    difficulty: "premium",
    version: 2,
    content: {
      title: "Design. Deliver. Convert.",
      bodyHtml: "<p>Hello {{firstName}}, Welcome to {{companyName}}! We're thrilled to have you here. Our platform is built to help your team design, automate, and dispatch email campaigns that engage and convert.</p>",
      ctaText: "Explore My Dashboard",
      ctaUrl: "{{websiteUrl}}/dashboard"
    }
  },
  {
    id: "getting-started-v2",
    name: "Getting Started Guide",
    subject: "Your Quick Start Guide for {{productName}}",
    category: "Welcome & Onboarding",
    theme: SaaSTheme,
    designFamily: "SaaS",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Get Started in 3 Steps",
      bodyHtml: "<p>To help you get the most out of {{productName}}, we've created a simple quick-start guide. Follow these steps to set up your profile, import your contacts, and launch your first email campaign.</p><ul><li>Step 1: Complete your organization settings</li><li>Step 2: Upload your first list</li><li>Step 3: Draft and test a campaign</li></ul>",
      ctaText: "View Quick Start Guide",
      ctaUrl: "{{websiteUrl}}/docs/getting-started"
    }
  },
  {
    id: "account-verify-v2",
    name: "Account Verification",
    subject: "Verify your email address for {{companyName}}",
    category: "Welcome & Onboarding",
    theme: SaaSTheme,
    designFamily: "SaaS",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Confirm Your Email",
      bodyHtml: "<p>Please verify your email address to complete your account setup. This ensures that you receive notifications, updates, and secure account alerts.</p>",
      ctaText: "Verify Account",
      ctaUrl: "{{websiteUrl}}/auth/verify?email={{email}}"
    }
  },
  {
    id: "complete-profile-v2",
    name: "Complete Your Profile",
    subject: "Finish setting up {{productName}}",
    category: "Welcome & Onboarding",
    theme: SaaSTheme,
    designFamily: "SaaS",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Complete Your Setup",
      bodyHtml: "<p>You're almost there! Complete your organization profile details now to activate all platform integrations and start sending bulk emails with SES.</p>",
      ctaText: "Complete Profile",
      ctaUrl: "{{websiteUrl}}/settings"
    }
  },
  {
    id: "welcome-offer-v2",
    name: "First Purchase Welcome Offer",
    subject: "Special gift inside: Welcome to {{companyName}}!",
    category: "Welcome & Onboarding",
    theme: SaaSTheme,
    designFamily: "SaaS",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Welcome Special Offer",
      bodyHtml: "<p>To welcome you to our community, we've prepared a special discount for your first transaction. Use the code below at checkout to redeem it.</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #2563eb; background:#eff6ff; border-radius:6px;'><strong style='font-size:24px; color:#2563eb;'>{{discountCode}}</strong></div>",
      ctaText: "Claim Offer",
      ctaUrl: "{{websiteUrl}}/shop"
    }
  },
  {
    id: "thank-you-signup-v2",
    name: "Thank You for Signing Up",
    subject: "Thanks for joining {{companyName}}",
    category: "Welcome & Onboarding",
    theme: SaaSTheme,
    designFamily: "SaaS",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Thank You!",
      bodyHtml: "<p>Thank you for creating an account with {{companyName}}. We're dedicated to providing the best tools and support to help you achieve your goals.</p>",
      ctaText: "Explore Workspace",
      ctaUrl: "{{websiteUrl}}/dashboard"
    }
  },

  // B. Birthday & Personal Occasions (Customer Success Theme)
  {
    id: "birthday-wishes-v2",
    name: "Happy Birthday Wishes",
    subject: "Happy Birthday from {{companyName}}!",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Happy Birthday!",
      bodyHtml: "<p>We wish you a wonderful day filled with joy, celebration, and success. Thank you for being an important member of our community!</p>"
    }
  },
  {
    id: "birthday-discount-v2",
    name: "Birthday Special Discount",
    subject: "A birthday gift for you from {{companyName}} 🎂",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Your Birthday Gift!",
      bodyHtml: "<p>Celebrate your special day with an exclusive discount code. Enter this promo code during checkout to claim your gift:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #059669; background:#ecfdf5; border-radius:6px;'><strong style='font-size:24px; color:#059669;'>{{discountCode}}</strong></div>",
      ctaText: "Redeem Gift",
      ctaUrl: "{{websiteUrl}}/shop"
    }
  },
  {
    id: "anniversary-v2",
    name: "Anniversary Celebration",
    subject: "Happy Anniversary from {{companyName}}!",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Happy Anniversary!",
      bodyHtml: "<p>We're celebrating another milestone with you today. Thank you for your continued trust and partnership with {{companyName}}.</p>"
    }
  },
  {
    id: "membership-anniversary-v2",
    name: "Customer Membership Anniversary",
    subject: "Celebrating your {{companyName}} anniversary!",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Congratulations on {{companyName}} Anniversary!",
      bodyHtml: "<p>It's been a year since you joined {{companyName}}! We wanted to take a moment to thank you for your support and for being a valued part of our platform.</p>",
      ctaText: "Check Rewards",
      ctaUrl: "{{websiteUrl}}/profile/rewards"
    }
  },
  {
    id: "holiday-greeting-v2",
    name: "Holiday Greeting Card",
    subject: "Warmest wishes from {{companyName}}",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Happy Holidays!",
      bodyHtml: "<p>Wishing you and your family a safe, peaceful, and joyful holiday season. Thank you for your support and dedication throughout the year.</p>"
    }
  },
  {
    id: "new-year-v2",
    name: "New Year Wishes",
    subject: "Happy New Year from {{companyName}}! 🎉",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1510673398431-92f96bfa73d2?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Happy New Year!",
      bodyHtml: "<p>Here's to a fresh start, new achievements, and continued growth. Wishing you a successful and prosperous year ahead.</p>"
    }
  },
  {
    id: "christmas-v2",
    name: "Christmas Greetings",
    subject: "Merry Christmas from {{companyName}} 🎄",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Merry Christmas!",
      bodyHtml: "<p>May your heart and home be filled with peace, love, and happiness this holiday season. Warmest wishes from the entire {{companyName}} team.</p>"
    }
  },
  {
    id: "diwali-v2",
    name: "Diwali Wishes",
    subject: "Happy Diwali from {{companyName}}! 🪔",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Happy Diwali!",
      bodyHtml: "<p>May the festival of lights bring prosperity, happiness, and success to your life. Wishing you and your loved ones a brilliant Diwali.</p>"
    }
  },
  {
    id: "eid-v2",
    name: "Eid Mubarak Greeting",
    subject: "Eid Mubarak from {{companyName}}!",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Eid Mubarak!",
      bodyHtml: "<p>Wishing you and your family a peaceful, blessed, and joyous Eid. May this special day bring happiness and success to your home.</p>"
    }
  },
  {
    id: "ramadan-v2",
    name: "Ramadan Greetings",
    subject: "Ramadan Kareem from {{companyName}}",
    category: "Birthday & Personal Occasions",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Ramadan Kareem!",
      bodyHtml: "<p>Wishing you a blessed, holy, and reflective Ramadan. May this month bring peace, health, and harmony to you and your family.</p>"
    }
  },

  // C. Marketing & Promotions (Marketing Theme)
  {
    id: "product-launch-v2",
    name: "New Product Launch",
    subject: "Announcing the launch of {{productName}}!",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Introducing {{productName}}!",
      bodyHtml: "<p>We are thrilled to unveil our latest release. {{productName}} is designed to enhance your workflow, streamline tasks, and deliver faster performance.</p>",
      ctaText: "Discover Features",
      ctaUrl: "{{websiteUrl}}/products/new"
    }
  },
  {
    id: "limited-offer-v2",
    name: "Limited Time Offer",
    subject: "Hurry! Limited time offer from {{companyName}}",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Don't Miss Out!",
      bodyHtml: "<p>This is a limited-time opportunity to access premium features at a special price. Offer ends on {{eventDate}}.</p>",
      ctaText: "Shop Sale Now",
      ctaUrl: "{{websiteUrl}}/pricing"
    }
  },
  {
    id: "flash-sale-v2",
    name: "Flash Sale",
    subject: "Flash Sale: Save big at {{companyName}} today!",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "24-Hour Flash Sale!",
      bodyHtml: "<p>Save on all plans and features during our 24-hour flash sale. Enter coupon code below during purchase:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #ea580c; background:#fff7ed; border-radius:6px;'><strong style='font-size:24px; color:#ea580c;'>{{discountCode}}</strong></div>",
      ctaText: "Shop the Flash Sale",
      ctaUrl: "{{websiteUrl}}/shop"
    }
  },
  {
    id: "seasonal-sale-v2",
    name: "Seasonal Sale",
    subject: "Seasonal Sale: Exclusive discounts at {{companyName}}",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "New Season, New Deals!",
      bodyHtml: "<p>Upgrade your platform workspace and tools for the new season with our exclusive catalog-wide deals.</p>",
      ctaText: "View Collection",
      ctaUrl: "{{websiteUrl}}/catalog"
    }
  },
  {
    id: "black-friday-v2",
    name: "Black Friday Sale",
    subject: "Black Friday Sale: Our biggest deals of the year!",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Black Friday is Live!",
      bodyHtml: "<p>Black Friday has arrived. Take advantage of our most significant discounts of the year on all pricing tiers and setups.</p>",
      ctaText: "Get Black Friday Deals",
      ctaUrl: "{{websiteUrl}}/deals/black-friday"
    }
  },
  {
    id: "cyber-monday-v2",
    name: "Cyber Monday Deal",
    subject: "Cyber Monday Special Deals from {{companyName}}",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Cyber Monday Special",
      bodyHtml: "<p>Skip the crowds and shop our exclusive digital deals online. These offers are valid for today only.</p>",
      ctaText: "Claim Cyber Deal",
      ctaUrl: "{{websiteUrl}}/deals/cyber-monday"
    }
  },
  {
    id: "bogo-v2",
    name: "Buy One Get One Offer",
    subject: "BOGO Special Offer from {{companyName}}",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Buy One, Get One Free!",
      bodyHtml: "<p>Add any plan or tool to your account today and receive an identical package completely free. Offer ends soon.</p>",
      ctaText: "Shop BOGO Offer",
      ctaUrl: "{{websiteUrl}}/shop/bogo"
    }
  },
  {
    id: "coupon-v2",
    name: "Coupon Code Promotion",
    subject: "Your exclusive coupon code from {{companyName}}",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Save on Your Next Purchase",
      bodyHtml: "<p>We appreciate having you with us. Enjoy this special coupon code on your next campaign upgrade:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #ea580c; background:#fff7ed; border-radius:6px;'><strong style='font-size:24px; color:#ea580c;'>{{discountCode}}</strong></div>",
      ctaText: "Apply Coupon",
      ctaUrl: "{{websiteUrl}}/checkout?coupon={{discountCode}}"
    }
  },
  {
    id: "referral-v2",
    name: "Referral Program",
    subject: "Refer a friend, get rewarded by {{companyName}}!",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Share and Earn Rewards",
      bodyHtml: "<p>Invite your friends, colleagues, or clients to {{companyName}}. When they register, both of you will receive platform credits.</p>",
      ctaText: "Get Referral Link",
      ctaUrl: "{{websiteUrl}}/referral"
    }
  },
  {
    id: "recommendations-v2",
    name: "Product Recommendation",
    subject: "Selected just for you by {{companyName}}",
    category: "Marketing & Promotions",
    theme: MarketingTheme,
    designFamily: "Marketing",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Recommended Just For You",
      bodyHtml: "<p>Based on your profile activity and previous setups, our engine has identified products and updates that can save you time.</p>",
      ctaText: "View Recommendations",
      ctaUrl: "{{websiteUrl}}/products/recommendations"
    }
  },

  // D. E-commerce Customer Journey (Education Theme)
  {
    id: "order-confirm-v2",
    name: "Order Confirmation",
    subject: "Order Confirmation: {{orderNumber}}",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Thank You for Your Order!",
      bodyHtml: "<p>We have successfully received your order <strong>{{orderNumber}}</strong>. Our team is processing it now, and we'll send a shipping update as soon as it leaves the warehouse.</p>",
      ctaText: "Track Order Status",
      ctaUrl: "{{websiteUrl}}/orders/{{orderNumber}}"
    }
  },
  {
    id: "payment-confirm-v2",
    name: "Payment Confirmation",
    subject: "Payment Receipt: {{orderNumber}}",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Payment Received",
      bodyHtml: "<p>We have successfully processed your payment for order <strong>{{orderNumber}}</strong>. A PDF copy of your official invoice is now available in your portal profile.</p>",
      ctaText: "View Invoice",
      ctaUrl: "{{websiteUrl}}/profile/invoices"
    }
  },
  {
    id: "shipping-update-v2",
    name: "Shipping Update",
    subject: "Your order {{orderNumber}} has shipped!",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Your Order is on the Way!",
      bodyHtml: "<p>Great news! Your package for order <strong>{{orderNumber}}</strong> has been handed over to the courier. You can trace its journey using the tracking reference link below.</p>",
      ctaText: "Track Package Delivery",
      ctaUrl: "{{websiteUrl}}/shipping/track?id={{orderNumber}}"
    }
  },
  {
    id: "delivery-confirm-v2",
    name: "Delivery Confirmation",
    subject: "Delivered: Order {{orderNumber}}",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Package Delivered",
      bodyHtml: "<p>Our records show that order <strong>{{orderNumber}}</strong> was successfully delivered to your shipping address today. Please let us know if you experience any issues.</p>",
      ctaText: "Confirm Delivery Receipt",
      ctaUrl: "{{websiteUrl}}/orders/confirm?id={{orderNumber}}"
    }
  },
  {
    id: "order-delay-v2",
    name: "Order Delay Apology",
    subject: "Update regarding your order {{orderNumber}}",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "We Apologize for the Delay",
      bodyHtml: "<p>We wanted to let you know that shipment of order <strong>{{orderNumber}}</strong> is delayed due to high volume. We apologize for the inconvenience and are working to ship it as quickly as possible.</p>"
    }
  },
  {
    id: "abandoned-cart-v2",
    name: "Abandoned Cart Reminder",
    subject: "Did you forget something in your cart?",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Items Left in Your Cart",
      bodyHtml: "<p>We noticed you left some items in your cart. We've saved them for you so you can easily complete your purchase.</p>",
      ctaText: "Return to Cart",
      ctaUrl: "{{websiteUrl}}/cart"
    }
  },
  {
    id: "back-in-stock-v2",
    name: "Back in Stock Alert",
    subject: "Good news: {{productName}} is back in stock!",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Back in Stock!",
      bodyHtml: "<p>The item you were watching, <strong>{{productName}}</strong>, is now restocked and ready for shipping. Stock is limited, so grab yours before it runs out.</p>",
      ctaText: "Buy Now",
      ctaUrl: "{{websiteUrl}}/products/{{productName}}"
    }
  },
  {
    id: "price-drop-v2",
    name: "Price Drop Alert",
    subject: "Price drop on {{productName}}!",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Price Decreased!",
      bodyHtml: "<p>Good news! The price of <strong>{{productName}}</strong> has dropped. Save instantly by placing your order today.</p>",
      ctaText: "View New Price",
      ctaUrl: "{{websiteUrl}}/products/{{productName}}"
    }
  },
  {
    id: "review-request-v2",
    name: "Review Request",
    subject: "How do you like your purchase? Tell us!",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Share Your Feedback",
      bodyHtml: "<p>We hope you are enjoying your recent purchase. We would love to hear your thoughts. Your feedback helps us improve and guides other customers.</p>",
      ctaText: "Write a Review",
      ctaUrl: "{{websiteUrl}}/reviews/new?order={{orderNumber}}"
    }
  },
  {
    id: "thank-you-purchase-v2",
    name: "Thank You For Your Purchase",
    subject: "Thank you for your order!",
    category: "E-commerce Customer Journey",
    theme: EducationTheme,
    designFamily: "Education",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Thank You!",
      bodyHtml: "<p>Thank you for choosing {{companyName}} for your recent purchase. We value your business and hope to serve you again soon.</p>",
      ctaText: "Explore More",
      ctaUrl: "{{websiteUrl}}/shop"
    }
  },

  // E. Newsletter & Content (Newsletter Theme)
  {
    id: "weekly-newsletter-v2",
    name: "Weekly Newsletter",
    subject: "Your Weekly Newsletter from {{companyName}}",
    category: "Newsletter & Content",
    theme: NewsletterTheme,
    designFamily: "Newsletter",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Weekly Summary",
      bodyHtml: "<p>Stay informed with this week's collection of articles, updates, and product tips curated to improve your platform productivity.</p>",
      ctaText: "Read All Articles",
      ctaUrl: "{{websiteUrl}}/blog"
    }
  },
  {
    id: "monthly-newsletter-v2",
    name: "Monthly Newsletter",
    subject: "Monthly Newsletter: What's new at {{companyName}}",
    category: "Newsletter & Content",
    theme: NewsletterTheme,
    designFamily: "Newsletter",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Monthly Round-up",
      bodyHtml: "<p>Here is your monthly summary of platform updates, popular case studies, and insights from the team.</p>",
      ctaText: "Read Monthly Digest",
      ctaUrl: "{{websiteUrl}}/newsletter/archive"
    }
  },
  {
    id: "company-updates-v2",
    name: "Company Updates",
    subject: "Latest company news from {{companyName}}",
    category: "Newsletter & Content",
    theme: NewsletterTheme,
    designFamily: "Newsletter",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Company News & Updates",
      bodyHtml: "<p>We're sharing some exciting milestones, team updates, and vision maps for the upcoming quarter with our community.</p>",
      ctaText: "Learn More",
      ctaUrl: "{{websiteUrl}}/about/news"
    }
  },
  {
    id: "blog-announcement-v2",
    name: "Blog Announcement",
    subject: "New blog post: Scaling your email campaigns",
    category: "Newsletter & Content",
    theme: NewsletterTheme,
    designFamily: "Newsletter",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "New on the Blog",
      bodyHtml: "<p>Read our latest post to learn advanced techniques for managing email lists, setting up triggers, and optimizing inbox deliverability.</p>",
      ctaText: "Read Blog Post",
      ctaUrl: "{{websiteUrl}}/blog/post"
    }
  },
  {
    id: "industry-insights-v2",
    name: "Industry Insights",
    subject: "Key email SaaS trends this month",
    category: "Newsletter & Content",
    theme: NewsletterTheme,
    designFamily: "Newsletter",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Industry Reports",
      bodyHtml: "<p>Our experts have gathered the latest industry metrics and benchmarks. Compare your deliverability rates and trends today.</p>",
      ctaText: "Download Report",
      ctaUrl: "{{websiteUrl}}/resources/insights"
    }
  },
  {
    id: "tips-tricks-v2",
    name: "Tips & Tricks Newsletter",
    subject: "Tips & tricks to scale {{productName}} usage",
    category: "Newsletter & Content",
    theme: NewsletterTheme,
    designFamily: "Newsletter",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Power User Tips",
      bodyHtml: "<p>Unlock hidden shortcuts and features in your account. These quick tips will save you hours on your next setup.</p>",
      ctaText: "View Tips",
      ctaUrl: "{{websiteUrl}}/docs/tips"
    }
  },

  // F. Events & Community (Events Theme)
  {
    id: "event-invite-v2",
    name: "Event Invitation",
    subject: "Join us for our upcoming community meetup!",
    category: "Events & Community",
    theme: EventsTheme,
    designFamily: "Events",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "You're Invited!",
      bodyHtml: "<p>We are hosting a community meetup on <strong>{{eventDate}}</strong> at <strong>{{eventLocation}}</strong>. Connect with fellow users, share your setups, and meet the founders.</p>",
      ctaText: "Register for Event",
      ctaUrl: "{{websiteUrl}}/events/rsvp"
    }
  },
  {
    id: "event-reminder-v2",
    name: "Event Reminder",
    subject: "Reminder: Community meetup starts tomorrow!",
    category: "Events & Community",
    theme: EventsTheme,
    designFamily: "Events",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "See You Tomorrow!",
      bodyHtml: "<p>This is a quick reminder that our event at <strong>{{eventLocation}}</strong> starts tomorrow. We look forward to seeing you there!</p>",
      ctaText: "View Event Details",
      ctaUrl: "{{websiteUrl}}/events/details"
    }
  },
  {
    id: "webinar-invite-v2",
    name: "Webinar Invitation",
    subject: "Webinar: Optimizing SQS and Background Workers",
    category: "Events & Community",
    theme: EventsTheme,
    designFamily: "Events",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "Live Webinar",
      bodyHtml: "<p>Join our engineering team on <strong>{{eventDate}}</strong> for a live technical webinar on setting up robust background worker processes.</p>",
      ctaText: "Reserve Your Seat",
      ctaUrl: "{{websiteUrl}}/webinars/register"
    }
  },
  {
    id: "webinar-reminder-v2",
    name: "Webinar Reminder",
    subject: "Starting in 1 hour: Live SQS Webinar",
    category: "Events & Community",
    theme: EventsTheme,
    designFamily: "Events",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Starting Soon!",
      bodyHtml: "<p>Our live webinar starts in exactly one hour. Click the join link below to access the stream window.</p>",
      ctaText: "Join Stream",
      ctaUrl: "{{meetingLink}}"
    }
  },
  {
    id: "thank-you-attending-v2",
    name: "Thank You For Attending",
    subject: "Thank you for attending our meetup!",
    category: "Events & Community",
    theme: EventsTheme,
    designFamily: "Events",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Thank You!",
      bodyHtml: "<p>We hope you enjoyed the event. The slides and recording link are now available for review.</p>",
      ctaText: "Access Resources",
      ctaUrl: "{{websiteUrl}}/events/resources"
    }
  },
  {
    id: "community-announcement-v2",
    name: "Community Announcement",
    subject: "Important announcement for our community",
    category: "Events & Community",
    theme: EventsTheme,
    designFamily: "Events",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Community News",
      bodyHtml: "<p>We're introducing new community forums and chat channels to make it easier for our users to connect and collaborate.</p>",
      ctaText: "Join Discord",
      ctaUrl: "{{websiteUrl}}/community/discord"
    }
  },

  // G. Business & Professional (Business Theme)
  {
    id: "meeting-invite-v2",
    name: "Meeting Invitation",
    subject: "Meeting Request: Campaign Strategy",
    category: "Business & Professional",
    theme: BusinessTheme,
    designFamily: "Business",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Let's Connect",
      bodyHtml: "<p>I would love to schedule a brief meeting to sync on our campaign strategy, integrations, and setup timelines.</p>",
      ctaText: "Book a Slot",
      ctaUrl: "{{meetingLink}}"
    }
  },
  {
    id: "partnership-v2",
    name: "Partnership Proposal",
    subject: "Partnership Proposal from {{companyName}}",
    category: "Business & Professional",
    theme: BusinessTheme,
    designFamily: "Business",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Collaboration Opportunity",
      bodyHtml: "<p>Our team has identified potential synergies between our platforms. Let's explore how we can collaborate to deliver more value to our users.</p>",
      ctaText: "Review Proposal",
      ctaUrl: "{{websiteUrl}}/proposals/partnership"
    }
  },
  {
    id: "business-proposal-v2",
    name: "Business Proposal",
    subject: "SaaS Enterprise Proposal",
    category: "Business & Professional",
    theme: BusinessTheme,
    designFamily: "Business",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Enterprise Solutions",
      bodyHtml: "<p>Here is our customized enterprise setup proposal matching your scaling and security parameters.</p>",
      ctaText: "View Proposal PDF",
      ctaUrl: "{{websiteUrl}}/proposals/enterprise"
    }
  },
  {
    id: "follow-up-v2",
    name: "Follow-up Email",
    subject: "Following up on our campaign sync",
    category: "Business & Professional",
    theme: BusinessTheme,
    designFamily: "Business",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Just Checking In",
      bodyHtml: "<p>Following up on our meeting yesterday. Please let me know if you need any additional files or clarifications.</p>"
    }
  },
  {
    id: "appreciation-v2",
    name: "Customer Appreciation Message",
    subject: "A note of appreciation from {{companyName}}",
    category: "Business & Professional",
    theme: BusinessTheme,
    designFamily: "Business",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Thank You for Your Trust",
      bodyHtml: "<p>We wanted to take a moment to express our gratitude for your continued support and trust in our team.</p>"
    }
  },

  // H. SaaS & Technology (HR Theme)
  {
    id: "trial-welcome-v2",
    name: "Free Trial Welcome",
    subject: "Welcome to your free trial of {{productName}}",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Start Your Free Trial!",
      bodyHtml: "<p>Your 14-day free trial of {{productName}} is active. Take advantage of all premium features during this period.</p>",
      ctaText: "Launch Workspace",
      ctaUrl: "{{websiteUrl}}/dashboard"
    }
  },
  {
    id: "trial-ending-v2",
    name: "Trial Ending Reminder",
    subject: "Your {{productName}} trial is ending soon",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Upgrade to Keep Access",
      bodyHtml: "<p>Your free trial of {{productName}} expires in 3 days. Upgrade your account today to prevent any campaign delivery interruptions.</p>",
      ctaText: "Upgrade Account",
      ctaUrl: "{{websiteUrl}}/upgrade"
    }
  },
  {
    id: "renewal-notice-v2",
    name: "Subscription Renewal Reminder",
    subject: "Renewal notice: {{productName}} subscription",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Upcoming Subscription Renewal",
      bodyHtml: "<p>This is a quick notification that your subscription for {{productName}} is scheduled to renew on {{eventDate}}.</p>",
      ctaText: "Manage Billing",
      ctaUrl: "{{websiteUrl}}/settings/billing"
    }
  },
  {
    id: "expiry-notice-v2",
    name: "Subscription Expiry Notice",
    subject: "Your {{productName}} subscription has expired",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Subscription Expired",
      bodyHtml: "<p>Your subscription for {{productName}} has ended. Your active campaigns are paused. Reactivate your subscription now to resume.</p>",
      ctaText: "Reactivate Subscription",
      ctaUrl: "{{websiteUrl}}/billing/reactivate"
    }
  },
  {
    id: "feature-announcement-v2",
    name: "New Feature Announcement",
    subject: "New feature: Automated tenant templates",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: true,
    defaultHeroImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
    version: 2,
    content: {
      title: "New Integration Live!",
      bodyHtml: "<p>We've launched the new seeder integration which automatically handles template populates. Try it now in your workspace.</p>",
      ctaText: "Try New Feature",
      ctaUrl: "{{websiteUrl}}/templates"
    }
  },
  {
    id: "service-update-v2",
    name: "Service Update",
    subject: "Important service update for {{productName}}",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Service Improvement",
      bodyHtml: "<p>We've optimized our queue processing loops and SQS configurations. These changes have been applied automatically to your environment.</p>"
    }
  },
  {
    id: "maintenance-v2",
    name: "Scheduled Maintenance Notice",
    subject: "Scheduled maintenance notice: {{productName}}",
    category: "SaaS & Technology",
    theme: HRTheme,
    designFamily: "HR",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Scheduled Maintenance",
      bodyHtml: "<p>We will be performing scheduled updates on <strong>{{eventDate}}</strong>. The platform will remain online, but you might experience brief latency.</p>"
    }
  },

  // I. Customer Success & Retention (Customer Success Theme)
  {
    id: "feedback-v2",
    name: "Customer Feedback Survey",
    subject: "Help us improve: Share your feedback!",
    category: "Customer Success & Retention",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "We Value Your Feedback",
      bodyHtml: "<p>We are dedicated to providing the best experience possible. Please take a few minutes to share your thoughts on the platform.</p>",
      ctaText: "Take Survey",
      ctaUrl: "{{websiteUrl}}/surveys/feedback"
    }
  },
  {
    id: "nps-v2",
    name: "NPS Survey Request",
    subject: "Quick question: How likely are you to recommend us?",
    category: "Customer Success & Retention",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Quick NPS Survey",
      bodyHtml: "<p>On a scale of 0 to 10, how likely are you to recommend {{companyName}} to a colleague or business partner?</p>",
      ctaText: "Rate Us",
      ctaUrl: "{{websiteUrl}}/surveys/nps"
    }
  },
  {
    id: "reengagement-v2",
    name: "Re-engagement Campaign",
    subject: "A special discount just for you",
    category: "Customer Success & Retention",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Exclusive Return Offer!",
      bodyHtml: "<p>It's been a while since we saw you. We've introduced major dashboard and worker improvements. Try them today with this coupon:</p><div style='text-align:center; padding:15px; margin:20px 0; border:2px dashed #059669; background:#ecfdf5; border-radius:6px;'><strong style='font-size:24px; color:#059669;'>{{discountCode}}</strong></div>",
      ctaText: "Apply Offer Code",
      ctaUrl: "{{websiteUrl}}/shop"
    }
  },
  {
    id: "we-miss-you-v2",
    name: "We Miss You Email",
    subject: "We miss you at {{companyName}}!",
    category: "Customer Success & Retention",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "We Miss You!",
      bodyHtml: "<p>We noticed your workspace has been inactive. Check out the latest tips to reactivate your campaign queue flows.</p>",
      ctaText: "Reopen Workspace",
      ctaUrl: "{{websiteUrl}}/dashboard"
    }
  },
  {
    id: "upgrade-premium-v2",
    name: "Upgrade to Premium Plan",
    subject: "Unlock enterprise power with Premium",
    category: "Customer Success & Retention",
    theme: CustomerSuccessTheme,
    designFamily: "CustomerSuccess",
    supportsHeroImage: false,
    version: 2,
    content: {
      title: "Upgrade to Premium",
      bodyHtml: "<p>Get access to advanced rate limits, dedicated SQS dispatch handles, and unlimited multi-tenant templates. Upgrade today.</p>",
      ctaText: "Upgrade Now",
      ctaUrl: "{{websiteUrl}}/pricing/premium"
    }
  }
]
