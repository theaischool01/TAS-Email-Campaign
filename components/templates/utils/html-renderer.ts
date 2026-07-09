import { TemplateBlock } from "../types";

export function renderBlockToHTML(block: TemplateBlock): string {
  const blockStyles = block.styles || {};
  const blockContent = block.content || {};
  
  // Exclude positioning, layout, and wrapper-applied CSS rules that are handled on outer TDs
  const excludeKeys = [
    "position", "display", "flex", "grid", "gap", "transform", "float",
    "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
    "padding-top", "padding-bottom", "padding-left", "padding-right",
    "backgroundColor", "background-color",
    "textAlign", "text-align"
  ];
  
  const localExcludeKeys = [...excludeKeys];
  if (block.type === "image") {
    localExcludeKeys.push("marginLeft", "marginRight", "margin-left", "margin-right");
  }

  const cleanStylesStr = Object.entries(blockStyles)
    .filter(([key]) => !localExcludeKeys.includes(key))
    .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
    .join("; ");

  switch (block.type) {
    case "header": {
      const textAlignment = blockStyles.textAlign || "center";
      const fontFam = blockStyles.fontFamily || "Arial, sans-serif";
      const fontSizeVal = blockStyles.fontSize || "24px";
      const colorVal = blockStyles.color || "#1e293b";
      const paddingVal = blockStyles.padding || "20px";
      
      return `
        <!-- Block: Header -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="${textAlignment}" valign="top" style="padding: ${paddingVal}; text-align: ${textAlignment}; background-color: ${blockStyles.backgroundColor || "transparent"};">
              <h1 style="margin: 0; font-family: ${fontFam}; font-size: ${fontSizeVal}; font-weight: 800; line-height: 1.25; color: ${colorVal}; text-align: ${textAlignment}; ${cleanStylesStr}">
                ${blockContent.text || ""}
              </h1>
            </td>
          </tr>
        </table>
      `;
    }

    case "text": {
      const textAlignment = blockStyles.textAlign || "left";
      const fontFam = blockStyles.fontFamily || "Arial, sans-serif";
      const fontSizeVal = blockStyles.fontSize || "14px";
      const colorVal = blockStyles.color || "#333333";
      const paddingVal = blockStyles.padding || "20px";

      return `
        <!-- Block: Text -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="${textAlignment}" valign="top" style="padding: ${paddingVal}; text-align: ${textAlignment}; background-color: ${blockStyles.backgroundColor || "transparent"};">
              <div style="margin: 0; font-family: ${fontFam}; font-size: ${fontSizeVal}; line-height: 1.6; color: ${colorVal}; text-align: ${textAlignment}; ${cleanStylesStr}">
                ${blockContent.text || ""}
              </div>
            </td>
          </tr>
        </table>
      `;
    }

    case "button": {
      const textAlignment = blockStyles.textAlign || "center";
      const buttonBg = blockContent.backgroundColor || "#007bff";
      const buttonColor = blockContent.color || "#ffffff";
      const fontFam = blockStyles.fontFamily || "Arial, sans-serif";
      const paddingVal = blockStyles.padding || "20px";
      const borderRadiusVal = blockStyles.borderRadius || "4px";

      return `
        <!-- Block: Button -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="${textAlignment}" valign="top" style="padding: ${paddingVal}; text-align: ${textAlignment}; background-color: ${blockStyles.backgroundColor || "transparent"};">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${textAlignment}" style="margin: ${textAlignment === "center" ? "0 auto" : textAlignment === "left" ? "0" : "0 0 0 auto"};">
                <tr>
                  <td align="center" bgcolor="${buttonBg}" style="border-radius: ${borderRadiusVal}; background-color: ${buttonBg}; ${cleanStylesStr}">
                    <a href="${blockContent.url || "#"}" target="_blank" style="font-family: ${fontFam}; font-size: 14px; font-weight: bold; color: ${buttonColor}; text-decoration: none; display: inline-block; padding: 12px 24px; border: 1px solid ${buttonBg}; border-radius: ${borderRadiusVal};">
                      ${blockContent.text || ""}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }

    case "image": {
      const align = blockContent.alignment || "center";
      const width = blockContent.width || 100;
      const unit = blockContent.widthUnit || "%";
      const widthVal = `${width}${unit}`;
      const paddingVal = blockStyles.padding || "20px";
      const maxW = unit === "%" ? "100%" : `${width}px`;
      const heightVal = !blockContent.height || blockContent.height === "auto"
        ? "auto"
        : `${blockContent.height}px`;

      // ── Resolve imageSettings with runtime defaults (backward compatible) ──
      const imgSettings = blockContent.imageSettings || {};
      const fit: string = imgSettings.fit || "fill";
      const zoom: number = imgSettings.zoom ?? 1;
      const posX: number = imgSettings.objectPosition?.x ?? 50;
      const posY: number = imgSettings.objectPosition?.y ?? 50;

      // Only emit object-fit / object-position CSS when they differ from the
      // default fill behaviour, keeping legacy template output minimal.
      const objectFitCSS = fit !== "fill"
        ? `object-fit: ${fit}; object-position: ${posX}% ${posY}%;`
        : "";

      // zoom is implemented via a transform scale; only emit when non-default
      // and fit is not fill (meaningless to zoom a stretched image)
      const zoomCSS = fit !== "fill" && zoom !== 1
        ? `transform: scale(${zoom}); transform-origin: ${posX}% ${posY}%;`
        : "";

      return `
        <!-- Block: Image -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="${align}" valign="top" style="padding: ${paddingVal}; text-align: ${align}; background-color: ${blockStyles.backgroundColor || "transparent"};">
              <img src="${blockContent.src || "https://via.placeholder.com/600x300"}" alt="${blockContent.alt || ""}" width="${widthVal}" style="max-width: ${maxW}; width: ${widthVal}; height: ${heightVal}; border: ${blockStyles.border || "none"}; border-radius: ${blockStyles.borderRadius || "8px"}; box-shadow: ${blockStyles.boxShadow || "none"}; display: block; margin: ${align === "center" ? "0 auto" : align === "left" ? "0" : "0 0 0 auto"}; ${objectFitCSS} ${zoomCSS} ${cleanStylesStr}" />
            </td>
          </tr>
        </table>
      `;
    }

    case "divider": {
      const paddingVal = blockStyles.padding || "20px 0";
      const borderW = blockStyles.borderWidth || "1px";
      const borderC = blockStyles.borderColor || "#e5e7eb";

      return `
        <!-- Block: Divider -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td valign="top" style="padding: ${paddingVal}; background-color: ${blockStyles.backgroundColor || "transparent"};">
              <hr style="border: none; border-top: ${borderW} solid ${borderC}; width: 100%; margin: 0; padding: 0;" />
            </td>
          </tr>
        </table>
      `;
    }

    case "spacer": {
      const height = blockContent.height || "20px";
      return `
        <!-- Block: Spacer -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td height="${parseInt(height)}" style="height: ${height}; line-height: ${height}; font-size: ${height}; background-color: ${blockStyles.backgroundColor || "transparent"};">&nbsp;</td>
          </tr>
        </table>
      `;
    }

    case "footer": {
      const textAlignment = blockStyles.textAlign || "center";
      const colorVal = blockStyles.color || "#6c757d";
      const fontSizeVal = blockStyles.fontSize || "12px";
      const paddingVal = blockStyles.padding || "32px 20px";

      return `
        <!-- Block: Footer -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="${textAlignment}" valign="top" style="padding: ${paddingVal}; text-align: ${textAlignment}; background-color: ${blockStyles.backgroundColor || "#f8f9fa"}; color: ${colorVal}; font-size: ${fontSizeVal}; font-family: Arial, sans-serif; ${cleanStylesStr}">
              <p style="margin: 0 0 10px 0; font-size: 11px; line-height: 1.5; color: ${colorVal};">
                ${blockContent.unsubscribeText || "You received this email because you're subscribed to our newsletter."}
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; line-height: 1.5;">
                <a href="{{unsubscribeLink}}" style="color: ${colorVal}; text-decoration: underline; margin-right: 12px;">Unsubscribe</a>
                <a href="#" style="color: ${colorVal}; text-decoration: underline; margin-right: 12px;">Privacy Policy</a>
                <a href="#" style="color: ${colorVal}; text-decoration: underline;">Terms of Service</a>
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: ${colorVal};">
                ${blockContent.company || "{{companyName}}"}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 10px; color: ${colorVal};">
                ${blockContent.address || "123 Business St, City, State 12345"}
              </p>
              <p style="margin: 0; font-size: 10px; color: ${colorVal}; border-top: 1px solid #dee2e6; padding-top: 12px;">
                ${blockContent.copyright || `© ${new Date().getFullYear()} {{companyName}}. All rights reserved.`}
              </p>
            </td>
          </tr>
        </table>
      `;
    }

    case "social":
    case "social-follow": {
      const layout = blockContent.layout || "icons-only";
      const heading = blockContent.heading || "";
      const description = blockContent.description || "";
      const alignment = blockContent.alignment || "center";
      const iconStyle = blockContent.iconStyle || "brand";
      const iconSize = blockContent.iconSize || 32;
      const spacing = blockContent.spacing !== undefined ? blockContent.spacing : 12;

      const networksList = ["facebook", "twitter", "linkedin", "instagram", "youtube", "pinterest", "tiktok", "github", "whatsapp", "telegram", "discord", "website", "email"];
      const enabled = blockContent.enabledNetworks || { facebook: true, instagram: true, linkedin: true, twitter: true, youtube: true };

      const getSocialIconUrl = (network: string, style: string): string => {
        const brandIcons: Record<string, string> = {
          facebook: "https://img.icons8.com/color/48/facebook-new.png",
          twitter: "https://img.icons8.com/color/48/twitterx--v1.png",
          linkedin: "https://img.icons8.com/color/48/linkedin.png",
          instagram: "https://img.icons8.com/color/48/instagram-new.png",
          youtube: "https://img.icons8.com/color/48/youtube-play.png",
          pinterest: "https://img.icons8.com/color/48/pinterest.png",
          tiktok: "https://img.icons8.com/color/48/tiktok.png",
          github: "https://img.icons8.com/color/48/github--v1.png",
          whatsapp: "https://img.icons8.com/color/48/whatsapp.png",
          telegram: "https://img.icons8.com/color/48/telegram-app.png",
          discord: "https://img.icons8.com/color/48/discord-logo.png",
          website: "https://img.icons8.com/color/48/domain.png",
          email: "https://img.icons8.com/color/48/new-post.png"
        };
        const monoIcons: Record<string, string> = {
          facebook: "https://img.icons8.com/ios-filled/48/333333/facebook-new.png",
          twitter: "https://img.icons8.com/ios-filled/48/333333/twitterx.png",
          linkedin: "https://img.icons8.com/ios-filled/48/333333/linkedin.png",
          instagram: "https://img.icons8.com/ios-filled/48/333333/instagram-new.png",
          youtube: "https://img.icons8.com/ios-filled/48/333333/youtube-play.png",
          pinterest: "https://img.icons8.com/ios-filled/48/333333/pinterest.png",
          tiktok: "https://img.icons8.com/ios-filled/48/333333/tiktok.png",
          github: "https://img.icons8.com/ios-filled/48/333333/github.png",
          whatsapp: "https://img.icons8.com/ios-filled/48/333333/whatsapp.png",
          telegram: "https://img.icons8.com/ios-filled/48/333333/telegram-app.png",
          discord: "https://img.icons8.com/ios-filled/48/333333/discord-logo.png",
          website: "https://img.icons8.com/ios-filled/48/333333/domain.png",
          email: "https://img.icons8.com/ios-filled/48/333333/new-post.png"
        };
        const filledIcons: Record<string, string> = {
          facebook: "https://img.icons8.com/glassmorphism/48/facebook-new.png",
          twitter: "https://img.icons8.com/glassmorphism/48/twitterx.png",
          linkedin: "https://img.icons8.com/glassmorphism/48/linkedin.png",
          instagram: "https://img.icons8.com/glassmorphism/48/instagram-new.png",
          youtube: "https://img.icons8.com/glassmorphism/48/youtube-play.png",
          pinterest: "https://img.icons8.com/glassmorphism/48/pinterest.png",
          tiktok: "https://img.icons8.com/glassmorphism/48/tiktok.png",
          github: "https://img.icons8.com/glassmorphism/48/github.png",
          whatsapp: "https://img.icons8.com/glassmorphism/48/whatsapp.png",
          telegram: "https://img.icons8.com/glassmorphism/48/telegram-app.png",
          discord: "https://img.icons8.com/glassmorphism/48/discord-logo.png",
          website: "https://img.icons8.com/glassmorphism/48/domain.png",
          email: "https://img.icons8.com/glassmorphism/48/new-post.png"
        };
        const outlineIcons: Record<string, string> = {
          facebook: "https://img.icons8.com/ios/48/333333/facebook-new.png",
          twitter: "https://img.icons8.com/ios/48/333333/twitterx.png",
          linkedin: "https://img.icons8.com/ios/48/333333/linkedin.png",
          instagram: "https://img.icons8.com/ios/48/333333/instagram-new.png",
          youtube: "https://img.icons8.com/ios/48/333333/youtube-play.png",
          pinterest: "https://img.icons8.com/ios/48/333333/pinterest.png",
          tiktok: "https://img.icons8.com/ios/48/333333/tiktok.png",
          github: "https://img.icons8.com/ios/48/333333/github.png",
          whatsapp: "https://img.icons8.com/ios/48/333333/whatsapp.png",
          telegram: "https://img.icons8.com/ios/48/333333/telegram-app.png",
          discord: "https://img.icons8.com/ios/48/333333/discord-logo.png",
          website: "https://img.icons8.com/ios/48/333333/domain.png",
          email: "https://img.icons8.com/ios/48/333333/new-post.png"
        };
        const squareIcons: Record<string, string> = {
          facebook: "https://img.icons8.com/fluency/48/facebook-new.png",
          twitter: "https://img.icons8.com/fluency/48/twitterx.png",
          linkedin: "https://img.icons8.com/fluency/48/linkedin.png",
          instagram: "https://img.icons8.com/fluency/48/instagram-new.png",
          youtube: "https://img.icons8.com/fluency/48/youtube-play.png",
          pinterest: "https://img.icons8.com/fluency/48/pinterest.png",
          tiktok: "https://img.icons8.com/fluency/48/tiktok.png",
          github: "https://img.icons8.com/fluency/48/github.png",
          whatsapp: "https://img.icons8.com/fluency/48/whatsapp.png",
          telegram: "https://img.icons8.com/fluency/48/telegram-app.png",
          discord: "https://img.icons8.com/fluency/48/discord-logo.png",
          website: "https://img.icons8.com/fluency/48/domain.png",
          email: "https://img.icons8.com/fluency/48/new-post.png"
        };

        if (style === "monochrome") return monoIcons[network] || monoIcons.website;
        if (style === "filled") return filledIcons[network] || filledIcons.website;
        if (style === "outline") return outlineIcons[network] || outlineIcons.website;
        if (style === "square") return squareIcons[network] || squareIcons.website;
        return brandIcons[network] || brandIcons.website;
      };

      const activeNets = networksList.filter(net => enabled[net]);
      const cells = activeNets
        .map(net => {
          const urlVal = blockContent.urls?.[net] || blockContent[net] || "";
          const iconUrl = getSocialIconUrl(net, iconStyle);
          const iconImg = `<img src="${iconUrl}" alt="${net}" width="${iconSize}" height="${iconSize}" style="display: block; border: none; width: ${iconSize}px; height: ${iconSize}px;" />`;
          return `
            <td align="center" valign="middle" style="padding: 0 ${spacing / 2}px;">
              ${urlVal ? `<a href="${urlVal}" target="_blank" style="text-decoration: none; display: block;">${iconImg}</a>` : iconImg}
            </td>
          `;
        })
        .join("");

      const socialRow = `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${alignment}" style="margin: ${alignment === "center" ? "0 auto" : alignment === "left" ? "0" : "0 0 0 auto"};">
          <tr>
            ${cells}
          </tr>
        </table>
      `;

      let followContent = "";
      if (layout === "follow-section") {
        if (heading) {
          followContent += `<tr><td align="${alignment}" style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: ${blockStyles.color || "#1e293b"}; padding-bottom: 8px; text-align: ${alignment};">${heading}</td></tr>`;
        }
        if (description) {
          followContent += `<tr><td align="${alignment}" style="font-family: Arial, sans-serif; font-size: 13px; color: ${blockStyles.color || "#64748b"}; padding-bottom: 16px; text-align: ${alignment};">${description}</td></tr>`;
        }
      }

      const paddingVal = blockStyles.padding || "20px";

      return `
        <!-- Block: Social Icons -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="${alignment}" valign="top" style="padding: ${paddingVal}; background-color: ${blockStyles.backgroundColor || "transparent"}; ${cleanStylesStr}">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                ${followContent}
                <tr>
                  <td align="${alignment}">
                    ${socialRow}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }

    case "html": {
      const paddingVal = blockStyles.padding || "20px";
      return `
        <!-- Block: Raw HTML -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td valign="top" style="padding: ${paddingVal}; background-color: ${blockStyles.backgroundColor || "transparent"}; ${cleanStylesStr}">
              ${blockContent.html || "<div>Custom HTML Content</div>"}
            </td>
          </tr>
        </table>
      `;
    }

    case "2column":
    case "3column": {
      const isThreeCol = block.type === "3column";
      
      const getColumnCellHtml = (colIdx: number, defaultText: string) => {
        const colType = blockContent[`col${colIdx}Type`] || "text";
        if (colType === "image") {
          const src = blockContent[`col${colIdx}ImageSrc`] || "https://via.placeholder.com/150";
          const alt = blockContent[`col${colIdx}ImageAlt`] || "";
          const width = blockContent[`col${colIdx}ImageWidth`] || "100";
          const widthUnit = blockContent[`col${colIdx}ImageWidthUnit`] || "%";
          const align = blockContent[`col${colIdx}ImageAlignment`] || "center";
          const widthStr = `${width}${widthUnit}`;
          const maxW = widthUnit === "%" ? "100%" : `${width}px`;
          return `<div align="${align}"><img src="${src}" alt="${alt}" width="${widthStr}" style="max-width: ${maxW}; width: ${widthStr}; height: auto; border: none; display: block; margin: ${align === "center" ? "0 auto" : align === "left" ? "0" : "0 0 0 auto"};" /></div>`;
        }
        if (colType === "button") {
          const btnText = blockContent[`col${colIdx}ButtonText`] || "Click Here";
          const btnUrl = blockContent[`col${colIdx}ButtonUrl`] || "#";
          const btnBg = blockContent[`col${colIdx}ButtonBg`] || "#007bff";
          const btnColor = blockContent[`col${colIdx}ButtonColor`] || "#ffffff";
          const align = blockContent[`col${colIdx}ButtonAlignment`] || "center";
          return `
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${align}" style="margin: ${align === "center" ? "0 auto" : align === "left" ? "0" : "0 0 0 auto"};">
              <tr>
                <td align="center" bgcolor="${btnBg}" style="border-radius: 4px; background-color: ${btnBg};">
                  <a href="${btnUrl}" target="_blank" style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; color: ${btnColor}; text-decoration: none; display: inline-block; padding: 8px 16px;">
                    ${btnText}
                  </a>
                </td>
              </tr>
            </table>
          `;
        }
        // default text
        return blockContent[`text${colIdx}`] || defaultText;
      };

      const colText1 = getColumnCellHtml(1, "Column 1 Content");
      const colText2 = getColumnCellHtml(2, "Column 2 Content");
      const colText3 = getColumnCellHtml(3, "Column 3 Content");

      if (isThreeCol) {
        return `
          <!-- Block: 3 Column Layout -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" valign="top" style="font-size: 0; padding: 10px; background-color: ${blockStyles.backgroundColor || "transparent"}; ${cleanStylesStr}">
                <!--[if mso | IE]>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600">
                  <tr>
                    <td valign="top" width="200">
                <![endif]-->
                <div style="display: inline-block; width: 100%; max-width: 185px; vertical-align: top;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; text-align: left; color: ${blockStyles.color || "#333333"};">
                        ${colText1}
                      </td>
                    </tr>
                  </table>
                </div><!--[if mso | IE]></td><td valign="top" width="200"><![endif]--><div style="display: inline-block; width: 100%; max-width: 185px; vertical-align: top;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; text-align: left; color: ${blockStyles.color || "#333333"};">
                        ${colText2}
                      </td>
                    </tr>
                  </table>
                </div><!--[if mso | IE]></td><td valign="top" width="200"><![endif]--><div style="display: inline-block; width: 100%; max-width: 185px; vertical-align: top;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; text-align: left; color: ${blockStyles.color || "#333333"};">
                        ${colText3}
                      </td>
                    </tr>
                  </table>
                </div>
                <!--[if mso | IE]>
                    </td>
                  </tr>
                </table>
                <![endif]-->
              </td>
            </tr>
          </table>
        `;
      } else {
        const ratioVal = blockContent.layoutRatio || "50/50";
        const [w1, w2] = ratioVal.split('/').map((s: string) => s.trim());
        const w1Percent = `${w1}%`;
        const w2Percent = `${w2}%`;
        
        // Also adjust max-width constraints for Outlook/Mso if needed
        const maxW1 = Math.round(600 * (Number(w1) / 100)) - 20;
        const maxW2 = Math.round(600 * (Number(w2) / 100)) - 20;

        return `
          <!-- Block: 2 Column Layout -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" valign="top" style="font-size: 0; padding: 10px; background-color: ${blockStyles.backgroundColor || "transparent"}; ${cleanStylesStr}">
                <!--[if mso | IE]>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600">
                  <tr>
                    <td valign="top" width="${maxW1 + 20}">
                <![endif]-->
                <div style="display: inline-block; width: 100%; max-width: ${maxW1}px; vertical-align: top;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; text-align: left; color: ${blockStyles.color || "#333333"};">
                        ${colText1}
                      </td>
                    </tr>
                  </table>
                </div><!--[if mso | IE]></td><td valign="top" width="${maxW2 + 20}"><![endif]--><div style="display: inline-block; width: 100%; max-width: ${maxW2}px; vertical-align: top;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; text-align: left; color: ${blockStyles.color || "#333333"};">
                        ${colText2}
                      </td>
                    </tr>
                  </table>
                </div>
                <!--[if mso | IE]>
                    </td>
                  </tr>
                </table>
                <![endif]-->
              </td>
            </tr>
          </table>
        `;
      }
    }

    default:
      return "";
  }
}

export function renderBlocksToHTML(blocks: TemplateBlock[]): string {
  if (!Array.isArray(blocks)) return "";
  const blocksHtml = blocks.map(block => renderBlockToHTML(block)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Message</title>
  <style>
    body, html {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: #f3f4f6 !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    /* Simple lists overrides */
    ul {
      list-style-type: disc !important;
      padding-left: 20px !important;
      margin-top: 8px !important;
      margin-bottom: 8px !important;
    }
    ol {
      list-style-type: decimal !important;
      padding-left: 20px !important;
      margin-top: 8px !important;
      margin-bottom: 8px !important;
    }
    li {
      margin-bottom: 4px !important;
    }
    p {
      margin-top: 0 !important;
      margin-bottom: 8px !important;
    }
    p:last-child {
      margin-bottom: 0 !important;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0 !important;
      margin-bottom: 8px !important;
    }
    h1:last-child, h2:last-child, h3:last-child, h4:last-child, h5:last-child, h6:last-child {
      margin-bottom: 0 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <center style="width: 100%; background-color: #f3f4f6; padding: 40px 0;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width: 600px;">
      <tr>
        <td style="padding: 0;">
    <![endif]-->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border-collapse: separate;">
      <tr>
        <td style="padding: 0; text-align: left;">
          ${blocksHtml}
        </td>
      </tr>
    </table>
    <!--[if mso | IE]>
        </td>
      </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
}
