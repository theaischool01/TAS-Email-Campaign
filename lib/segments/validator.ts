export interface CustomFieldMeta {
  id: string;
  key: string;
  type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "DROPDOWN" | "MULTI_SELECT";
}

export const SYSTEM_FIELD_TYPES: Record<string, string> = {
  "contact.email": "TEXT",
  "contact.firstName": "TEXT",
  "contact.lastName": "TEXT",
  "contact.phone": "TEXT",
  "contact.company": "TEXT",
  "contact.city": "TEXT",
  "contact.tags": "MULTI_SELECT", // Tags act like multi-select for overlap operations
  "list.id": "LIST"
};

export const ALLOWED_OPERATORS: Record<string, string[]> = {
  TEXT: ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "is_empty", "is_not_empty"],
  NUMBER: ["equals", "not_equals", "greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal", "is_empty", "is_not_empty", "between"],
  DATE: ["equals", "before", "after", "is_empty", "is_not_empty", "between"],
  BOOLEAN: ["equals", "not_equals"],
  DROPDOWN: ["equals", "not_equals", "is_empty", "is_not_empty"],
  MULTI_SELECT: ["contains_any", "contains_all", "is_empty", "is_not_empty", "equals", "not_equals", "contains"], // contains added for flex tag matches
  LIST: ["in_list", "not_in_list"]
};

export function validateCriteriaNode(
  node: any,
  customFields: Map<string, CustomFieldMeta>
): void {
  if (!node || typeof node !== "object") return;

  if (node.type === "GROUP") {
    if (!node.rules || !Array.isArray(node.rules) || node.rules.length === 0) {
      throw new Error("Group must contain at least one filter rule.");
    }
    for (const subRule of node.rules) {
      validateCriteriaNode(subRule, customFields);
    }
  } else if (node.type === "RULE") {
    const field = node.field;
    const operator = node.operator;

    let fieldType: string | undefined;

    if (field.startsWith("contact.") || field === "list.id") {
      fieldType = SYSTEM_FIELD_TYPES[field];
    } else if (field.startsWith("custom.")) {
      const customKey = field.split(".")[1]?.toLowerCase();
      const meta = customFields.get(customKey);
      if (!meta) {
        throw new Error(`Custom field '${customKey}' does not exist.`);
      }
      fieldType = meta.type;
    }

    if (!fieldType) {
      throw new Error(`Unknown field type for field '${field}'.`);
    }

    const allowed = ALLOWED_OPERATORS[fieldType] || [];
    if (!allowed.includes(operator)) {
      throw new Error(`Operator '${operator}' is not allowed for field '${field}'.`);
    }

    if (operator === "between") {
      const val = node.value;
      if (!Array.isArray(val)) {
        throw new Error(`Value for operator 'between' must be an array.`);
      }
      if (val.length !== 2) {
        throw new Error(`Value for operator 'between' must contain exactly 2 elements.`);
      }
      const [min, max] = val;
      if (min === null || min === undefined || min === "" || max === null || max === undefined || max === "") {
        throw new Error(`Values for operator 'between' cannot be null, undefined, or empty.`);
      }
      if (fieldType === "NUMBER") {
        if (isNaN(Number(min)) || isNaN(Number(max))) {
          throw new Error(`Values for operator 'between' on NUMBER fields must be numeric.`);
        }
      } else if (fieldType === "DATE") {
        const d1 = new Date(min as any);
        const d2 = new Date(max as any);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
          throw new Error(`Values for operator 'between' on DATE fields must be valid dates.`);
        }
      }
    }
  } else {
    // If root conjunction node
    if (node.conjunction && Array.isArray(node.rules)) {
      if (node.rules.length === 0) {
        throw new Error("Criteria must contain at least one filter rule.");
      }
      for (const subRule of node.rules) {
        validateCriteriaNode(subRule, customFields);
      }
    }
  }
}
