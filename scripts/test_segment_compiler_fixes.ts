import { SegmentQueryCompiler } from "../lib/segments/compiler";
import { validateCriteriaNode, CustomFieldMeta } from "../lib/segments/validator";

const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q";

async function runTests() {
  console.log("🧪 Running Segment Validator and Compiler Operators Verification...");

  // Mock custom fields registry
  const fieldRegistry = new Map<string, CustomFieldMeta>();
  fieldRegistry.set("state", { id: "cf_state_id", key: "state", type: "DROPDOWN" });
  fieldRegistry.set("salary", { id: "cf_salary_id", key: "salary", type: "NUMBER" });
  fieldRegistry.set("joindate", { id: "cf_joindate_id", key: "joinDate", type: "DATE" });
  fieldRegistry.set("skills", { id: "cf_skills_id", key: "skills", type: "MULTI_SELECT" });

  const testCases = [
    {
      name: "TEXT: contact.email contains example.com",
      criteria: {
        conjunction: "AND",
        rules: [
          {
            type: "RULE",
            field: "contact.email",
            operator: "contains",
            value: "example.com"
          }
        ]
      }
    },
    {
      name: "TEXT: contact.firstName starts_with John",
      criteria: {
        conjunction: "AND",
        rules: [
          {
            type: "RULE",
            field: "contact.firstName",
            operator: "starts_with",
            value: "John"
          }
        ]
      }
    },
    {
      name: "TEXT: contact.lastName ends_with Doe",
      criteria: {
        conjunction: "AND",
        rules: [
          {
            type: "RULE",
            field: "contact.lastName",
            operator: "ends_with",
            value: "Doe"
          }
        ]
      }
    },
    {
      name: "TEXT: contact.company not_contains Spam",
      criteria: {
        conjunction: "AND",
        rules: [
          {
            type: "RULE",
            field: "contact.company",
            operator: "not_contains",
            value: "Spam"
          }
        ]
      }
    },
    {
      name: "MULTI_SELECT: custom.skills contains_any [AI, ML]",
      criteria: {
        conjunction: "AND",
        rules: [
          {
            type: "RULE",
            field: "custom.skills",
            operator: "contains_any",
            value: ["AI", "ML"]
          }
        ]
      }
    },
    {
      name: "MULTI_SELECT: custom.skills contains_all [React, Node]",
      criteria: {
        conjunction: "AND",
        rules: [
          {
            type: "RULE",
            field: "custom.skills",
            operator: "contains_all",
            value: ["React", "Node"]
          }
        ]
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Running: ${tc.name}`);
    try {
      // 1. Validate
      validateCriteriaNode(tc.criteria, fieldRegistry);
      console.log("✅ Validation: PASSED");

      // 2. Compile
      const compiled = SegmentQueryCompiler.compile(TEST_USER_ID, tc.criteria, fieldRegistry, {
        mode: "COUNT"
      });
      console.log("✅ Compilation: SUCCESS");
      console.log("Generated SQL:", compiled.sql);
      console.log("Bound Parameters:", compiled.values);
    } catch (err: any) {
      console.error("❌ Test Failed:", err.message);
    }
  }
}

runTests();
