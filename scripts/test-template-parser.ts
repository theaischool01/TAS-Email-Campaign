import { JSDOM } from "jsdom";

// Mock the browser environment for the DOMParser
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).DOMParser = dom.window.DOMParser;
(global as any).Node = dom.window.Node;

import { DEFAULT_EMAIL_TEMPLATES } from "../lib/default-templates";
import { parseHTMLToBlocks } from "../components/templates/utils/html-parser";
import { renderBlocksToHTML } from "../components/templates/utils/html-renderer";

interface TestReport {
  name: string;
  category: string;
  originalSize: number;
  blocksCount: number;
  renderedSize: number;
  confidence: string;
  warnings: string[];
  passed: boolean;
  error?: string;
}

const REQUIRED_TAGS = [
  "{{firstName}}",
  "{{companyName}}",
  "{{unsubscribeLink}}",
  "{{supportEmail}}"
];

async function runTests() {
  console.log("--------------------------------------------------");
  console.log(`Starting Phase 7D template parser test suite`);
  console.log(`Testing ${DEFAULT_EMAIL_TEMPLATES.length} templates...`);
  console.log("--------------------------------------------------");

  const reports: TestReport[] = [];
  let failures = 0;

  for (const t of DEFAULT_EMAIL_TEMPLATES) {
    try {
      const originalHtml = t.html;
      const originalSize = Buffer.byteLength(originalHtml, "utf-8");

      // 1. Run Parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalHtml, "text/html");
      console.log(`DEBUG: Template "${t.name}": body.childNodes.length = ${doc.body.childNodes.length}, innerHTML length = ${doc.body.innerHTML.length}`);
      
      const parseResult = parseHTMLToBlocks(originalHtml);
      const parsedBlocks = parseResult.blocks;
      const blocksCount = parsedBlocks.length;
      const confidence = parseResult.confidence;
      const warnings = parseResult.warnings;

      if (parsedBlocks.length > 0) {
        console.log(`DEBUG: Template "${t.name}" blocks:`, parsedBlocks.map(b => b.type));
      }

      // 2. Run Renderer
      const renderedHtml = renderBlocksToHTML(parsedBlocks);
      const renderedSize = Buffer.byteLength(renderedHtml, "utf-8");

      // 3. Assertions
      const missingTags: string[] = [];
      for (const tag of REQUIRED_TAGS) {
        // Only verify tags that actually existed in the original template
        if (originalHtml.includes(tag) && !renderedHtml.includes(tag)) {
          missingTags.push(tag);
        }
      }

      // Check for size sanity (avoid silent deletion)
      const sizeSanity = renderedSize > 0 && renderedSize >= originalSize * 0.15; // Allow for style compaction but reject empty/near-empty
      const tagsPreserved = missingTags.length === 0;
      const passed = sizeSanity && tagsPreserved && blocksCount > 0;

      if (!passed) {
        failures++;
      }

      reports.push({
        name: t.name,
        category: t.category || "General",
        originalSize,
        blocksCount,
        renderedSize,
        confidence,
        warnings: [...warnings, ...missingTags.map(t => `Lost merge tag: ${t}`)],
        passed
      });
    } catch (e: any) {
      failures++;
      reports.push({
        name: t.name,
        category: t.category || "General",
        originalSize: 0,
        blocksCount: 0,
        renderedSize: 0,
        confidence: "LOW",
        warnings: [],
        passed: false,
        error: e.message || String(e)
      });
    }
  }

  // Print summary
  console.log("\n--- TEST SUMMARY ---");
  reports.forEach(r => {
    const status = r.passed ? "✅ PASSED" : "❌ FAILED";
    console.log(`[${status}] [Conf: ${r.confidence}] ${r.name} - Blocks: ${r.blocksCount}, Size: ${r.originalSize}B -> ${r.renderedSize}B`);
    if (r.warnings.length > 0) {
      r.warnings.forEach(w => console.log(`   ⚠️ Warning: ${w}`));
    }
    if (r.error) {
      console.log(`   🔴 Error: ${r.error}`);
    }
  });

  console.log("\n--------------------------------------------------");
  console.log(`Total Templates Tested: ${DEFAULT_EMAIL_TEMPLATES.length}`);
  console.log(`Passed: ${DEFAULT_EMAIL_TEMPLATES.length - failures}`);
  console.log(`Failed: ${failures}`);
  console.log("--------------------------------------------------");

  if (failures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
