import { z } from "zod";

const OperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "before",
  "after",
  "in_list",
  "not_in_list",
  "is_empty",
  "is_not_empty",
  "contains_any",
  "contains_all"
]);

interface RuleGroup {
  conjunction: "AND" | "OR";
  rules: Array<Rule | RuleGroup>;
}

interface Rule {
  type: "RULE";
  field: string;
  operator: z.infer<typeof OperatorSchema>;
  value?: any;
}

const RuleSchema: z.ZodType<Rule> = z.object({
  type: z.literal("RULE"),
  field: z.string().regex(/^(contact\.[a-zA-Z0-9_]+|custom\.[a-zA-Z0-9_]+|list\.id)$/, {
    message: "Field must start with contact.*, custom.*, or be list.id"
  }),
  operator: OperatorSchema,
  value: z.any().optional()
});

const RuleGroupSchema: z.ZodType<RuleGroup> = z.lazy(() =>
  z.object({
    conjunction: z.enum(["AND", "OR"]),
    rules: z.array(z.union([RuleSchema, z.object({
      type: z.literal("GROUP").optional(),
      conjunction: z.enum(["AND", "OR"]),
      rules: z.array(z.any())
    })])).min(1, "Group must contain at least one filter rule")
  })
);

export const SegmentCriteriaSchema = z.object({
  conjunction: z.enum(["AND", "OR"]),
  rules: z.array(z.union([RuleSchema, RuleGroupSchema])).min(1, "Segment criteria must contain at least one filter rule")
});
