import { TemplateBlock, ParseResult } from "../types";

// Helper to sanitize dangerous code
function sanitizeAttributes(element: HTMLElement, warnings: string[], score: { value: number }) {
  const dangerousAttrs = ["onclick", "onload", "onerror", "onmouseover", "onfocus", "onblur"];
  for (const attr of dangerousAttrs) {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
      warnings.push(`Removed dangerous event listener attribute: ${attr}`);
      score.value = Math.max(score.value - 20, 10);
    }
  }

  // Sanitize src/href values for javascript: URIs
  const src = element.getAttribute("src");
  if (src && src.toLowerCase().startsWith("javascript:")) {
    element.removeAttribute("src");
    warnings.push("Removed javascript: URI from image src");
    score.value = Math.max(score.value - 30, 10);
  }

  const href = element.getAttribute("href");
  if (href && href.toLowerCase().startsWith("javascript:")) {
    element.removeAttribute("href");
    warnings.push("Removed javascript: URI from anchor href");
    score.value = Math.max(score.value - 30, 10);
  }
}

export function parseHTMLToBlocks(html: string): ParseResult {
  const warnings: string[] = [];
  const score = { value: 100 };
  const blocks: TemplateBlock[] = [];

  if (!html || html.trim() === "") {
    return {
      blocks: [],
      confidence: "HIGH",
      warnings: [],
    };
  }

  // Check for Outlook MSO conditional hacks which lower parsing confidence
  if (html.includes("<!--[if") || html.includes("mso-") || html.includes("<v:")) {
    warnings.push("Contains Outlook-specific conditional comments or MSO namespaces.");
    score.value = Math.max(score.value - 40, 10);
  }

  // Basic check for script tags
  if (html.toLowerCase().includes("<script")) {
    warnings.push("Contains script tags. Removed for security.");
    score.value = Math.max(score.value - 50, 10);
  }

  // Client-side DOM parsing
  const parser = new DOMParser();
  // Strip script tags entirely before parsing to prevent execution
  const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  const doc = parser.parseFromString(cleanHtml, "text/html");

  // Keep track of processed IDs
  let idCounter = 0;
  const generateId = (type: string) => `${type}-${Date.now()}-${idCounter++}`;

  // Recursive DOM traversal function
  function parseNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      sanitizeAttributes(element, warnings, score);

      // Detect Spacer (often represented by empty divs, tds with specific height)
      const heightStyle = element.style.height;
      const heightAttr = element.getAttribute("height");
      const isSpacer =
        (tagName === "div" || tagName === "td") &&
        !element.textContent?.trim() &&
        element.children.length === 0 &&
        (heightStyle || heightAttr);

      if (isSpacer) {
        const height = heightStyle || `${heightAttr}px` || "20px";
        blocks.push({
          id: generateId("spacer"),
          type: "spacer",
          content: { height },
          styles: { height },
        });
        return;
      }

      // Detect Divider
      const isDivider =
        tagName === "hr" ||
        (tagName === "div" &&
         element.style.borderTop &&
         element.textContent?.trim() === "" &&
         element.querySelectorAll("div, table, p, h1, h2, h3, h4, h5, h6, img, a").length === 0);

      if (isDivider) {
        blocks.push({
          id: generateId("divider"),
          type: "divider",
          content: {},
          styles: {
            borderColor: element.style.borderColor || "#e5e7eb",
            borderWidth: element.style.borderWidth || "1px",
          },
        });
        return;
      }

      // Detect Image
      if (tagName === "img") {
        const widthVal = element.getAttribute("width") || element.style.width || "100";
        const numericWidth = parseInt(widthVal, 10) || 100;
        const widthUnit = widthVal.includes("%") ? "%" : "px";

        blocks.push({
          id: generateId("image"),
          type: "image",
          content: {
            src: element.getAttribute("src") || "https://via.placeholder.com/600x300",
            alt: element.getAttribute("alt") || "",
            width: numericWidth,
            widthUnit: widthUnit as "px" | "%",
            height: element.getAttribute("height") ? parseInt(element.getAttribute("height")!, 10) : "auto",
            alignment: (element.style.textAlign as any) || "center",
          },
          styles: {
            borderRadius: element.style.borderRadius || "8px",
          },
        });
        return;
      }

      // Detect Heading (header block)
      if (/^h[1-6]$/.test(tagName)) {
        blocks.push({
          id: generateId("header"),
          type: "header",
          content: { text: element.innerHTML.trim() },
          styles: {
            color: element.style.color || "",
            fontSize: element.style.fontSize || "",
            textAlign: (element.style.textAlign as any) || "center",
            backgroundColor: element.style.backgroundColor || "",
            padding: element.style.padding || "",
          },
        });
        return;
      }

      // Detect Button (styled anchor tags or tables/divs that only contain a single styled link)
      const isButton =
        tagName === "a" &&
        (element.style.backgroundColor ||
          element.classList.contains("button") ||
          element.classList.contains("btn"));

      if (isButton) {
        blocks.push({
          id: generateId("button"),
          type: "button",
          content: {
            text: element.textContent?.trim() || "Click Here",
            url: element.getAttribute("href") || "#",
            backgroundColor: element.style.backgroundColor || "#007bff",
            color: element.style.color || "#ffffff",
          },
          styles: {
            borderRadius: element.style.borderRadius || "4px",
            padding: element.style.padding || "12px 24px",
          },
        });
        return;
      }

      // Detect Paragraph
      if (tagName === "p") {
        blocks.push({
          id: generateId("text"),
          type: "text",
          content: { text: element.innerHTML.trim() },
          styles: {
            color: element.style.color || "",
            fontSize: element.style.fontSize || "",
            textAlign: (element.style.textAlign as any) || "left",
            padding: element.style.padding || "",
          },
        });
        return;
      }

      // Footer Detection
      const isFooterElement =
        tagName === "footer" ||
        element.classList.contains("footer") ||
        element.id === "footer" ||
        ((element.innerHTML.includes("unsubscribe") || element.innerHTML.includes("Unsubscribe")) &&
         element.innerHTML.includes("copyright") &&
         element.querySelectorAll("div, table").length === 0);

      if (isFooterElement) {
        blocks.push({
          id: generateId("footer"),
          type: "footer",
          content: {
            company: "{{companyName}}",
            address: "123 Business St, City, State 12345",
            unsubscribeText: "You received this email because you're subscribed to our newsletter.",
            copyright: `© ${new Date().getFullYear()} {{companyName}}. All rights reserved.`,
          },
          styles: {
            backgroundColor: element.style.backgroundColor || "#f8f9fa",
            color: element.style.color || "#6c757d",
            fontSize: element.style.fontSize || "12px",
            padding: element.style.padding || "20px",
            textAlign: (element.style.textAlign as any) || "center",
          },
        });
        return;
      }

      // Social Bar Detection
      if (
        (element.classList.contains("social") || element.innerHTML.includes("facebook") || element.innerHTML.includes("twitter")) &&
        element.getElementsByTagName("a").length >= 2 &&
        element.querySelectorAll("div, table").length === 0
      ) {
        const fbLink = element.querySelector('a[href*="facebook"]')
          ?.getAttribute("href") || "";
        const twitterLink = element.querySelector('a[href*="twitter"]')
          ?.getAttribute("href") || element.querySelector('a[href*="x.com"]')?.getAttribute("href") || "";
        const linkedinLink = element.querySelector('a[href*="linkedin"]')
          ?.getAttribute("href") || "";
        const instagramLink = element.querySelector('a[href*="instagram"]')
          ?.getAttribute("href") || "";

        blocks.push({
          id: generateId("social"),
          type: "social",
          content: {
            facebook: fbLink,
            twitter: twitterLink,
            linkedin: linkedinLink,
            instagram: instagramLink,
          },
          styles: {
            padding: element.style.padding || "20px",
            textAlign: (element.style.textAlign as any) || "center",
          },
        });
        return;
      }

      // Handle structural table elements recursively to flatten them out
      if (tagName === "table" || tagName === "tbody" || tagName === "tr" || tagName === "td" || tagName === "div") {
        // If there are children, parse them recursively
        if (element.childNodes.length > 0) {
          for (let i = 0; i < element.childNodes.length; i++) {
            parseNode(element.childNodes[i]);
          }
        }
        return;
      }

      // Fallback for unrecognized tag: Wrap it as custom HTML block
      const outerHTML = element.outerHTML.trim();
      if (outerHTML) {
        blocks.push({
          id: generateId("html"),
          type: "html",
          content: { html: outerHTML },
          styles: {},
        });
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          id: generateId("text"),
          type: "text",
          content: { text },
          styles: {},
        });
      }
    }
  }

  // Traverse document body children
  for (let i = 0; i < doc.body.childNodes.length; i++) {
    parseNode(doc.body.childNodes[i]);
  }

  // Deduce confidence
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  if (score.value < 50) {
    confidence = "LOW";
  } else if (score.value < 85) {
    confidence = "MEDIUM";
  }

  return {
    blocks,
    confidence,
    warnings,
  };
}
