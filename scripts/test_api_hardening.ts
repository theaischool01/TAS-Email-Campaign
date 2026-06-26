import { SegmentCriteriaSchema } from "../lib/segments/schema";
import { z } from "zod";

console.log("🚀 STARTING API HARDENING SCHEMA VERIFICATION...");

// Test Case 1: Valid SegmentCriteria Payload
const validPayload = {
  conjunction: "AND",
  rules: [
    {
      type: "RULE",
      field: "custom.state",
      operator: "equals",
      value: "Telangana"
    }
  ]
};

// Test Case 2: Invalid Payload (Missing conjunction and rules)
const invalidPayload = {
  foo: "bar"
};

// Test Case 3: Empty rules array (Which is caught by the schema minimum rules constraint)
const emptyRulesPayload = {
  conjunction: "AND",
  rules: []
};

try {
  console.log("\n--- Testing Valid Payload ---");
  const parsedValid = SegmentCriteriaSchema.parse(validPayload);
  console.log("✅ Valid payload parsed successfully:", JSON.stringify(parsedValid));
} catch (e: any) {
  console.error("❌ Failed to parse valid payload:", e.message);
  process.exit(1);
}

try {
  console.log("\n--- Testing Invalid Payload { foo: 'bar' } ---");
  SegmentCriteriaSchema.parse(invalidPayload);
  console.error("❌ ERROR: Schema accepted invalid payload!");
  process.exit(1);
} catch (e: any) {
  console.log("✅ Schema correctly rejected invalid payload. Zod validation error details:");
  console.log(e.errors);
}

try {
  console.log("\n--- Testing Empty Rules Payload ---");
  SegmentCriteriaSchema.parse(emptyRulesPayload);
  console.error("❌ ERROR: Schema accepted empty rules array!");
  process.exit(1);
} catch (e: any) {
  console.log("✅ Schema correctly rejected empty rules. Zod validation error details:");
  console.log(e.errors);
}

console.log("\n🎉 ALL SCHEMA VERIFICATION CHECKS PASSED!");
process.exit(0);
