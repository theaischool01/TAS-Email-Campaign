import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

export function generateHtmlFromBlocks(blocks: any[]): string {
  let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">`

  for (const block of blocks) {
    const styles = Object.entries(block.styles || {})
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')

    switch (block.type) {
      case 'header':
        html += `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center; ${styles}">
                <h1 style="margin: 0; font-size: 24px;">${block.content.text}</h1>
              </td>
            </tr>
          </table>
        `
        break
      case 'text':
        html += `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; ${styles}">
                <p style="margin: 0; white-space: pre-wrap;">${block.content.text}</p>
              </td>
            </tr>
          </table>
        `
        break
      case 'button':
        html += `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <a href="${block.content.url || '#'}" style="background-color: ${block.content.backgroundColor || '#007bff'}; color: ${block.content.color || '#ffffff'}; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; ${styles}">
                  ${block.content.text}
                </a>
              </td>
            </tr>
          </table>
        `
        break
      case 'image':
        html += `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <img src="${block.content.src || 'https://via.placeholder.com/600x300'}" alt="${block.content.alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px; ${styles}" />
              </td>
            </tr>
          </table>
        `
        break
      case 'divider':
        html += `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <hr style="border: none; border-top: 1px solid #e5e7eb; width: 100%; ${styles}" />
              </td>
            </tr>
          </table>
        `
        break
      case 'spacer':
        html += `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="height: ${block.content.height || '20px'}; line-height: ${block.content.height || '20px'}; font-size: ${block.content.height || '20px'}; ${styles}">&nbsp;</td>
            </tr>
          </table>
        `
        break
      case 'html':
        html += `
          <div style="width: 100%; overflow: auto; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; ${styles}">
            ${block.content.html || ''}
          </div>
        `
        break
    }
  }

  html += `</div>`
  return html
}

