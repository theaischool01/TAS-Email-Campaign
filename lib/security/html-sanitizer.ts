import sanitizeHtml from "sanitize-html";

/**
 * Strict regex to block dangerous CSS values like expression() or javascript:/data:/vbscript: protocols.
 */
const safeStyleValueRegex = /^(?!.*(expression|javascript:|data:|vbscript:)).*$/i;

/**
 * Sanitizes raw HTML template content to prevent Stored XSS.
 * This is designed for email templates and preserves safe layout, styles, and markup.
 */
export function sanitizeEmailHTML(html: string): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: [
      "table", "tbody", "thead", "tfoot", "tr", "td", "th",
      "div", "span", "p",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "br", "hr",
      "ul", "ol", "li",
      "img", "a", "button",
      "strong", "em", "style"
    ],
    allowedAttributes: {
      "*": ["style", "class", "id"],
      "img": ["src", "alt", "width", "height"],
      "a": ["href", "target", "rel"],
      "button": ["type"],
      "table": ["width", "height", "align", "bgcolor", "border", "cellpadding", "cellspacing"],
      "tr": ["align", "valign", "bgcolor"],
      "td": ["align", "valign", "width", "height", "bgcolor", "colspan", "rowspan"],
      "th": ["align", "valign", "width", "height", "bgcolor", "colspan", "rowspan"]
    },
    // We explicitly remove script, iframe, object, embed, form, input, textarea, video, audio tags.
    // sanitize-html discards any tags not explicitly listed in allowedTags by default.
    
    // Protocols allowed for links and sources:
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    
    // CSS sanitization rules:
    allowedStyles: {
      "*": {
        "color": [safeStyleValueRegex],
        "background": [safeStyleValueRegex],
        "background-color": [safeStyleValueRegex],
        "background-image": [safeStyleValueRegex],
        "background-position": [safeStyleValueRegex],
        "background-repeat": [safeStyleValueRegex],
        "background-size": [safeStyleValueRegex],
        "font": [safeStyleValueRegex],
        "font-size": [safeStyleValueRegex],
        "font-family": [safeStyleValueRegex],
        "font-weight": [safeStyleValueRegex],
        "font-style": [safeStyleValueRegex],
        "line-height": [safeStyleValueRegex],
        "margin": [safeStyleValueRegex],
        "margin-top": [safeStyleValueRegex],
        "margin-bottom": [safeStyleValueRegex],
        "margin-left": [safeStyleValueRegex],
        "margin-right": [safeStyleValueRegex],
        "padding": [safeStyleValueRegex],
        "padding-top": [safeStyleValueRegex],
        "padding-bottom": [safeStyleValueRegex],
        "padding-left": [safeStyleValueRegex],
        "padding-right": [safeStyleValueRegex],
        "text-align": [safeStyleValueRegex],
        "text-decoration": [safeStyleValueRegex],
        "text-transform": [safeStyleValueRegex],
        "letter-spacing": [safeStyleValueRegex],
        "border": [safeStyleValueRegex],
        "border-top": [safeStyleValueRegex],
        "border-bottom": [safeStyleValueRegex],
        "border-left": [safeStyleValueRegex],
        "border-right": [safeStyleValueRegex],
        "border-color": [safeStyleValueRegex],
        "border-style": [safeStyleValueRegex],
        "border-width": [safeStyleValueRegex],
        "border-radius": [safeStyleValueRegex],
        "width": [safeStyleValueRegex],
        "height": [safeStyleValueRegex],
        "max-width": [safeStyleValueRegex],
        "max-height": [safeStyleValueRegex],
        "min-width": [safeStyleValueRegex],
        "min-height": [safeStyleValueRegex],
        "display": [safeStyleValueRegex],
        "flex": [safeStyleValueRegex],
        "flex-direction": [safeStyleValueRegex],
        "justify-content": [safeStyleValueRegex],
        "align-items": [safeStyleValueRegex],
        "flex-wrap": [safeStyleValueRegex],
        "flex-grow": [safeStyleValueRegex],
        "flex-shrink": [safeStyleValueRegex],
        "flex-basis": [safeStyleValueRegex],
        "grid-template-columns": [safeStyleValueRegex],
        "grid-gap": [safeStyleValueRegex],
        "gap": [safeStyleValueRegex],
        "box-sizing": [safeStyleValueRegex],
        "overflow": [safeStyleValueRegex],
        "vertical-align": [safeStyleValueRegex],
        "opacity": [safeStyleValueRegex],
        "float": [safeStyleValueRegex],
        "clear": [safeStyleValueRegex]
      }
    }
  });
}
