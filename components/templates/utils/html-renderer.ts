import { TemplateBlock } from "../types";

export function renderBlockToHTML(block: TemplateBlock): string {
  const stylesStr = Object.entries(block.styles || {})
    .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
    .join("; ");

  switch (block.type) {
    case "header":
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td align="${block.styles.textAlign || "center"}" style="padding: 20px; text-align: ${block.styles.textAlign || "center"}; ${stylesStr}">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.2;">${block.content.text}</h1>
            </td>
          </tr>
        </table>
      `;
    case "text":
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td align="${block.styles.textAlign || "left"}" style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; text-align: ${block.styles.textAlign || "left"}; ${stylesStr}">
              <p style="margin: 0;">${block.content.text}</p>
            </td>
          </tr>
        </table>
      `;
    case "button":
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td align="center" style="padding: 20px; text-align: center;">
              <a href="${block.content.url || "#"}" style="background-color: ${block.content.backgroundColor || "#007bff"}; color: ${block.content.color || "#ffffff"}; padding: 12px 24px; text-decoration: none; border-radius: ${block.styles.borderRadius || "4px"}; display: inline-block; font-weight: bold; font-family: Arial, sans-serif; ${stylesStr}">
                ${block.content.text}
              </a>
            </td>
          </tr>
        </table>
      `;
    case "image":
      const align = block.content.alignment || "center";
      const width = block.content.width || 100;
      const unit = block.content.widthUnit || "%";
      const widthVal = `${width}${unit}`;
      const heightVal = block.content.height && block.content.height !== "auto" ? `${block.content.height}px` : "auto";

      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td align="${align}" style="padding: 20px; text-align: ${align};">
              <img src="${block.content.src || "https://via.placeholder.com/600x300"}" alt="${block.content.alt || ""}" width="${widthVal}" style="max-width: 100%; height: ${heightVal}; border-radius: ${block.styles.borderRadius || "8px"}; display: inline-block; border: none;" />
            </td>
          </tr>
        </table>
      `;
    case "divider":
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <hr style="border: none; border-top: ${block.styles.borderWidth || "1px"} solid ${block.styles.borderColor || "#e5e7eb"}; width: 100%; margin: 0; padding: 0;" />
            </td>
          </tr>
        </table>
      `;
    case "spacer":
      const height = block.content.height || "20px";
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td style="height: ${height}; line-height: ${height}; font-size: ${height};">&nbsp;</td>
          </tr>
        </table>
      `;
    case "footer":
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td align="${block.styles.textAlign || "center"}" style="padding: 20px; text-align: ${block.styles.textAlign || "center"}; background-color: ${block.styles.backgroundColor || "#f8f9fa"}; color: ${block.styles.color || "#6c757d"}; font-size: ${block.styles.fontSize || "12px"}; font-family: Arial, sans-serif; ${stylesStr}">
              <p style="margin: 0 0 10px 0; font-size: 11px; line-height: 1.4;">
                ${block.content.unsubscribeText || "You received this email because you're subscribed to our newsletter."}
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; line-height: 1.4;">
                <a href="{{unsubscribeLink}}" style="color: #6c757d; text-decoration: underline; margin-right: 10px;">Unsubscribe</a>
                <a href="#" style="color: #6c757d; text-decoration: underline; margin-right: 10px;">Privacy Policy</a>
                <a href="#" style="color: #6c757d; text-decoration: underline;">Terms of Service</a>
              </p>
              <p style="margin: 0 0 5px 0; font-size: 11px; line-height: 1.4;">
                ${block.content.company || "{{companyName}}"}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 10px; line-height: 1.4;">
                ${block.content.address || "123 Business St, City, State 12345"}
              </p>
              <p style="margin: 0; font-size: 10px; line-height: 1.4; border-top: 1px solid #dee2e6; padding-top: 10px;">
                ${block.content.copyright || `© ${new Date().getFullYear()} {{companyName}}. All rights reserved.`}
              </p>
            </td>
          </tr>
        </table>
      `;
    case "social":
      const platforms = [
        { id: "facebook", label: "FB" },
        { id: "twitter", label: "X" },
        { id: "linkedin", label: "IN" },
        { id: "instagram", label: "IG" },
        { id: "youtube", label: "YT" }
      ];
      const socialLinks = platforms
        .map(p => {
          if (block.content[p.id]) {
            return `<a href="${block.content[p.id]}" target="_blank" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; margin: 0 5px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; text-align: center; font-family: Arial, sans-serif;">${p.label}</a>`;
          }
          return "";
        })
        .join("");

      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td align="${block.styles.textAlign || "center"}" style="padding: 20px; text-align: ${block.styles.textAlign || "center"};">
              ${socialLinks || '<span style="color: #9ca3af; font-size: 12px; font-style: italic;">Social Links</span>'}
            </td>
          </tr>
        </table>
      `;
    case "html":
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            <td style="padding: 20px;">
              ${block.content.html || "<div>Custom HTML Block</div>"}
            </td>
          </tr>
        </table>
      `;
    case "container":
    case "2column":
    case "3column":
      // Columns rendering
      const cols = [];
      if (block.content.text1) cols.push(block.content.text1);
      if (block.content.text2) cols.push(block.content.text2);
      if (block.content.text3) cols.push(block.content.text3);
      if (cols.length === 0) cols.push("Content Block");

      const colWidth = Math.floor(100 / cols.length);
      const cells = cols
        .map(
          c => `
        <td width="${colWidth}%" style="padding: 10px; vertical-align: top;">
          ${c}
        </td>
      `
        )
        .join("");

      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; min-width: 100%;">
          <tr>
            ${cells}
          </tr>
        </table>
      `;
    default:
      return "";
  }
}

export function renderBlocksToHTML(blocks: TemplateBlock[]): string {
  if (!Array.isArray(blocks)) return "";
  return blocks.map(block => renderBlockToHTML(block)).join("\n");
}