const defaultTemplates = [
  // ──────────────────────────────────────────────────────────────────────────
  // ORIGINAL 7 TEMPLATES
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Welcome Email",
    subject: "Welcome to Our Platform! Here is how to get started",
    description: "A warm greeting email welcoming new subscribers or users to your community.",
    category: "Onboarding",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Welcome aboard!" }, styles: { color: "#2563eb" } },
      { id: "t-1", type: "text", content: { text: "We're thrilled to have you here.\n\nThanks for signing up! To help you get the most out of our platform, we've compiled a few steps to help you get started:\n\n• Complete your user profile details\n• Import your first contact list segment\n• Launch your inaugural email campaign" }, styles: { color: "#4b5563" } },
      { id: "b-1", type: "button", content: { text: "Get Started Now", url: "#", backgroundColor: "#2563eb", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Your Company. All rights reserved. · Unsubscribe" }, styles: { color: "#9ca3af", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Promotional Offer",
    subject: "Exclusive Deal: Save 20% on all plans this week!",
    description: "A sales template designed to showcase an exclusive offer with a clear call to action.",
    category: "Promotional",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Special Offer!" }, styles: { color: "#2563eb" } },
      { id: "t-1", type: "text", content: { text: "Don't miss out on our latest deals!\n\nWe are excited to offer you an exclusive discount. Use code SAVE20 at checkout to claim your offer and start saving today." }, styles: { color: "#4b5563" } },
      { id: "b-1", type: "button", content: { text: "Claim Your Discount", url: "#", backgroundColor: "#2563eb", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Your Company. All rights reserved. · Unsubscribe" }, styles: { color: "#9ca3af", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Monthly Newsletter",
    subject: "June Update: New features, top stories, and upcoming events",
    description: "A structured newsletter layout featuring company updates and featured articles.",
    category: "Newsletter",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Monthly Newsletter" }, styles: { color: "#111827" } },
      { id: "t-1", type: "text", content: { text: "Latest Update\n\nWelcome to our latest newsletter. Here are the top stories and updates from our team this month.\n\nFeatured Story\nLearn about our newest feature release that will help you work faster and more efficiently than ever before." }, styles: { color: "#4b5563" } },
      { id: "b-1", type: "button", content: { text: "Read More →", url: "#", backgroundColor: "#10b981", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "You received this email because you are subscribed to our newsletter. · Unsubscribe" }, styles: { color: "#6b7280", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Flash Sale",
    subject: "Hurry! 24-Hour Flash Sale Starts Now",
    description: "A high-urgency promotional template for limited-time discounts.",
    category: "Promotional",
    blocks: [
      { id: "h-1", type: "header", content: { text: "24-HOUR FLASH SALE" }, styles: { color: "#ef4444" } },
      { id: "t-1", type: "text", content: { text: "Up to 50% OFF Storewide!\n\nThis offer is valid for 24 hours only. No extensions, no exceptions. Grab your favorite items before they sell out!" }, styles: { color: "#4b5563", textAlign: "center" } },
      { id: "b-1", type: "button", content: { text: "Shop the Sale Now", url: "#", backgroundColor: "#ef4444", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Your Company. All rights reserved. · Unsubscribe" }, styles: { color: "#9ca3af", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "New Product Launch",
    subject: "Introducing Our Brand New Dashboard - Try it today!",
    description: "Announce new products, features, or updates to your user base.",
    category: "Launch",
    blocks: [
      { id: "h-1", type: "header", content: { text: "It's Finally Here!" }, styles: { color: "#3b82f6" } },
      { id: "t-1", type: "text", content: { text: "Introducing the Next-Gen Analytics Dashboard\n\nExperience Analytics Like Never Before\n\nWe have completely redesigned our platform analytics page to give you real-time insights, customizable widgets, and faster load times." }, styles: { color: "#4b5563" } },
      { id: "b-1", type: "button", content: { text: "Try the New Dashboard", url: "#", backgroundColor: "#3b82f6", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Your Company. All rights reserved. · Unsubscribe" }, styles: { color: "#9ca3af", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Event Invitation",
    subject: "Join Us Live: Live Webinar on Email Marketing Best Practices",
    description: "Invite your audience to a webinar, conference, or community event.",
    category: "Event",
    blocks: [
      { id: "h-1", type: "header", content: { text: "You're Invited!" }, styles: { color: "#8b5cf6" } },
      { id: "t-1", type: "text", content: { text: "Event Details\nDate: October 25, 2026\nTime: 10:00 AM EST\nLocation: Virtual via Zoom\n\nWe have prepared an exciting webinar with industry experts. Space is limited, so please reserve your spot today." }, styles: { color: "#4b5563" } },
      { id: "b-1", type: "button", content: { text: "RSVP Now", url: "#", backgroundColor: "#8b5cf6", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Your Company. All rights reserved. · Unsubscribe" }, styles: { color: "#9ca3af", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Plain HTML",
    subject: "Quick Update from Our Team",
    description: "A clean, simple layout for minimal plain-text style emails.",
    category: "General",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Quick Update" }, styles: { color: "#111827" } },
      { id: "t-1", type: "text", content: { text: "Hello there,\n\nJust sending a quick plain text styled update. Sometimes simple is better when communicating important announcements or letters from our founders.\n\nNo fancy borders, no distraction. Just clear text. Let us know what you think by replying to this message directly.\n\nBest regards,\nThe Platform Team" }, styles: { color: "#111827" } },
      { id: "t-2", type: "text", content: { text: "You received this update because you are registered on our platform. · Unsubscribe" }, styles: { color: "#9ca3af", fontSize: "12px" } }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: Startup / Business
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Product Launch Announcement",
    subject: "Introducing Nexus Pro — The Future of Productivity",
    description: "Announce a new product to your audience with excitement and a clear value proposition.",
    category: "Startup / Business",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Introducing Nexus Pro" }, styles: { color: "#4299E1" } },
      { id: "t-1", type: "text", content: { text: "Hi there,\n\nAfter 18 months of building, testing, and refining — we are incredibly proud to announce the launch of Nexus Pro. It brings together project management, team chat, and real-time analytics in one seamless platform.\n\nEarly access members get 40% off for their first 6 months. Offer expires October 31." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Claim Early Access →", url: "#", backgroundColor: "#4299E1", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus Inc. · 123 Startup Ave, San Francisco, CA · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Investor Update",
    subject: "Q3 2026 Investor Update — Strong Growth Continues",
    description: "Share quarterly business metrics and milestones with your investors.",
    category: "Startup / Business",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Q3 2026 — Business Update" }, styles: { color: "#4299E1" } },
      { id: "t-1", type: "text", content: { text: "Dear Investors and Advisors,\n\nWe are pleased to share our Q3 performance highlights. This quarter marked our strongest growth period since launch, driven by product adoption.\n\nKey Metrics:\n• MRR Growth: +47%\n• Active Users Growth: +81%\n• Enterprise Clients: +141%\n\nOur Q4 focus will be international expansion and Series A fundraise." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Join Investor Call", url: "#", backgroundColor: "#4299E1", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus Inc. · Confidential Investor Communication · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Partnership Proposal",
    subject: "Exciting Partnership Opportunity — Let's Grow Together",
    description: "Reach out to potential business partners with a professional proposal.",
    category: "Startup / Business",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Let's Build Something Together" }, styles: { color: "#4299E1" } },
      { id: "t-1", type: "text", content: { text: "Dear [Partner Name],\n\nWe have been following [Partner Company]'s growth and believe there is a compelling opportunity to collaborate. A strategic integration could deliver significant mutual value.\n\nWhat we bring to the table:\n• Access to 85,000+ active business users\n• Co-marketing budget for joint campaigns\n• Dedicated integration support team" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Schedule a Call", url: "#", backgroundColor: "#4299E1", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus Inc. · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Company Milestone Celebration",
    subject: "We Just Hit 100,000 Users — Thank You! 🎉",
    description: "Celebrate a company milestone with your audience and express gratitude.",
    category: "Startup / Business",
    blocks: [
      { id: "h-1", type: "header", content: { text: "100,000 Users!" }, styles: { color: "#4299E1" } },
      { id: "t-1", type: "text", content: { text: "We could not have done it without you!\n\nWhen we launched, we had a simple dream: build a tool that makes work feel less like work. Today, 100,000 people have placed their trust in us.\n\nAs a thank you, use code MILESTONE100 for 3 Months FREE on any plan." }, styles: { color: "#4A5568", textAlign: "center" } },
      { id: "b-1", type: "button", content: { text: "Claim Your Gift", url: "#", backgroundColor: "#4299E1", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus Inc. · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: Tech / SaaS
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "New Feature Announcement",
    subject: "Just Shipped: AI-Powered Smart Replies are here 🤖",
    description: "Notify users about a significant new feature added to your product.",
    category: "Tech / SaaS",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Smart Replies are Now Live" }, styles: { color: "#805AD5" } },
      { id: "t-1", type: "text", content: { text: "We have shipped one of our most-requested features. Smart Replies analyzes your conversation context and suggests the three most relevant responses in real time — so you can respond faster without sacrificing quality." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Try Smart Replies Now", url: "#", backgroundColor: "#805AD5", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 SaaS Corp · Unsubscribe" }, styles: { color: "#4A5568", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Scheduled Maintenance Notice",
    subject: "Scheduled Maintenance: November 12, 2:00–4:00 AM UTC",
    description: "Inform users about planned downtime with clear timing and impact details.",
    category: "Tech / SaaS",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Scheduled System Maintenance" }, styles: { color: "#805AD5" } },
      { id: "t-1", type: "text", content: { text: "Maintenance Window: Nov 12 · 2:00 AM – 4:00 AM UTC\n\nDuring this window, we will be upgrading our database infrastructure to improve performance and reliability. Engineering has planned this to minimize disruption." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "View Status Page", url: "#", backgroundColor: "#805AD5", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 SaaS Corp · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "API Integration Guide",
    subject: "Your API Keys are Ready — Here's How to Get Started",
    description: "Guide developers through API setup with clear instructions and documentation links.",
    category: "Tech / SaaS",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Your API Is Ready 🔌" }, styles: { color: "#805AD5" } },
      { id: "t-1", type: "text", content: { text: "Your credentials have been generated. Keep your keys safe.\n\nQuick Start:\n1. Install SDK: npm install @nexus/sdk\n2. Initialize with your API key\n3. Call API: nexus.contacts.list()" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "View Full API Docs", url: "#", backgroundColor: "#805AD5", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 SaaS Corp · Unsubscribe" }, styles: { color: "#4A5568", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Free Trial Expiring Soon",
    subject: "Your free trial ends in 3 days — upgrade to keep access",
    description: "Remind users their trial is ending and prompt them to convert to a paid plan.",
    category: "Tech / SaaS",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Your Trial Ends in 3 Days" }, styles: { color: "#805AD5" } },
      { id: "t-1", type: "text", content: { text: "Hi there,\n\nYou have been exploring Nexus Pro for the past 11 days and we hope you have found it valuable. Your trial expires soon.\n\nUpgrade now and get 20% off your first 3 months to maintain advanced analytics and automated flows." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Upgrade My Account", url: "#", backgroundColor: "#805AD5", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 SaaS Corp · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: EdTech / Courses
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Course Enrollment Confirmation",
    subject: "You're Enrolled! Your journey begins now 🎓",
    description: "Confirm a student's enrollment and provide next steps to begin their course.",
    category: "EdTech / Courses",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Enrollment Confirmed!" }, styles: { color: "#38A169" } },
      { id: "t-1", type: "text", content: { text: "Congratulations! You are officially enrolled.\n\nCourse: Full-Stack Web Development Bootcamp\nStart Date: November 18, 2026\nInstructor: Dr. Sarah Mitchell\n\nPlease complete profile setup and join Slack before day 1." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Access Your Course", url: "#", backgroundColor: "#38A169", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 LearnPath Academy · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Class Reminder",
    subject: "Reminder: Your class starts in 1 hour — Don't be late!",
    description: "Send a timely reminder to students before their upcoming class session.",
    category: "EdTech / Courses",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Class Starts in 1 Hour" }, styles: { color: "#38A169" } },
      { id: "t-1", type: "text", content: { text: "Topic: Introduction to Node.js and REST APIs\n\nPreparation checklist:\n• Complete pre-reading (REST Architecture Principles)\n• Install Node.js v18+\n• Review Express.js routing exercise" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Join Class Room", url: "#", backgroundColor: "#38A169", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 LearnPath Academy · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Certificate of Completion",
    subject: "🏆 Congratulations! Your certificate is ready to download",
    description: "Deliver a course completion certificate and encourage learners to share their achievement.",
    category: "EdTech / Courses",
    blocks: [
      { id: "h-1", type: "header", content: { text: "You Did It!" }, styles: { color: "#38A169" } },
      { id: "t-1", type: "text", content: { text: "Congratulations! You have successfully completed:\n\nFull-Stack Web Development Bootcamp\n\nYou have demonstrated proficiency in frontend and backend. Your certificate is ready." }, styles: { color: "#4A5568", textAlign: "center" } },
      { id: "b-1", type: "button", content: { text: "Download Certificate", url: "#", backgroundColor: "#38A169", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 LearnPath Academy · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "New Course Available",
    subject: "New Course Alert: Machine Learning for Beginners is now live!",
    description: "Announce a new course addition to your educational catalog.",
    category: "EdTech / Courses",
    blocks: [
      { id: "h-1", type: "header", content: { text: "New Course Alert!" }, styles: { color: "#38A169" } },
      { id: "t-1", type: "text", content: { text: "Machine Learning for Beginners\n\nLearn the fundamentals of regression, classification, and clustering with zero math prerequisites. Build real prediction models using python." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Explore Curriculum", url: "#", backgroundColor: "#38A169", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 LearnPath Academy · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Assignment Deadline Reminder",
    subject: "Action Required: Assignment [Name] is due in 24 hours",
    description: "Urge students to submit their course assignment before the deadline.",
    category: "EdTech / Courses",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Assignment Due Tomorrow" }, styles: { color: "#38A169" } },
      { id: "t-1", type: "text", content: { text: "Deadline: tomorrow at 11:59 PM\n\nPlease submit your PostgreSQL schema design assignment. Late submissions will receive a automatic grade penalty." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Submit Assignment", url: "#", backgroundColor: "#38A169", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 LearnPath Academy · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: Service Providing
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Service Proposal",
    subject: "Proposal: Customized Marketing Strategy for [Client Company]",
    description: "Present custom service pricing and scope of work proposals.",
    category: "Service Providing",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Custom Service Proposal" }, styles: { color: "#DD6B20" } },
      { id: "t-1", type: "text", content: { text: "Dear Client,\n\nWe have prepared a marketing proposal based on your needs. Our strategy targets a 3x lead growth through localized SEO and social campaign optimization." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Review Proposal Details", url: "#", backgroundColor: "#DD6B20", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Agency Group · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Project Kickoff",
    subject: "Welcome! Let's kick off your project next week",
    description: "Coordinate dates, objectives, and agendas for onboarding new clients.",
    category: "Service Providing",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Project Kickoff Agenda" }, styles: { color: "#DD6B20" } },
      { id: "t-1", type: "text", content: { text: "Hi there,\n\nWelcome! We are excited to begin. Let's schedule our project kickoff session for next week. Key agenda items:\n\n• Team introductions\n• Milestones and deliverables review\n• Client feedback channels" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Book Kickoff Slot", url: "#", backgroundColor: "#DD6B20", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Agency Group · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Monthly Progress Report",
    subject: "November Project Progress & Performance Report",
    description: "Provide updates, deliverables, and performance metrics to customers.",
    category: "Service Providing",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Monthly Progress Report" }, styles: { color: "#DD6B20" } },
      { id: "t-1", type: "text", content: { text: "Hello,\n\nHere is your monthly progress report. Major highlights:\n\n• Deliverables: Completed 5 mockups\n• Leads: Up by 12%\n• SEO ranking: Top 5 for primary keywords" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "View Full Report", url: "#", backgroundColor: "#DD6B20", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Agency Group · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Support Ticket Resolved",
    subject: "Ticket #[ID] Resolved: Let us know how we did",
    description: "Confirm issue resolution and request feedback on support quality.",
    category: "Service Providing",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Support Ticket Resolved" }, styles: { color: "#DD6B20" } },
      { id: "t-1", type: "text", content: { text: "Hi,\n\nYour support request #[ID] regarding API payload issues is resolved. Please let us know if everything is working fine now." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Rate Our Support", url: "#", backgroundColor: "#DD6B20", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Agency Group · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: Marketing / Engagement
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Webinar Invitation",
    subject: "Live Webinar: Growing Your Revenue with Email Marketing",
    description: "Drive webinar registrations with key highlights and speaker profiles.",
    category: "Marketing / Engagement",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Live Webinar Invitation" }, styles: { color: "#E53E3E" } },
      { id: "t-1", type: "text", content: { text: "Date: Nov 30 | Time: 2:00 PM EST\n\nJoin our experts as we cover target segment optimization, deliverability strategies, and automation hacks to boost revenue." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Save My Spot", url: "#", backgroundColor: "#E53E3E", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Marketing Team · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Referral Program",
    subject: "Give $20, Get $20: Invite your friends to Nexus",
    description: "Promote referral bonuses to encourage word-of-mouth user growth.",
    category: "Marketing / Engagement",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Refer a Friend" }, styles: { color: "#E53E3E" } },
      { id: "t-1", type: "text", content: { text: "Share the love!\n\nInvite your friends to try Nexus. They will get a $20 credit, and you will receive $20 once they upgrade to any paid tier." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Get Referral Link", url: "#", backgroundColor: "#E53E3E", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Marketing Team · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Re-engagement (We Miss You)",
    subject: "We miss you, [First Name] — Here's what you've been missing",
    description: "Win back inactive subscribers with a personalized re-engagement offer.",
    category: "Marketing / Engagement",
    blocks: [
      { id: "h-1", type: "header", content: { text: "We Miss You!" }, styles: { color: "#E53E3E" } },
      { id: "t-1", type: "text", content: { text: "It has been 60 days since you last visited. We have launched smart automated sequences and AI subject line optimization to help you scale.\n\nTake 30% off any plan code: MISSYOU30" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Come Back & Explore", url: "#", backgroundColor: "#E53E3E", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Marketing Team · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Black Friday Sale Offer",
    subject: "🖤 Black Friday: Our Biggest Sale Ever — 60% Off Ends Tonight",
    description: "Drive maximum Black Friday conversions with urgency, bold discounts, and a clear CTA.",
    category: "Marketing / Engagement",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Black Friday — 60% OFF" }, styles: { color: "#E53E3E" } },
      { id: "t-1", type: "text", content: { text: "Our biggest sale ever is ending tonight. Upgrade now and get 60% off any yearly plan. No extensions." }, styles: { color: "#4A5568", textAlign: "center" } },
      { id: "b-1", type: "button", content: { text: "Claim 60% Discount", url: "#", backgroundColor: "#E53E3E", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Marketing Team · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: Hiring / HR
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Job Application Received",
    subject: "We've received your application for [Job Title] at Nexus",
    description: "Acknowledge job applications and outline next steps in the hiring process.",
    category: "Hiring / HR",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Application Received" }, styles: { color: "#2B6CB0" } },
      { id: "t-1", type: "text", content: { text: "Thank you for applying to Nexus.\n\nOur team is reviewing your application. If there is a fit, we will contact you within 5 business days for a initial screening call." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "View Hiring Process", url: "#", backgroundColor: "#2B6CB0", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus HR · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Interview Invitation",
    subject: "Invitation to Interview: [Job Title] at Nexus",
    description: "Send calendar links to invite candidates for interview sessions.",
    category: "Hiring / HR",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Interview Invitation" }, styles: { color: "#2B6CB0" } },
      { id: "t-1", type: "text", content: { text: "We were impressed by your background and would like to schedule a 30-minute video interview to discuss the role further." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Book Interview Slot", url: "#", backgroundColor: "#2B6CB0", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus HR · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Offer Letter",
    subject: "Job Offer: Welcome to the Nexus Team! 🎉",
    description: "Send official job offer packages to prospective hires.",
    category: "Hiring / HR",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Offer of Employment" }, styles: { color: "#2B6CB0" } },
      { id: "t-1", type: "text", content: { text: "We are thrilled to offer you employment at Nexus. We believe your experience will be a great addition to our engineering team.\n\nPosition: Senior Frontend Engineer\nStart Date: Jan 6, 2027" }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "Review & Sign Offer", url: "#", backgroundColor: "#2B6CB0", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus HR · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  },
  {
    name: "Rejection Email (Professional and Kind)",
    subject: "Your application for [Job Title] at Nexus Inc.",
    description: "Send a professional, kind rejection that leaves candidates with a positive impression of your brand.",
    category: "Hiring / HR",
    blocks: [
      { id: "h-1", type: "header", content: { text: "Update on Your Application" }, styles: { color: "#2B6CB0" } },
      { id: "t-1", type: "text", content: { text: "Dear Candidate,\n\nThank you for taking the time to interview with us. We have decided to move forward with another candidate whose background more closely aligned with our needs at this time.\n\nWe appreciate your interest in Nexus and wish you all the best." }, styles: { color: "#4A5568" } },
      { id: "b-1", type: "button", content: { text: "View Future Openings", url: "#", backgroundColor: "#2B6CB0", color: "#ffffff" }, styles: {} },
      { id: "t-2", type: "text", content: { text: "© 2026 Nexus HR · Unsubscribe" }, styles: { color: "#A0AEC0", fontSize: "12px", textAlign: "center" } }
    ]
  }
]

async function handleSeed(request: NextRequest) {
  try {
    const summary = {
      updated: 0,
      failed: 0,
      details: [] as { name: string; status: "updated" | "failed"; error?: string }[]
    }

    for (const tpl of defaultTemplates) {
      try {
        const generatedHtml = generateHtmlFromBlocks(tpl.blocks)

        const existing = await prisma.emailTemplate.findFirst({
          where: {
            name: tpl.name,
            isSystem: true
          }
        })

        if (existing) {
          await prisma.emailTemplate.update({
            where: { id: existing.id },
            data: {
              html: generatedHtml,
              json: JSON.stringify(tpl.blocks),
              category: tpl.category || "General",
              createdBy: null,
              isSystem: true
            }
          })
        } else {
          await prisma.emailTemplate.create({
            data: {
              name: tpl.name,
              category: tpl.category || "General",
              html: generatedHtml,
              json: JSON.stringify(tpl.blocks),
              createdBy: null,
              isPublic: true,
              isSystem: true
            }
          })
        }

        console.log("Upserted:", tpl.name)
        summary.updated++
        summary.details.push({ name: tpl.name, status: "updated" })
      } catch (err: any) {
        console.error("Failed:", tpl.name, err)
        summary.failed++
        summary.details.push({ name: tpl.name, status: "failed", error: err.message || "Unknown error" })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Completed seeding process. Updated: ${summary.updated}, Failed: ${summary.failed}`,
      results: summary
    })
  } catch (error: any) {
    console.error("Failed to execute template seeding:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleSeed(request)
}

export async function POST(request: NextRequest) {
  return handleSeed(request)
}
