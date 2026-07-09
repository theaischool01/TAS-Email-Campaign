(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Slot$3e$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript) <export * as Slot>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
            outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
            ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
            destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
            xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
            sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
            lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
            icon: "size-8",
            "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
            "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
            "icon-lg": "size-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Slot$3e$__["Slot"].Root : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        "data-variant": variant,
        "data-size": size,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/security/html-sanitizer.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sanitizeEmailHTML",
    ()=>sanitizeEmailHTML
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sanitize$2d$html$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sanitize-html/index.js [app-client] (ecmascript)");
;
/**
 * Strict regex to block dangerous CSS values like expression() or javascript:/data:/vbscript: protocols.
 */ const safeStyleValueRegex = /^(?!.*(expression|javascript:|data:|vbscript:)).*$/i;
function sanitizeEmailHTML(html) {
    if (!html) return "";
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sanitize$2d$html$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(html, {
        allowedTags: [
            "table",
            "tbody",
            "thead",
            "tfoot",
            "tr",
            "td",
            "th",
            "div",
            "span",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "br",
            "hr",
            "ul",
            "ol",
            "li",
            "img",
            "a",
            "button",
            "strong",
            "em",
            "style"
        ],
        allowedAttributes: {
            "*": [
                "style",
                "class",
                "id"
            ],
            "img": [
                "src",
                "alt",
                "width",
                "height"
            ],
            "a": [
                "href",
                "target",
                "rel"
            ],
            "button": [
                "type"
            ],
            "table": [
                "width",
                "height",
                "align",
                "bgcolor",
                "border",
                "cellpadding",
                "cellspacing"
            ],
            "tr": [
                "align",
                "valign",
                "bgcolor"
            ],
            "td": [
                "align",
                "valign",
                "width",
                "height",
                "bgcolor",
                "colspan",
                "rowspan"
            ],
            "th": [
                "align",
                "valign",
                "width",
                "height",
                "bgcolor",
                "colspan",
                "rowspan"
            ]
        },
        // We explicitly remove script, iframe, object, embed, form, input, textarea, video, audio tags.
        // sanitize-html discards any tags not explicitly listed in allowedTags by default.
        // Protocols allowed for links and sources:
        allowedSchemes: [
            "http",
            "https",
            "mailto",
            "tel"
        ],
        allowedSchemesAppliedToAttributes: [
            "href",
            "src"
        ],
        // CSS sanitization rules:
        allowedStyles: {
            "*": {
                "color": [
                    safeStyleValueRegex
                ],
                "background": [
                    safeStyleValueRegex
                ],
                "background-color": [
                    safeStyleValueRegex
                ],
                "background-image": [
                    safeStyleValueRegex
                ],
                "background-position": [
                    safeStyleValueRegex
                ],
                "background-repeat": [
                    safeStyleValueRegex
                ],
                "background-size": [
                    safeStyleValueRegex
                ],
                "font": [
                    safeStyleValueRegex
                ],
                "font-size": [
                    safeStyleValueRegex
                ],
                "font-family": [
                    safeStyleValueRegex
                ],
                "font-weight": [
                    safeStyleValueRegex
                ],
                "font-style": [
                    safeStyleValueRegex
                ],
                "line-height": [
                    safeStyleValueRegex
                ],
                "margin": [
                    safeStyleValueRegex
                ],
                "margin-top": [
                    safeStyleValueRegex
                ],
                "margin-bottom": [
                    safeStyleValueRegex
                ],
                "margin-left": [
                    safeStyleValueRegex
                ],
                "margin-right": [
                    safeStyleValueRegex
                ],
                "padding": [
                    safeStyleValueRegex
                ],
                "padding-top": [
                    safeStyleValueRegex
                ],
                "padding-bottom": [
                    safeStyleValueRegex
                ],
                "padding-left": [
                    safeStyleValueRegex
                ],
                "padding-right": [
                    safeStyleValueRegex
                ],
                "text-align": [
                    safeStyleValueRegex
                ],
                "text-decoration": [
                    safeStyleValueRegex
                ],
                "text-transform": [
                    safeStyleValueRegex
                ],
                "letter-spacing": [
                    safeStyleValueRegex
                ],
                "border": [
                    safeStyleValueRegex
                ],
                "border-top": [
                    safeStyleValueRegex
                ],
                "border-bottom": [
                    safeStyleValueRegex
                ],
                "border-left": [
                    safeStyleValueRegex
                ],
                "border-right": [
                    safeStyleValueRegex
                ],
                "border-color": [
                    safeStyleValueRegex
                ],
                "border-style": [
                    safeStyleValueRegex
                ],
                "border-width": [
                    safeStyleValueRegex
                ],
                "border-radius": [
                    safeStyleValueRegex
                ],
                "width": [
                    safeStyleValueRegex
                ],
                "height": [
                    safeStyleValueRegex
                ],
                "max-width": [
                    safeStyleValueRegex
                ],
                "max-height": [
                    safeStyleValueRegex
                ],
                "min-width": [
                    safeStyleValueRegex
                ],
                "min-height": [
                    safeStyleValueRegex
                ],
                "display": [
                    safeStyleValueRegex
                ],
                "flex": [
                    safeStyleValueRegex
                ],
                "flex-direction": [
                    safeStyleValueRegex
                ],
                "justify-content": [
                    safeStyleValueRegex
                ],
                "align-items": [
                    safeStyleValueRegex
                ],
                "flex-wrap": [
                    safeStyleValueRegex
                ],
                "flex-grow": [
                    safeStyleValueRegex
                ],
                "flex-shrink": [
                    safeStyleValueRegex
                ],
                "flex-basis": [
                    safeStyleValueRegex
                ],
                "grid-template-columns": [
                    safeStyleValueRegex
                ],
                "grid-gap": [
                    safeStyleValueRegex
                ],
                "gap": [
                    safeStyleValueRegex
                ],
                "box-sizing": [
                    safeStyleValueRegex
                ],
                "overflow": [
                    safeStyleValueRegex
                ],
                "vertical-align": [
                    safeStyleValueRegex
                ],
                "opacity": [
                    safeStyleValueRegex
                ],
                "float": [
                    safeStyleValueRegex
                ],
                "clear": [
                    safeStyleValueRegex
                ]
            }
        }
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/templates/registry/merge-tags.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SYSTEM_MERGE_TAGS",
    ()=>SYSTEM_MERGE_TAGS
]);
const SYSTEM_MERGE_TAGS = [
    {
        id: "personal",
        label: "Personal Information",
        tags: [
            {
                label: "First Name",
                value: "{{first_name}}",
                description: "Recipient's first name"
            },
            {
                label: "Last Name",
                value: "{{last_name}}",
                description: "Recipient's last name"
            },
            {
                label: "Email Address",
                value: "{{email}}",
                description: "Recipient's email address"
            },
            {
                label: "Company",
                value: "{{company}}",
                description: "Recipient's company name"
            },
            {
                label: "Phone Number",
                value: "{{phone}}",
                description: "Recipient's phone number"
            },
            {
                label: "City",
                value: "{{city}}",
                description: "Recipient's city"
            }
        ]
    },
    {
        id: "campaign",
        label: "Campaign Details",
        tags: [
            {
                label: "Campaign Name",
                value: "{{campaign_name}}",
                description: "The name of this campaign"
            },
            {
                label: "Subject Line",
                value: "{{subject}}",
                description: "The subject line of this email"
            },
            {
                label: "Current Date",
                value: "{{current_date}}",
                description: "The date of sending"
            }
        ]
    },
    {
        id: "links",
        label: "Links & Toggles",
        tags: [
            {
                label: "Unsubscribe URL",
                value: "{{unsubscribe_url}}",
                description: "Unsubscribe link (required)"
            },
            {
                label: "View Online URL",
                value: "{{view_online}}",
                description: "Link to view the email in a browser"
            }
        ]
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/templates/VariablePicker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VariablePicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/history.mjs [app-client] (ecmascript) <export default as History>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/folder-open.mjs [app-client] (ecmascript) <export default as FolderOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$templates$2f$registry$2f$merge$2d$tags$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/templates/registry/merge-tags.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function VariablePicker({ onSelect, onClose }) {
    _s();
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$templates$2f$registry$2f$merge$2d$tags$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SYSTEM_MERGE_TAGS"]);
    const [recentTags, setRecentTags] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // 1. Fetch Dynamic Custom Fields & Load Recent Tags
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VariablePicker.useEffect": ()=>{
            async function fetchCustomFields() {
                try {
                    const response = await fetch("/api/contacts/custom-fields");
                    if (response.ok) {
                        const fields = await response.json();
                        if (Array.isArray(fields) && fields.length > 0) {
                            const customCategory = {
                                id: "custom",
                                label: "Custom Fields",
                                tags: fields.map({
                                    "VariablePicker.useEffect.fetchCustomFields": (f)=>({
                                            label: f.displayName || f.key,
                                            value: `{{${f.key}}}`,
                                            description: `Custom field: ${f.type}`
                                        })
                                }["VariablePicker.useEffect.fetchCustomFields"])
                            };
                            setCategories([
                                ...__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$templates$2f$registry$2f$merge$2d$tags$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SYSTEM_MERGE_TAGS"],
                                customCategory
                            ]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch custom fields for VariablePicker:", err);
                }
            }
            fetchCustomFields();
            // Load recent tags from localStorage
            try {
                const stored = localStorage.getItem("mailflow_recent_merge_tags");
                if (stored) {
                    setRecentTags(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to load recent tags:", e);
            }
        }
    }["VariablePicker.useEffect"], []);
    // 2. Click Outside & Keyboard Listeners
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VariablePicker.useEffect": ()=>{
            function handleOutsideClick(e) {
                if (containerRef.current && !containerRef.current.contains(e.target)) {
                    onClose();
                }
            }
            function handleKeyDown(e) {
                if (e.key === "Escape") {
                    onClose();
                }
            }
            document.addEventListener("mousedown", handleOutsideClick);
            document.addEventListener("keydown", handleKeyDown);
            return ({
                "VariablePicker.useEffect": ()=>{
                    document.removeEventListener("mousedown", handleOutsideClick);
                    document.removeEventListener("keydown", handleKeyDown);
                }
            })["VariablePicker.useEffect"];
        }
    }["VariablePicker.useEffect"], [
        onClose
    ]);
    // 3. Handle Select
    const handleSelectTag = (tag)=>{
        onSelect(tag.value);
        // Save to recents
        const updatedRecents = [
            tag,
            ...recentTags.filter((r)=>r.value !== tag.value)
        ].slice(0, 5) // Keep top 5
        ;
        setRecentTags(updatedRecents);
        try {
            localStorage.setItem("mailflow_recent_merge_tags", JSON.stringify(updatedRecents));
        } catch (e) {
            console.error(e);
        }
        onClose();
    };
    // 4. Search Filter
    const filteredCategories = categories.map((cat)=>{
        const matchingTags = cat.tags.filter((t)=>t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase()));
        return {
            ...cat,
            tags: matchingTags
        };
    }).filter((cat)=>cat.tags.length > 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] flex flex-col overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150",
        style: {
            top: "100%"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50/50 shrink-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                        className: "h-3.5 w-3.5 text-slate-400 ml-1 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/components/templates/VariablePicker.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: search,
                        onChange: (e)=>setSearch(e.target.value),
                        placeholder: "Search variables...",
                        className: "w-full bg-transparent border-none text-xs focus:ring-0 focus:outline-none placeholder-slate-400 py-0.5 px-0 h-6",
                        autoFocus: true
                    }, void 0, false, {
                        fileName: "[project]/components/templates/VariablePicker.tsx",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this),
                    search && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setSearch(""),
                        className: "p-0.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            className: "h-3 w-3"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/VariablePicker.tsx",
                            lineNumber: 132,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/VariablePicker.tsx",
                        lineNumber: 128,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/templates/VariablePicker.tsx",
                lineNumber: 117,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto max-h-60 p-2 space-y-3",
                children: [
                    recentTags.length > 0 && !search && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1 px-2 mb-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {
                                        className: "h-3 w-3 text-slate-400"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/VariablePicker.tsx",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[9px] font-bold text-slate-400 uppercase tracking-wider",
                                        children: "Recently Used"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/VariablePicker.tsx",
                                        lineNumber: 144,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/templates/VariablePicker.tsx",
                                lineNumber: 142,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-0.5",
                                children: recentTags.map((tag)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>handleSelectTag(tag),
                                        className: "w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-xs flex flex-col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-slate-700",
                                                children: tag.label
                                            }, void 0, false, {
                                                fileName: "[project]/components/templates/VariablePicker.tsx",
                                                lineNumber: 154,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                className: "text-[10px] text-blue-600 font-mono mt-0.5",
                                                children: tag.value
                                            }, void 0, false, {
                                                fileName: "[project]/components/templates/VariablePicker.tsx",
                                                lineNumber: 155,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, tag.value, true, {
                                        fileName: "[project]/components/templates/VariablePicker.tsx",
                                        lineNumber: 148,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/templates/VariablePicker.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/templates/VariablePicker.tsx",
                        lineNumber: 141,
                        columnNumber: 11
                    }, this),
                    filteredCategories.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-6 text-slate-400 text-xs",
                        children: "No variables found"
                    }, void 0, false, {
                        fileName: "[project]/components/templates/VariablePicker.tsx",
                        lineNumber: 164,
                        columnNumber: 11
                    }, this) : filteredCategories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-1 px-2 mb-1.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__["FolderOpen"], {
                                            className: "h-3 w-3 text-slate-400"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/VariablePicker.tsx",
                                            lineNumber: 171,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[9px] font-bold text-slate-400 uppercase tracking-wider",
                                            children: cat.label
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/VariablePicker.tsx",
                                            lineNumber: 172,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/templates/VariablePicker.tsx",
                                    lineNumber: 170,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-0.5",
                                    children: cat.tags.map((tag)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>handleSelectTag(tag),
                                            className: "w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-xs flex flex-col group",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-semibold text-slate-750 group-hover:text-blue-600 transition-colors",
                                                    children: tag.label
                                                }, void 0, false, {
                                                    fileName: "[project]/components/templates/VariablePicker.tsx",
                                                    lineNumber: 182,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                    className: "text-[10px] text-blue-500 font-mono mt-0.5",
                                                    children: tag.value
                                                }, void 0, false, {
                                                    fileName: "[project]/components/templates/VariablePicker.tsx",
                                                    lineNumber: 183,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, tag.value, true, {
                                            fileName: "[project]/components/templates/VariablePicker.tsx",
                                            lineNumber: 176,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/VariablePicker.tsx",
                                    lineNumber: 174,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, cat.id, true, {
                            fileName: "[project]/components/templates/VariablePicker.tsx",
                            lineNumber: 169,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/components/templates/VariablePicker.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/templates/VariablePicker.tsx",
        lineNumber: 111,
        columnNumber: 5
    }, this);
}
_s(VariablePicker, "PRIirxI6Hf33m77GORdu5AYeJEk=");
_c = VariablePicker;
var _c;
__turbopack_context__.k.register(_c, "VariablePicker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/uploadthing.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uploadFiles",
    ()=>uploadFiles,
    "useUploadThing",
    ()=>useUploadThing
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$uploadthing$2f$react$2f$dist$2f$use$2d$uploadthing$2d$pxkJ3LFs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@uploadthing/react/dist/use-uploadthing-pxkJ3LFs.js [app-client] (ecmascript)");
;
const { useUploadThing, uploadFiles } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$uploadthing$2f$react$2f$dist$2f$use$2d$uploadthing$2d$pxkJ3LFs$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateReactHelpers"])();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/templates/CanvasEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CanvasEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grip-vertical.mjs [app-client] (ecmascript) <export default as GripVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$pen$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square-pen.mjs [app-client] (ecmascript) <export default as Edit>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.mjs [app-client] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.mjs [app-client] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/link-2.mjs [app-client] (ecmascript) <export default as Link2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.mjs [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.mjs [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bold$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bold$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bold.mjs [app-client] (ecmascript) <export default as Bold>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$italic$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Italic$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/italic.mjs [app-client] (ecmascript) <export default as Italic>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$underline$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Underline$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/underline.mjs [app-client] (ecmascript) <export default as Underline>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$start$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/text-align-start.mjs [app-client] (ecmascript) <export default as AlignLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$center$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignCenter$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/text-align-center.mjs [app-client] (ecmascript) <export default as AlignCenter>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$end$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/text-align-end.mjs [app-client] (ecmascript) <export default as AlignRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/list.mjs [app-client] (ecmascript) <export default as List>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2d$ordered$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ListOrdered$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/list-ordered.mjs [app-client] (ecmascript) <export default as ListOrdered>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2f$html$2d$sanitizer$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/security/html-sanitizer.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$templates$2f$VariablePicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/templates/VariablePicker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uploadthing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/uploadthing.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/react/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$starter$2d$kit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/starter-kit/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$underline$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-underline/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$link$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-link/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$text$2d$align$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-text-align/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$placeholder$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-placeholder/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$text$2d$style$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-text-style/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$color$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-color/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$font$2d$family$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/extension-font-family/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tiptap/core/dist/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const FontSize = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Extension"].create({
    name: 'fontSize',
    addOptions () {
        return {
            types: [
                'textStyle'
            ]
        };
    },
    addGlobalAttributes () {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element)=>element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: (attributes)=>{
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`
                            };
                        }
                    }
                }
            }
        ];
    }
});
// ─── Resize handle cursor map ───────────────────────────────────────────────
const HANDLE_CURSORS = {
    'tl': 'nw-resize',
    'tr': 'ne-resize',
    'bl': 'sw-resize',
    'br': 'se-resize'
};
const MERGE_TAGS = [
    {
        tag: "first_name",
        label: "First Name",
        description: "Contact's first name"
    },
    {
        tag: "last_name",
        label: "Last Name",
        description: "Contact's last name"
    },
    {
        tag: "email",
        label: "Email",
        description: "Contact's email address"
    },
    {
        tag: "company",
        label: "Company",
        description: "Contact's company"
    },
    {
        tag: "phone",
        label: "Phone",
        description: "Contact's phone number"
    },
    {
        tag: "city",
        label: "City",
        description: "Contact's city"
    },
    {
        tag: "country",
        label: "Country",
        description: "Contact's country"
    },
    {
        tag: "unsubscribe",
        label: "Unsubscribe Link",
        description: "Unsubscribe URL placeholder"
    },
    {
        tag: "view_in_browser",
        label: "View in Browser",
        description: "Web version link placeholder"
    }
];
function ImageBlock({ block, isSelected, onUpdateBlock, onSelectBlock }) {
    _s();
    const imgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const wrapperRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const resizeState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        active: false,
        handle: '',
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        aspectRatio: 1
    });
    // Compute display dimensions
    const imgWidth = block.content?.widthUnit === 'px' ? (block.content?.width ?? 300) + 'px' : (block.content?.width ?? 100) + '%';
    const imgHeight = !block.content?.height || block.content?.height === 'auto' ? 'auto' : block.content.height + 'px';
    const alignment = block.content?.alignment || 'center';
    // ── Capture aspect ratio on image load ───────────────────────────────────
    const handleImgLoad = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ImageBlock.useCallback[handleImgLoad]": ()=>{
            const img = imgRef.current;
            if (img && img.naturalWidth && img.naturalHeight) {
                resizeState.current.aspectRatio = img.naturalWidth / img.naturalHeight;
            }
        }
    }["ImageBlock.useCallback[handleImgLoad]"], []);
    // ── Mouse event handlers ─────────────────────────────────────────────────
    const startResize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ImageBlock.useCallback[startResize]": (e, handle)=>{
            e.preventDefault();
            e.stopPropagation();
            // Read aspect ratio from natural size; fallback to stored or 2:1
            const img = imgRef.current;
            const ar = img && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : resizeState.current.aspectRatio || 2;
            // Current rendered dimensions
            const currentPxWidth = img ? img.getBoundingClientRect().width : block.content?.width ?? 300;
            const currentPxHeight = img ? img.getBoundingClientRect().height : block.content?.height || 150;
            resizeState.current = {
                active: true,
                handle,
                startX: e.clientX,
                startY: e.clientY,
                startWidth: currentPxWidth,
                startHeight: currentPxHeight,
                aspectRatio: ar
            };
        }
    }["ImageBlock.useCallback[startResize]"], [
        block.content?.width,
        block.content?.height
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ImageBlock.useEffect": ()=>{
            const onMouseMove = {
                "ImageBlock.useEffect.onMouseMove": (e)=>{
                    if (!resizeState.current.active) return;
                    const { handle, startX, startY, startWidth, startHeight, aspectRatio } = resizeState.current;
                    if (handle === 'l' || handle === 'r') {
                        const deltaX = handle === 'l' ? startX - e.clientX : e.clientX - startX;
                        const newWidth = Math.min(600, Math.max(50, startWidth + deltaX));
                        if (imgRef.current) {
                            imgRef.current.style.width = newWidth + 'px';
                        }
                    } else if (handle === 't' || handle === 'b') {
                        const deltaY = handle === 't' ? startY - e.clientY : e.clientY - startY;
                        const newHeight = Math.max(30, startHeight + deltaY);
                        if (imgRef.current) {
                            imgRef.current.style.height = newHeight + 'px';
                        }
                    } else {
                        const deltaX = handle === 'tl' || handle === 'bl' ? startX - e.clientX : e.clientX - startX;
                        const newWidth = Math.min(600, Math.max(50, startWidth + deltaX));
                        const newHeight = Math.round(newWidth / aspectRatio);
                        if (imgRef.current) {
                            imgRef.current.style.width = newWidth + 'px';
                            imgRef.current.style.height = newHeight + 'px';
                        }
                    }
                }
            }["ImageBlock.useEffect.onMouseMove"];
            const onMouseUp = {
                "ImageBlock.useEffect.onMouseUp": (e)=>{
                    if (!resizeState.current.active) return;
                    const { handle, startX, startY, startWidth, startHeight, aspectRatio } = resizeState.current;
                    resizeState.current.active = false;
                    let finalWidth = startWidth;
                    let finalHeight = startHeight;
                    if (handle === 'l' || handle === 'r') {
                        const deltaX = handle === 'l' ? startX - e.clientX : e.clientX - startX;
                        finalWidth = Math.min(600, Math.max(50, startWidth + deltaX));
                        finalHeight = block.content?.height || 'auto';
                    } else if (handle === 't' || handle === 'b') {
                        const deltaY = handle === 't' ? startY - e.clientY : e.clientY - startY;
                        finalHeight = Math.max(30, startHeight + deltaY);
                        finalWidth = block.content?.width ?? 300;
                    } else {
                        const deltaX = handle === 'tl' || handle === 'bl' ? startX - e.clientX : e.clientX - startX;
                        finalWidth = Math.min(600, Math.max(50, startWidth + deltaX));
                        finalHeight = Math.round(finalWidth / aspectRatio);
                    }
                    onUpdateBlock(block.id, {
                        content: {
                            ...block.content,
                            width: Math.round(finalWidth),
                            widthUnit: 'px',
                            height: finalHeight === 'auto' ? 'auto' : Math.round(finalHeight)
                        }
                    });
                }
            }["ImageBlock.useEffect.onMouseUp"];
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            return ({
                "ImageBlock.useEffect": ()=>{
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
            })["ImageBlock.useEffect"];
        }
    }["ImageBlock.useEffect"], [
        block.id,
        block.content,
        onUpdateBlock
    ]);
    // ── Handle style ─────────────────────────────────────────────────────────
    const handleStyle = (position, cursor)=>({
            position: 'absolute',
            width: '10px',
            height: '10px',
            backgroundColor: '#ffffff',
            border: '2px solid #6366f1',
            borderRadius: '2px',
            cursor,
            zIndex: 20,
            ...position
        });
    // ── Alignment button style ───────────────────────────────────────────────
    const alignBtnStyle = (active)=>({
            padding: '2px 7px',
            fontSize: '11px',
            fontWeight: 600,
            border: '1px solid #6366f1',
            borderRadius: '3px',
            backgroundColor: active ? '#6366f1' : '#ffffff',
            color: active ? '#ffffff' : '#6366f1',
            cursor: 'pointer',
            lineHeight: 1.4
        });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: wrapperRef,
        style: {
            padding: '20px',
            textAlign: alignment,
            position: 'relative',
            userSelect: 'none',
            ...block.styles
        },
        onClick: (e)=>{
            e.stopPropagation();
            onSelectBlock(block);
        },
        children: [
            isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '5px',
                    padding: '3px 5px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    zIndex: 30
                },
                onMouseDown: (e)=>e.stopPropagation(),
                onClick: (e)=>e.stopPropagation(),
                children: [
                    [
                        'left',
                        'center',
                        'right'
                    ].map((dir)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            style: alignBtnStyle(alignment === dir),
                            onMouseDown: (e)=>e.stopPropagation(),
                            onClick: (e)=>{
                                e.stopPropagation();
                                onUpdateBlock(block.id, {
                                    content: {
                                        ...block.content,
                                        alignment: dir
                                    }
                                });
                            },
                            title: dir.charAt(0).toUpperCase() + dir.slice(1),
                            children: dir === 'left' ? '⬡ L' : dir === 'center' ? '⬡ C' : '⬡ R'
                        }, dir, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            borderLeft: '1px solid #e5e7eb',
                            margin: '0 2px'
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 293,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: '10px',
                            color: '#9ca3af',
                            alignSelf: 'center',
                            whiteSpace: 'nowrap'
                        },
                        children: "Drag corners to resize"
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 294,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/templates/CanvasEditor.tsx",
                lineNumber: 261,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'relative',
                    display: 'inline-block',
                    marginTop: isSelected ? '28px' : '0'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        ref: imgRef,
                        src: block.content?.src || 'https://via.placeholder.com/600x300',
                        alt: block.content?.alt || '',
                        onLoad: handleImgLoad,
                        draggable: false,
                        style: {
                            width: imgWidth,
                            height: imgHeight,
                            maxWidth: '100%',
                            borderRadius: block.styles?.borderRadius || '8px',
                            boxShadow: block.styles?.boxShadow || 'none',
                            border: block.styles?.border || 'none',
                            display: 'block',
                            pointerEvents: 'none'
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 302,
                        columnNumber: 9
                    }, this),
                    isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    top: '-5px',
                                    left: '-5px'
                                }, HANDLE_CURSORS['tl']),
                                onMouseDown: (e)=>startResize(e, 'tl')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 324,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    top: '-5px',
                                    right: '-5px'
                                }, HANDLE_CURSORS['tr']),
                                onMouseDown: (e)=>startResize(e, 'tr')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 328,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    bottom: '-5px',
                                    left: '-5px'
                                }, HANDLE_CURSORS['bl']),
                                onMouseDown: (e)=>startResize(e, 'bl')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 332,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    bottom: '-5px',
                                    right: '-5px'
                                }, HANDLE_CURSORS['br']),
                                onMouseDown: (e)=>startResize(e, 'br')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 336,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    top: '-5px',
                                    left: 'calc(50% - 5px)'
                                }, 'n-resize'),
                                onMouseDown: (e)=>startResize(e, 't')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 341,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    bottom: '-5px',
                                    left: 'calc(50% - 5px)'
                                }, 's-resize'),
                                onMouseDown: (e)=>startResize(e, 'b')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 345,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: handleStyle({
                                    top: 'calc(50% - 5px)',
                                    right: '-5px'
                                }, 'e-resize'),
                                onMouseDown: (e)=>startResize(e, 'r')
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 349,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/components/templates/CanvasEditor.tsx",
                lineNumber: 301,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/templates/CanvasEditor.tsx",
        lineNumber: 254,
        columnNumber: 5
    }, this);
}
_s(ImageBlock, "pquT4+DqR0vWY/6TGGIgHQn1tuk=");
_c = ImageBlock;
function CanvasEditor({ blocks, selectedBlock, previewMode, onSelectBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, onDuplicateBlock, onAddBlock, onSave, onEditorInit }) {
    _s1();
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [draggedBlockId, setDraggedBlockId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [canvasPickerOpen, setCanvasPickerOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dragOverActive, setDragOverActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editingBlockId, setEditingBlockId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeEditField, setActiveEditField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Autocomplete popup states
    const [autocomplete, setAutocomplete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectIndex, setSelectIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [toolbarDropdownOpen, setToolbarDropdownOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Keep a mutable ref of autocomplete state so keyboard handler can see freshest values
    const autocompleteRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(autocomplete);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CanvasEditor.useEffect": ()=>{
            autocompleteRef.current = autocomplete;
        }
    }["CanvasEditor.useEffect"], [
        autocomplete
    ]);
    // Get matching tags for popup suggestions
    const getFilteredSuggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CanvasEditor.useCallback[getFilteredSuggestions]": ()=>{
            if (!autocomplete) return [];
            const q = autocomplete.query.toLowerCase();
            return MERGE_TAGS.filter({
                "CanvasEditor.useCallback[getFilteredSuggestions]": (item)=>item.tag.toLowerCase().includes(q) || item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
            }["CanvasEditor.useCallback[getFilteredSuggestions]"]);
        }
    }["CanvasEditor.useCallback[getFilteredSuggestions]"], [
        autocomplete
    ]);
    const insertMergeTagValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CanvasEditor.useCallback[insertMergeTagValue]": (tag)=>{
            if (!editor || !autocompleteRef.current) return;
            const { triggerPos } = autocompleteRef.current;
            const cursor = editor.state.selection.from;
            // Replace trigger sequence + query characters with merge tag
            editor.commands.deleteRange({
                from: triggerPos,
                to: cursor
            });
            editor.commands.insertContent(`{{${tag}}}`);
            // Clean up autocomplete popup states
            setAutocomplete(null);
            setSelectIndex(0);
            // Focus back to editor cursor position
            setTimeout({
                "CanvasEditor.useCallback[insertMergeTagValue]": ()=>{
                    editor.commands.focus();
                }
            }["CanvasEditor.useCallback[insertMergeTagValue]"], 10);
        }
    }["CanvasEditor.useCallback[insertMergeTagValue]"], [
        editor
    ]);
    const editor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useEditor"])({
        extensions: [
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$starter$2d$kit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$underline$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$text$2d$style$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextStyle"],
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$text$2d$style$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"],
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$text$2d$style$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FontFamily"],
            FontSize,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$link$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].configure({
                openOnClick: false
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$text$2d$align$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].configure({
                types: [
                    'heading',
                    'paragraph'
                ]
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$extension$2d$placeholder$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].configure({
                placeholder: 'Start typing...'
            })
        ],
        content: '',
        onCreate: {
            "CanvasEditor.useEditor[editor]": ({ editor })=>{
                onEditorInit?.(editor);
            }
        }["CanvasEditor.useEditor[editor]"],
        editorProps: {
            handleKeyDown: {
                "CanvasEditor.useEditor[editor]": (view, event)=>{
                    const currentAutocomplete = autocompleteRef.current;
                    if (currentAutocomplete && currentAutocomplete.active) {
                        const suggestions = MERGE_TAGS.filter({
                            "CanvasEditor.useEditor[editor].suggestions": (item)=>{
                                const q = currentAutocomplete.query.toLowerCase();
                                return item.tag.toLowerCase().includes(q) || item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
                            }
                        }["CanvasEditor.useEditor[editor].suggestions"]);
                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setSelectIndex({
                                "CanvasEditor.useEditor[editor]": (prev)=>(prev + 1) % (suggestions.length || 1)
                            }["CanvasEditor.useEditor[editor]"]);
                            return true;
                        }
                        if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setSelectIndex({
                                "CanvasEditor.useEditor[editor]": (prev)=>(prev - 1 + (suggestions.length || 1)) % (suggestions.length || 1)
                            }["CanvasEditor.useEditor[editor]"]);
                            return true;
                        }
                        if (event.key === 'Enter' || event.key === 'Tab') {
                            event.preventDefault();
                            if (suggestions[selectIndex]) {
                                insertMergeTagValue(suggestions[selectIndex].tag);
                            }
                            return true;
                        }
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            setAutocomplete(null);
                            return true;
                        }
                    }
                    return false;
                }
            }["CanvasEditor.useEditor[editor]"]
        },
        onUpdate: {
            "CanvasEditor.useEditor[editor]": ({ editor })=>{
                const activeId = activeEditField?.blockId || editingBlockId;
                const activeField = activeEditField?.field || 'text';
                if (activeId) {
                    // Sync tiptap HTML state to builder block content
                    onUpdateBlock(activeId, {
                        content: {
                            ...blocks.find({
                                "CanvasEditor.useEditor[editor]": (b)=>b.id === activeId
                            }["CanvasEditor.useEditor[editor]"])?.content,
                            [activeField]: editor.getHTML()
                        }
                    });
                    // Detect merge tag trigger insertion typing states
                    const cursor = editor.state.selection.from;
                    const textBefore = editor.state.doc.textBetween(Math.max(0, cursor - 20), cursor);
                    let triggered = false;
                    let triggerChar = "";
                    let triggerPos = -1;
                    if (textBefore.endsWith("{{")) {
                        triggered = true;
                        triggerChar = "{{";
                        triggerPos = cursor - 2;
                    } else if (textBefore.endsWith("{")) {
                        // Check we are not triggered by a double opening braces
                        if (!textBefore.endsWith("{{")) {
                            triggered = true;
                            triggerChar = "{";
                            triggerPos = cursor - 1;
                        }
                    } else if (textBefore.endsWith("/merge")) {
                        triggered = true;
                        triggerChar = "/merge";
                        triggerPos = cursor - 6;
                    } else if (textBefore.endsWith("/tag")) {
                        triggered = true;
                        triggerChar = "/tag";
                        triggerPos = cursor - 4;
                    }
                    if (triggered) {
                        const coords = editor.view.coordsAtPos(cursor);
                        const parentRect = editor.view.dom.getBoundingClientRect();
                        setAutocomplete({
                            active: true,
                            query: '',
                            triggerPos,
                            triggerChar,
                            coords: {
                                top: coords.bottom - parentRect.top + editor.view.dom.parentElement.scrollTop + 8,
                                left: coords.left - parentRect.left
                            }
                        });
                        setSelectIndex(0);
                    } else {
                        // If autocomplete popup active, update current query search filter dynamically
                        const currentAutocomplete = autocompleteRef.current;
                        if (currentAutocomplete && currentAutocomplete.active) {
                            if (cursor < currentAutocomplete.triggerPos) {
                                setAutocomplete(null);
                            } else {
                                const currentQuery = editor.state.doc.textBetween(currentAutocomplete.triggerPos + currentAutocomplete.triggerChar.length, cursor);
                                if (currentQuery.includes(' ')) {
                                    setAutocomplete(null);
                                } else {
                                    setAutocomplete({
                                        ...currentAutocomplete,
                                        query: currentQuery
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }["CanvasEditor.useEditor[editor]"]
    });
    // Propagate editor state back to parent when editor instance or active block changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CanvasEditor.useEffect": ()=>{
            if (editor) {
                onEditorInit?.(editor);
            }
            return ({
                "CanvasEditor.useEffect": ()=>{
                    onEditorInit?.(null);
                }
            })["CanvasEditor.useEffect"];
        }
    }["CanvasEditor.useEffect"], [
        editor,
        editingBlockId,
        activeEditField,
        onEditorInit
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CanvasEditor.useEffect": ()=>{
            if (editor) {
                if (activeEditField) {
                    const activeBlock = blocks.find({
                        "CanvasEditor.useEffect.activeBlock": (b)=>b.id === activeEditField.blockId
                    }["CanvasEditor.useEffect.activeBlock"]);
                    if (activeBlock) {
                        const textContent = activeBlock.content?.[activeEditField.field] || '';
                        if (editor.getHTML() !== textContent) {
                            editor.commands.setContent(textContent);
                        }
                        setTimeout({
                            "CanvasEditor.useEffect": ()=>editor.commands.focus('end')
                        }["CanvasEditor.useEffect"], 50);
                    }
                } else if (editingBlockId) {
                    const activeBlock = blocks.find({
                        "CanvasEditor.useEffect.activeBlock": (b)=>b.id === editingBlockId
                    }["CanvasEditor.useEffect.activeBlock"]);
                    if (activeBlock) {
                        const textContent = activeBlock.content?.text || '';
                        if (editor.getHTML() !== textContent) {
                            editor.commands.setContent(textContent);
                        }
                        setTimeout({
                            "CanvasEditor.useEffect": ()=>editor.commands.focus('end')
                        }["CanvasEditor.useEffect"], 50);
                    }
                }
            }
        }
    }["CanvasEditor.useEffect"], [
        editingBlockId,
        activeEditField,
        editor
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CanvasEditor.useEffect": ()=>{
            const handleKeyDown = {
                "CanvasEditor.useEffect.handleKeyDown": (e)=>{
                    const target = e.target;
                    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
                    // Do not run delete or key checks if autocomplete list popup is active
                    if (autocompleteRef.current?.active) return;
                    if (e.key === 'Escape') {
                        setEditingBlockId(null);
                        setActiveEditField(null);
                        onSelectBlock(null);
                        return;
                    }
                    if (isInput) return;
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                        if (selectedBlock) {
                            onDeleteBlock(selectedBlock.id);
                        }
                    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                        e.preventDefault();
                        if (selectedBlock) {
                            onDuplicateBlock(selectedBlock.id);
                        }
                    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                        e.preventDefault();
                        if (onSave) {
                            onSave();
                        }
                    }
                }
            }["CanvasEditor.useEffect.handleKeyDown"];
            const handleMouseDownOutside = {
                "CanvasEditor.useEffect.handleMouseDownOutside": (e)=>{
                    const target = e.target;
                    // If clicked on formatting toolbar, variable picker, or inside tiptap editor/inputs, do not cancel
                    if (target.closest('.tiptap-wysiwyg') || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="dialog"]') || target.closest('.variable-picker-popover')) {
                        return;
                    }
                    setEditingBlockId(null);
                    setActiveEditField(null);
                }
            }["CanvasEditor.useEffect.handleMouseDownOutside"];
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('mousedown', handleMouseDownOutside);
            return ({
                "CanvasEditor.useEffect": ()=>{
                    window.removeEventListener('keydown', handleKeyDown);
                    window.removeEventListener('mousedown', handleMouseDownOutside);
                }
            })["CanvasEditor.useEffect"];
        }
    }["CanvasEditor.useEffect"], [
        selectedBlock,
        onDeleteBlock,
        onDuplicateBlock,
        onSelectBlock,
        onSave
    ]);
    const { startUpload, isUploading: isCanvasUploading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uploadthing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUploadThing"])("imageUploader", {
        onClientUploadComplete: {
            "CanvasEditor.useUploadThing": (res)=>{
                setDragOverActive(false);
                if (res && res[0] && onAddBlock) {
                    onAddBlock("image", {
                        src: res[0].url,
                        alt: res[0].name || "Uploaded Image"
                    });
                }
            }
        }["CanvasEditor.useUploadThing"],
        onUploadError: {
            "CanvasEditor.useUploadThing": (err)=>{
                console.error(err);
                setDragOverActive(false);
                alert(`Canvas image upload failed: ${err.message}`);
            }
        }["CanvasEditor.useUploadThing"]
    });
    const handleCanvasDragOver = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        setDragOverActive(true);
    };
    const handleCanvasDragLeave = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        setDragOverActive(false);
    };
    const handleCanvasDrop = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((f)=>f.type.startsWith("image/"));
        if (imageFiles.length > 0) {
            if (imageFiles[0].size > 4 * 1024 * 1024) {
                alert("Dropped image exceeds 4MB size limit.");
                setDragOverActive(false);
                return;
            }
            startUpload([
                imageFiles[0]
            ]);
        } else {
            setDragOverActive(false);
        }
    };
    const renderBlock = (block)=>{
        const isSelected = selectedBlock?.id === block.id;
        const styles = Object.entries(block.styles).map(([key, value])=>`${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`).join('; ');
        const blockStyle = {
            position: 'relative',
            margin: '12px 0',
            transition: 'all 0.2s ease-in-out'
        };
        const renderContent = ()=>{
            switch(block.type){
                case 'header':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            textAlign: 'center',
                            ...block.styles
                        },
                        onDoubleClick: ()=>setEditingBlockId(block.id),
                        children: editingBlockId === block.id && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                            editor: editor,
                            className: "outline-none text-center tiptap-wysiwyg"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 727,
                            columnNumber: 17
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            style: {
                                margin: 0,
                                fontSize: '24px',
                                color: block.styles.color || '#ffffff'
                            },
                            className: "tiptap-wysiwyg",
                            dangerouslySetInnerHTML: {
                                __html: block.content.text || 'Double click to edit header...'
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 729,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 722,
                        columnNumber: 13
                    }, this);
                case 'text':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: block.styles.color || '#333333',
                            ...block.styles
                        },
                        onDoubleClick: ()=>setEditingBlockId(block.id),
                        children: editingBlockId === block.id && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                            editor: editor,
                            className: "outline-none text-left tiptap-wysiwyg"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 751,
                            columnNumber: 17
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "tiptap-wysiwyg",
                            dangerouslySetInnerHTML: {
                                __html: block.content.text || 'Double click to edit paragraph content...'
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 753,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 739,
                        columnNumber: 13
                    }, this);
                case 'button':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            textAlign: 'center',
                            ...block.styles
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            style: {
                                backgroundColor: block.content.backgroundColor || '#007bff',
                                color: block.content.color || '#ffffff',
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                display: 'inline-block'
                            },
                            onClick: (e)=>e.preventDefault(),
                            children: block.content.text
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 763,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 762,
                        columnNumber: 13
                    }, this);
                case 'image':
                    // Rendered by dedicated ImageBlock component (handles resize + alignment)
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ImageBlock, {
                        block: block,
                        isSelected: isSelected,
                        onUpdateBlock: onUpdateBlock,
                        onSelectBlock: onSelectBlock
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 784,
                        columnNumber: 13
                    }, this);
                case 'divider':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px 0',
                            textAlign: 'center'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                            style: {
                                border: 'none',
                                borderTop: '1px solid #e5e7eb',
                                width: '100%',
                                ...block.styles
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 794,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 793,
                        columnNumber: 13
                    }, this);
                case 'spacer':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            height: block.content.height || '20px',
                            lineHeight: block.content.height || '20px',
                            fontSize: block.content.height || '20px',
                            ...block.styles
                        },
                        children: " "
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 804,
                        columnNumber: 13
                    }, this);
                case '2column':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '10px',
                            display: 'table',
                            width: '100%',
                            tableLayout: 'fixed',
                            ...block.styles
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'table-row'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'table-cell',
                                        width: '50%',
                                        padding: '10px',
                                        verticalAlign: 'top'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: '1px dashed #e5e7eb',
                                            padding: '10px',
                                            minHeight: '50px',
                                            fontSize: '13px'
                                        },
                                        onDoubleClick: ()=>setActiveEditField({
                                                blockId: block.id,
                                                field: 'text1'
                                            }),
                                        children: activeEditField?.blockId === block.id && activeEditField?.field === 'text1' && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                                            editor: editor,
                                            className: "outline-none tiptap-wysiwyg"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 823,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "tiptap-wysiwyg",
                                            dangerouslySetInnerHTML: {
                                                __html: block.content.text1 || "Column 1 (Double click)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 825,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 818,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 817,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'table-cell',
                                        width: '50%',
                                        padding: '10px',
                                        verticalAlign: 'top'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: '1px dashed #e5e7eb',
                                            padding: '10px',
                                            minHeight: '50px',
                                            fontSize: '13px'
                                        },
                                        onDoubleClick: ()=>setActiveEditField({
                                                blockId: block.id,
                                                field: 'text2'
                                            }),
                                        children: activeEditField?.blockId === block.id && activeEditField?.field === 'text2' && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                                            editor: editor,
                                            className: "outline-none tiptap-wysiwyg"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 838,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "tiptap-wysiwyg",
                                            dangerouslySetInnerHTML: {
                                                __html: block.content.text2 || "Column 2 (Double click)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 840,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 833,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 832,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 816,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 815,
                        columnNumber: 13
                    }, this);
                case '3column':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '10px',
                            display: 'table',
                            width: '100%',
                            tableLayout: 'fixed',
                            ...block.styles
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'table-row'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'table-cell',
                                        width: '33.33%',
                                        padding: '10px',
                                        verticalAlign: 'top'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: '1px dashed #e5e7eb',
                                            padding: '10px',
                                            minHeight: '50px',
                                            fontSize: '12px'
                                        },
                                        onDoubleClick: ()=>setActiveEditField({
                                                blockId: block.id,
                                                field: 'text1'
                                            }),
                                        children: activeEditField?.blockId === block.id && activeEditField?.field === 'text1' && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                                            editor: editor,
                                            className: "outline-none tiptap-wysiwyg"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 860,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "tiptap-wysiwyg",
                                            dangerouslySetInnerHTML: {
                                                __html: block.content.text1 || "Col 1 (Double click)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 862,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 855,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 854,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'table-cell',
                                        width: '33.33%',
                                        padding: '10px',
                                        verticalAlign: 'top'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: '1px dashed #e5e7eb',
                                            padding: '10px',
                                            minHeight: '50px',
                                            fontSize: '12px'
                                        },
                                        onDoubleClick: ()=>setActiveEditField({
                                                blockId: block.id,
                                                field: 'text2'
                                            }),
                                        children: activeEditField?.blockId === block.id && activeEditField?.field === 'text2' && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                                            editor: editor,
                                            className: "outline-none tiptap-wysiwyg"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 875,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "tiptap-wysiwyg",
                                            dangerouslySetInnerHTML: {
                                                __html: block.content.text2 || "Col 2 (Double click)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 877,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 870,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 869,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'table-cell',
                                        width: '33.34%',
                                        padding: '10px',
                                        verticalAlign: 'top'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            border: '1px dashed #e5e7eb',
                                            padding: '10px',
                                            minHeight: '50px',
                                            fontSize: '12px'
                                        },
                                        onDoubleClick: ()=>setActiveEditField({
                                                blockId: block.id,
                                                field: 'text3'
                                            }),
                                        children: activeEditField?.blockId === block.id && activeEditField?.field === 'text3' && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                                            editor: editor,
                                            className: "outline-none tiptap-wysiwyg"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 890,
                                            columnNumber: 23
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "tiptap-wysiwyg",
                                            dangerouslySetInnerHTML: {
                                                __html: block.content.text3 || "Col 3 (Double click)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 892,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 885,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 884,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 853,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 852,
                        columnNumber: 13
                    }, this);
                case 'social':
                case 'social-follow':
                    const socialLayout = block.content?.layout || (block.type === 'social-follow' ? 'follow-section' : 'icons-only');
                    const socialHeading = block.content?.heading || '';
                    const socialDesc = block.content?.description || '';
                    const socialAlign = block.content?.alignment || 'center';
                    const iconSz = block.content?.iconSize || 32;
                    const iconSpc = block.content?.spacing !== undefined ? block.content.spacing : 12;
                    const iconStyle = block.content?.iconStyle || 'brand';
                    const socialEnabled = block.content?.enabledNetworks || {
                        linkedin: true,
                        instagram: true,
                        youtube: true
                    };
                    const socialUrls = block.content?.urls || {};
                    const ALL_NETWORKS = [
                        {
                            id: 'facebook',
                            label: 'Facebook'
                        },
                        {
                            id: 'twitter',
                            label: 'X'
                        },
                        {
                            id: 'linkedin',
                            label: 'LinkedIn'
                        },
                        {
                            id: 'instagram',
                            label: 'Instagram'
                        },
                        {
                            id: 'youtube',
                            label: 'YouTube'
                        },
                        {
                            id: 'pinterest',
                            label: 'Pinterest'
                        },
                        {
                            id: 'tiktok',
                            label: 'TikTok'
                        },
                        {
                            id: 'github',
                            label: 'GitHub'
                        },
                        {
                            id: 'whatsapp',
                            label: 'WhatsApp'
                        },
                        {
                            id: 'telegram',
                            label: 'Telegram'
                        },
                        {
                            id: 'discord',
                            label: 'Discord'
                        },
                        {
                            id: 'website',
                            label: 'Website'
                        },
                        {
                            id: 'email',
                            label: 'Email'
                        }
                    ];
                    const BRAND_ICONS = {
                        facebook: 'https://img.icons8.com/color/48/facebook-new.png',
                        twitter: 'https://img.icons8.com/color/48/twitterx--v1.png',
                        linkedin: 'https://img.icons8.com/color/48/linkedin.png',
                        instagram: 'https://img.icons8.com/color/48/instagram-new.png',
                        youtube: 'https://img.icons8.com/color/48/youtube-play.png',
                        pinterest: 'https://img.icons8.com/color/48/pinterest.png',
                        tiktok: 'https://img.icons8.com/color/48/tiktok.png',
                        github: 'https://img.icons8.com/color/48/github--v1.png',
                        whatsapp: 'https://img.icons8.com/color/48/whatsapp.png',
                        telegram: 'https://img.icons8.com/color/48/telegram-app.png',
                        discord: 'https://img.icons8.com/color/48/discord-logo.png',
                        website: 'https://img.icons8.com/color/48/domain.png',
                        email: 'https://img.icons8.com/color/48/new-post.png'
                    };
                    const MONO_ICONS = {
                        facebook: 'https://img.icons8.com/ios-filled/48/333333/facebook-new.png',
                        twitter: 'https://img.icons8.com/ios-filled/48/333333/twitterx.png',
                        linkedin: 'https://img.icons8.com/ios-filled/48/333333/linkedin.png',
                        instagram: 'https://img.icons8.com/ios-filled/48/333333/instagram-new.png',
                        youtube: 'https://img.icons8.com/ios-filled/48/333333/youtube-play.png',
                        pinterest: 'https://img.icons8.com/ios-filled/48/333333/pinterest.png',
                        tiktok: 'https://img.icons8.com/ios-filled/48/333333/tiktok.png',
                        github: 'https://img.icons8.com/ios-filled/48/333333/github.png',
                        whatsapp: 'https://img.icons8.com/ios-filled/48/333333/whatsapp.png',
                        telegram: 'https://img.icons8.com/ios-filled/48/333333/telegram-app.png',
                        discord: 'https://img.icons8.com/ios-filled/48/333333/discord-logo.png',
                        website: 'https://img.icons8.com/ios-filled/48/333333/domain.png',
                        email: 'https://img.icons8.com/ios-filled/48/333333/new-post.png'
                    };
                    const getIconUrl = (id)=>{
                        if (iconStyle === 'monochrome') return MONO_ICONS[id] || MONO_ICONS.website;
                        return BRAND_ICONS[id] || BRAND_ICONS.website;
                    };
                    const flexJustify = socialAlign === 'left' ? 'flex-start' : socialAlign === 'right' ? 'flex-end' : 'center';
                    const textAlignVal = socialAlign;
                    const activeNets = ALL_NETWORKS.filter((n)=>socialEnabled[n.id]);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            textAlign: textAlignVal,
                            width: '100%',
                            boxSizing: 'border-box',
                            ...block.styles
                        },
                        onDoubleClick: ()=>socialLayout === 'follow-section' && setEditingBlockId(block.id),
                        children: [
                            socialLayout === 'follow-section' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: editingBlockId === block.id && editor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginBottom: '10px'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EditorContent"], {
                                        editor: editor,
                                        className: "outline-none tiptap-wysiwyg",
                                        style: {
                                            textAlign: textAlignVal
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 981,
                                        columnNumber: 23
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 980,
                                    columnNumber: 21
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        socialHeading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            style: {
                                                margin: '0 0 8px 0',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                color: block.styles?.color || '#1e293b',
                                                textAlign: textAlignVal
                                            },
                                            dangerouslySetInnerHTML: {
                                                __html: socialHeading
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 986,
                                            columnNumber: 25
                                        }, this),
                                        socialDesc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                margin: '0 0 16px 0',
                                                fontSize: '13px',
                                                color: block.styles?.color || '#64748b',
                                                textAlign: textAlignVal,
                                                lineHeight: '1.5'
                                            },
                                            dangerouslySetInnerHTML: {
                                                __html: socialDesc
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 992,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true)
                            }, void 0, false),
                            activeNets.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    justifyContent: flexJustify,
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: `${iconSpc}px`
                                },
                                children: activeNets.map((net)=>{
                                    const href = socialUrls[net.id] || block.content?.[net.id] || '';
                                    const imgEl = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: getIconUrl(net.id),
                                        alt: net.label,
                                        title: net.label,
                                        style: {
                                            width: `${iconSz}px`,
                                            height: `${iconSz}px`,
                                            display: 'block',
                                            border: 'none'
                                        }
                                    }, net.id, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1008,
                                        columnNumber: 23
                                    }, this);
                                    return href ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: href,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        style: {
                                            display: 'inline-block',
                                            textDecoration: 'none'
                                        },
                                        children: imgEl
                                    }, net.id, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1017,
                                        columnNumber: 23
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            display: 'inline-block',
                                            opacity: 0.7
                                        },
                                        children: imgEl
                                    }, net.id, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1021,
                                        columnNumber: 23
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1004,
                                columnNumber: 17
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#94a3b8',
                                    fontSize: '12px',
                                    fontStyle: 'italic',
                                    textAlign: textAlignVal
                                },
                                children: "Enable networks in the Social Settings panel →"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1026,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 972,
                        columnNumber: 13
                    }, this);
                case 'footer':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            textAlign: 'center',
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            fontSize: '12px',
                            ...block.styles
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '0 0 10px 0',
                                    fontSize: '11px'
                                },
                                children: block.content?.unsubscribeText || "You received this email because you're subscribed to our newsletter."
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1042,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '0 0 10px 0',
                                    fontSize: '11px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        style: {
                                            color: '#6c757d',
                                            textDecoration: 'underline',
                                            marginRight: '10px'
                                        },
                                        children: "Unsubscribe"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1046,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        style: {
                                            color: '#6c757d',
                                            textDecoration: 'underline',
                                            marginRight: '10px'
                                        },
                                        children: "Privacy Policy"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1047,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        style: {
                                            color: '#6c757d',
                                            textDecoration: 'underline'
                                        },
                                        children: "Terms of Service"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1048,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1045,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '0 0 5px 0',
                                    fontSize: '11px'
                                },
                                children: block.content?.company || "Your Company Name"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1050,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '0 0 5px 0',
                                    fontSize: '10px'
                                },
                                children: block.content?.address || "123 Business St, City, State 12345"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1053,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '0',
                                    fontSize: '10px',
                                    borderTop: '1px solid #dee2e6',
                                    paddingTop: '10px'
                                },
                                children: block.content?.copyright || `© ${new Date().getFullYear()} Your Company Name. All rights reserved.`
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1056,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 1034,
                        columnNumber: 13
                    }, this);
                case 'html':
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px'
                        },
                        children: block.content?.html ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                width: '100%',
                                overflow: 'auto',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '8px'
                            },
                            dangerouslySetInnerHTML: {
                                __html: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2f$html$2d$sanitizer$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeEmailHTML"])(block.content.html)
                            }
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1065,
                            columnNumber: 17
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                border: '1px dashed #ccc',
                                padding: '10px',
                                minHeight: '50px',
                                backgroundColor: '#f9f9f9'
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#666',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                },
                                children: "Custom HTML content"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1077,
                                columnNumber: 19
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1076,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 1063,
                        columnNumber: 13
                    }, this);
                default:
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            backgroundColor: '#f9f9f9',
                            border: '1px dashed #ccc'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#666',
                                textAlign: 'center'
                            },
                            children: [
                                "Unknown block type: ",
                                block.type
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1087,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 1086,
                        columnNumber: 13
                    }, this);
            }
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: blockStyle,
            onClick: ()=>onSelectBlock(block),
            onMouseDown: (e)=>{
                if (e.target === e.currentTarget || e.currentTarget.contains(e.target)) {
                    setDraggedBlockId(block.id);
                    setIsDragging(true);
                }
            },
            className: `cursor-pointer rounded-lg border-2 shadow-sm transition-all duration-200 ${isSelected ? 'border-red-500 bg-red-550/5 shadow-md' : 'border-slate-100 hover:border-red-200 hover:bg-slate-50/30'}`,
            children: [
                editingBlockId === block.id && editor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute -top-14 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-xl px-2.5 py-1.5 z-50 text-white select-none animate-in fade-in slide-in-from-bottom-2 duration-150 w-max max-w-[580px]",
                    onClick: (e)=>e.stopPropagation(),
                    onMouseDown: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            value: editor.getAttributes('textStyle').fontFamily || 'Arial',
                            onChange: (e)=>editor.chain().focus().setFontFamily(e.target.value).run(),
                            className: "bg-slate-800 text-slate-200 border border-slate-750 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans cursor-pointer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "Arial",
                                    children: "Arial"
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1125,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "Helvetica",
                                    children: "Helvetica"
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1126,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "Times New Roman",
                                    children: "Times New Roman"
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1127,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "Georgia",
                                    children: "Georgia"
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1128,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "Verdana",
                                    children: "Verdana"
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1129,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1120,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            value: editor.getAttributes('textStyle').fontSize || '16px',
                            onChange: (e)=>editor.chain().focus().setMark('textStyle', {
                                    fontSize: e.target.value
                                }).run(),
                            className: "bg-slate-800 text-slate-200 border border-slate-750 text-[10px] rounded px-1.5 py-0.5 outline-none cursor-pointer",
                            children: [
                                12,
                                14,
                                16,
                                18,
                                20,
                                24,
                                28,
                                32,
                                36,
                                40,
                                48
                            ].map((sz)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: `${sz}px`,
                                    children: [
                                        sz,
                                        "px"
                                    ]
                                }, sz, true, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1138,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1132,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "color",
                            value: editor.getAttributes('textStyle').color || '#000000',
                            onChange: (e)=>editor.chain().focus().setColor(e.target.value).run(),
                            className: "w-4 h-4 rounded border-none bg-transparent cursor-pointer p-0",
                            title: "Text Color"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1142,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-4 bg-slate-800"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1150,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive('bold') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().toggleBold().run(),
                            title: "Bold",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bold$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bold$3e$__["Bold"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1158,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1152,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive('italic') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().toggleItalic().run(),
                            title: "Italic",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$italic$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Italic$3e$__["Italic"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1166,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1160,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive('underline') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().toggleUnderline().run(),
                            title: "Underline",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$underline$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Underline$3e$__["Underline"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1174,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1168,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-4 bg-slate-800"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1177,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive({
                                textAlign: 'left'
                            }) ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().setTextAlign('left').run(),
                            title: "Align Left",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$start$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignLeft$3e$__["AlignLeft"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1185,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1179,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive({
                                textAlign: 'center'
                            }) ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().setTextAlign('center').run(),
                            title: "Align Center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$center$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignCenter$3e$__["AlignCenter"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1193,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1187,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive({
                                textAlign: 'right'
                            }) ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().setTextAlign('right').run(),
                            title: "Align Right",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$text$2d$align$2d$end$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlignRight$3e$__["AlignRight"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1201,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1195,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-4 bg-slate-800"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1204,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().toggleBulletList().run(),
                            title: "Bullet List",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1212,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1206,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`,
                            onClick: ()=>editor.chain().focus().toggleOrderedList().run(),
                            title: "Numbered List",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2d$ordered$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ListOrdered$3e$__["ListOrdered"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1220,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1214,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-px h-4 bg-slate-800"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1223,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: `p-1 rounded hover:bg-slate-800 text-slate-300`,
                            onClick: ()=>{
                                const url = prompt("Enter link URL:");
                                if (url) {
                                    editor.chain().focus().setLink({
                                        href: url
                                    }).run();
                                } else {
                                    editor.chain().focus().unsetLink().run();
                                }
                            },
                            title: "Link",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link2$3e$__["Link2"], {
                                className: "h-3.5 w-3.5"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1238,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1225,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center font-bold text-[11px]",
                                    onClick: ()=>setCanvasPickerOpen(canvasPickerOpen === block.id ? null : block.id),
                                    title: "Insert variable",
                                    children: "{}"
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1242,
                                    columnNumber: 15
                                }, this),
                                canvasPickerOpen === block.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute left-1/2 -translate-x-1/2 bottom-full mb-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$templates$2f$VariablePicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        onSelect: (tagValue)=>{
                                            editor.chain().focus().insertContent(tagValue).run();
                                            setCanvasPickerOpen(null);
                                        },
                                        onClose: ()=>setCanvasPickerOpen(null)
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1252,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1251,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1241,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1114,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `absolute top-2 right-2 flex gap-1 ${isSelected ? 'opacity-100' : 'opacity-0'} hover:opacity-100 transition-all duration-200 z-40`,
                    onClick: (e)=>e.stopPropagation(),
                    onMouseDown: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50",
                                    onClick: ()=>onMoveBlock(block.id, 'up'),
                                    disabled: blocks.findIndex((b)=>b.id === block.id) === 0,
                                    title: "Move up",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                                        className: "h-3 w-3"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1281,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1273,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50",
                                    onClick: ()=>onMoveBlock(block.id, 'down'),
                                    disabled: blocks.findIndex((b)=>b.id === block.id) === blocks.length - 1,
                                    title: "Move down",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                        className: "h-3 w-3"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1291,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1283,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1272,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-6 w-6 p-0 hover:bg-gray-100",
                                    onClick: ()=>onDuplicateBlock(block.id),
                                    title: "Duplicate",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                        className: "h-3 w-3"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1304,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1297,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-6 w-6 p-0 hover:bg-gray-100",
                                    onClick: ()=>onSelectBlock(block),
                                    title: "Edit",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$pen$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit$3e$__["Edit"], {
                                        className: "h-3 w-3"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1313,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1306,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "sm",
                                    variant: "ghost",
                                    className: "h-6 w-6 p-0 hover:bg-red-50 text-red-600",
                                    onClick: ()=>onDeleteBlock(block.id),
                                    title: "Delete",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                        className: "h-3 w-3"
                                    }, void 0, false, {
                                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                                        lineNumber: 1322,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1315,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1296,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1266,
                    columnNumber: 9
                }, this),
                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-2 left-2 cursor-move bg-white rounded-md shadow-sm border border-gray-200 p-1 hover:bg-gray-50 transition-colors z-40",
                    onMouseDown: (e)=>{
                        e.stopPropagation();
                        setDraggedBlockId(block.id);
                        setIsDragging(true);
                    },
                    title: "Drag to reorder",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__["GripVertical"], {
                        className: "h-4 w-4 text-gray-500"
                    }, void 0, false, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 1338,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1329,
                    columnNumber: 11
                }, this),
                renderContent()
            ]
        }, block.id, true, {
            fileName: "[project]/components/templates/CanvasEditor.tsx",
            lineNumber: 1096,
            columnNumber: 7
        }, this);
    };
    // Defensive check - ensure blocks is always an array
    if (!Array.isArray(blocks) || blocks.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full w-full flex items-center justify-center p-8 bg-slate-50/20 relative",
            onDragOver: handleCanvasDragOver,
            onDragLeave: handleCanvasDragLeave,
            onDrop: handleCanvasDrop,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-lg text-center flex flex-col items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-16 h-16 rounded-3xl bg-blue-50/60 border border-blue-100 flex items-center justify-center mb-5 shadow-inner",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                className: "h-7 w-7 text-blue-600 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1359,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1358,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-base font-bold text-slate-800 mb-2",
                            children: "Start Building Your Email"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1361,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-slate-450 max-w-xs mx-auto mb-6 leading-relaxed",
                            children: "Choose from professionally pre-styled sections in the left sidebar, drag files to upload directly, or use the quick additions below."
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1362,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-2 w-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    size: "sm",
                                    className: "h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5",
                                    onClick: ()=>onAddBlock?.("header"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "h-3 w-3 text-slate-500"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 1373,
                                            columnNumber: 15
                                        }, this),
                                        "Add Header"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1367,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    size: "sm",
                                    className: "h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5",
                                    onClick: ()=>onAddBlock?.("header", {
                                            text: "🚀 Get Started Today"
                                        }, {
                                            textAlign: "center",
                                            padding: "40px 24px",
                                            backgroundColor: "#1e293b",
                                            color: "#ffffff",
                                            fontSize: "24px",
                                            fontWeight: "800"
                                        }),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "h-3 w-3 text-slate-500"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 1382,
                                            columnNumber: 15
                                        }, this),
                                        "Add Hero"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1376,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    size: "sm",
                                    className: "h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5",
                                    onClick: ()=>onAddBlock?.("button"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "h-3 w-3 text-slate-500"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 1391,
                                            columnNumber: 15
                                        }, this),
                                        "Add CTA"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1385,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    size: "sm",
                                    className: "h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5",
                                    onClick: ()=>onAddBlock?.("footer"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "h-3 w-3 text-slate-500"
                                        }, void 0, false, {
                                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                                            lineNumber: 1400,
                                            columnNumber: 15
                                        }, this),
                                        "Add Footer"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                                    lineNumber: 1394,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1366,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1357,
                    columnNumber: 9
                }, this),
                dragOverActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 bg-indigo-650/10 border-4 border-dashed border-indigo-500 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-[1px] transition-all",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-6 shadow-xl border border-indigo-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                className: "h-8 w-8 text-indigo-600 animate-bounce mb-3"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1409,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-slate-800",
                                children: "Drop Image to Upload"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1410,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] text-slate-450 mt-1 leading-relaxed",
                                children: "Automatically upload via UploadThing and insert it as an image component block."
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1411,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 1408,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1407,
                    columnNumber: 11
                }, this),
                isCanvasUploading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-6 shadow-xl border border-slate-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "h-8 w-8 text-indigo-600 animate-spin mb-3"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1421,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-slate-800",
                                children: "Uploading Image"
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1422,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] text-slate-450 mt-1 leading-relaxed",
                                children: "Processing image routing on UploadThing servers. Please wait..."
                            }, void 0, false, {
                                fileName: "[project]/components/templates/CanvasEditor.tsx",
                                lineNumber: 1423,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/templates/CanvasEditor.tsx",
                        lineNumber: 1420,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1419,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/templates/CanvasEditor.tsx",
            lineNumber: 1351,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full overflow-auto p-4 bg-white relative",
        onDragOver: handleCanvasDragOver,
        onDragLeave: handleCanvasDragLeave,
        onDrop: handleCanvasDrop,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                dangerouslySetInnerHTML: {
                    __html: `
        .tiptap-wysiwyg ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap-wysiwyg ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap-wysiwyg li {
          display: list-item !important;
          margin-bottom: 0.25rem !important;
        }
        .tiptap-wysiwyg p {
          margin-bottom: 0.5rem !important;
        }
      `
                }
            }, void 0, false, {
                fileName: "[project]/components/templates/CanvasEditor.tsx",
                lineNumber: 1440,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                children: blocks.map(renderBlock)
            }, void 0, false, {
                fileName: "[project]/components/templates/CanvasEditor.tsx",
                lineNumber: 1461,
                columnNumber: 7
            }, this),
            dragOverActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-indigo-655/10 border-4 border-dashed border-indigo-500 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-[1px] transition-all",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-2xl p-6 shadow-xl border border-indigo-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                            className: "h-8 w-8 text-indigo-650 animate-bounce mb-3"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1468,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: "text-xs font-bold text-slate-800",
                            children: "Drop Image to Upload"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1469,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[10px] text-slate-450 mt-1 leading-relaxed",
                            children: "Automatically upload via UploadThing and insert it as an image component block."
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1470,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1467,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/templates/CanvasEditor.tsx",
                lineNumber: 1466,
                columnNumber: 9
            }, this),
            isCanvasUploading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-2xl p-6 shadow-xl border border-slate-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                            className: "h-8 w-8 text-indigo-650 animate-spin mb-3"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1480,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: "text-xs font-bold text-slate-800",
                            children: "Uploading Image"
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1481,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[10px] text-slate-450 mt-1 leading-relaxed",
                            children: "Processing image routing on UploadThing servers. Please wait..."
                        }, void 0, false, {
                            fileName: "[project]/components/templates/CanvasEditor.tsx",
                            lineNumber: 1482,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/templates/CanvasEditor.tsx",
                    lineNumber: 1479,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/templates/CanvasEditor.tsx",
                lineNumber: 1478,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/templates/CanvasEditor.tsx",
        lineNumber: 1434,
        columnNumber: 5
    }, this);
}
_s1(CanvasEditor, "E7oEkYTjHWRnP+1NdB2DsI4UEEk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tiptap$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useEditor"],
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uploadthing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUploadThing"]
    ];
});
_c1 = CanvasEditor;
var _c, _c1;
__turbopack_context__.k.register(_c, "ImageBlock");
__turbopack_context__.k.register(_c1, "CanvasEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/templates/CanvasEditor.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/templates/CanvasEditor.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=_0_53.ux._.js.map