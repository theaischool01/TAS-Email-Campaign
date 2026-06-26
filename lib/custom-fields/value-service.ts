import { prisma as prismaClient } from "@/app/lib/prisma";

const prisma = prismaClient as any;

/**
 * Robustly parses a custom field's options string.
 * Handles both JSON arrays (["A","B"]) and raw comma-separated strings ("A,B,C").
 */
function parseOptions(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return [];
  const trimmed = raw.trim();

  // Attempt JSON parse first
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((o: any) => String(o).trim()).filter(Boolean);
      }
    } catch (_) {
      // Fall through to comma split
    }
  }

  // Fallback: comma-separated string
  return trimmed.split(",").map(s => s.trim()).filter(Boolean);
}

export class CustomValueService {
  /**
   * Transforms database ContactFieldValue relations into a flat key-value dictionary.
   */
  static flattenCustomFieldValues(fieldValues: any[]): Record<string, any> {
    const flat: Record<string, any> = {};
    if (!fieldValues || !Array.isArray(fieldValues)) return flat;

    for (const val of fieldValues) {
      if (!val.customField) continue;
      const key = val.customField.key;
      let value: any = null;

      if (val.textValue !== null && val.textValue !== undefined) {
        value = val.textValue;
      } else if (val.numberValue !== null && val.numberValue !== undefined) {
        value = val.numberValue;
      } else if (val.dateValue !== null && val.dateValue !== undefined) {
        value = val.dateValue;
      } else if (val.booleanValue !== null && val.booleanValue !== undefined) {
        value = val.booleanValue;
      } else if (val.jsonValue !== null && val.jsonValue !== undefined) {
        try {
          value = JSON.parse(val.jsonValue);
        } catch (e) {
          value = null;
        }
      }

      flat[key] = value;
    }

    return flat;
  }

  /**
   * Validates custom field values against tenant custom field definitions.
   * Returns a normalized list of database operations (UPSERT/DELETE).
   */
  static async validateCustomFieldValues(
    userId: string,
    customFields: Record<string, any>,
    tx?: any,
    options?: { autoCreateDropdownOptions?: boolean }
  ): Promise<Array<{ fieldId: string; action: "UPSERT" | "DELETE"; values?: any }>> {
    if (!customFields || typeof customFields !== "object") {
      return [];
    }

    const client = tx || prisma;

    // A. Load all custom fields defined by the tenant
    const fields = await client.contactCustomField.findMany({
      where: { userId }
    });

    const fieldMap = new Map<string, any>(fields.map((f: any) => [f.key, f]));
    const operations: Array<{ fieldId: string; action: "UPSERT" | "DELETE"; values?: any }> = [];

    for (const [key, value] of Object.entries(customFields)) {
      const field = fieldMap.get(key);

      // B. Reject unknown fields
      if (!field) {
        throw new Error(`Unknown custom field: ${key}`);
      }

      // C. Reject archived fields
      if (field.isArchived) {
        throw new Error(`Custom field '${key}' is archived.`);
      }

      // E. Null/undefined value means DELETE the record
      if (value === null || value === undefined) {
        operations.push({
          fieldId: field.id,
          action: "DELETE"
        });
        continue;
      }

      const valuesToWrite: any = {
        textValue: null,
        numberValue: null,
        dateValue: null,
        booleanValue: null,
        jsonValue: null
      };

      // D. Validate types
      switch (field.type) {
        case "TEXT": {
          const stringVal = String(value);
          if (stringVal.length > 1024) {
            throw new Error(`Value for '${key}' exceeds maximum length of 1024 characters.`);
          }
          valuesToWrite.textValue = stringVal;
          break;
        }
        case "NUMBER": {
          const numVal = Number(value);
          if (isNaN(numVal) || typeof value === "boolean" || value === "") {
            throw new Error(`Value for '${key}' must be a valid number.`);
          }
          valuesToWrite.numberValue = numVal;
          break;
        }
        case "DATE": {
          const time = Date.parse(value);
          if (isNaN(time)) {
            throw new Error(`Value for '${key}' must be a valid ISO date.`);
          }
          valuesToWrite.dateValue = new Date(time);
          break;
        }
        case "BOOLEAN": {
          if (typeof value !== "boolean") {
            throw new Error(`Value for '${key}' must be a boolean (true/false).`);
          }
          valuesToWrite.booleanValue = value;
          break;
        }
        case "DROPDOWN": {
          let dropdownVal = String(value).trim();
          const lowerVal = dropdownVal.toLowerCase();

          // Alias mapping conversions: accept aliases and store full names
          if (lowerVal === "ts" || lowerVal === "telangana") {
            dropdownVal = "Telangana";
          } else if (lowerVal === "ap" || lowerVal === "andhra pradesh") {
            dropdownVal = "Andhra Pradesh";
          } else if (lowerVal === "tn" || lowerVal === "tamil nadu") {
            dropdownVal = "Tamil Nadu";
          }

          const optionsList = parseOptions(field.options);
          
          let matchedOption = optionsList.find(
            opt => opt.trim().toLowerCase() === dropdownVal.toLowerCase()
          );

          if (!matchedOption) {
            if (options?.autoCreateDropdownOptions) {
              const updatedOptions = [...optionsList, dropdownVal];
              const stringifiedOptions = JSON.stringify(updatedOptions);

              const client = tx || prisma;
              await client.contactCustomField.update({
                where: { id: field.id },
                data: { options: stringifiedOptions }
              });

              matchedOption = dropdownVal;
              field.options = stringifiedOptions;
            } else {
              throw new Error(`Value '${value}' is not a valid option for dropdown '${key}'.`);
            }
          }

          valuesToWrite.textValue = matchedOption;
          break;
        }
        case "MULTI_SELECT": {
          if (!Array.isArray(value)) {
            throw new Error(`Value for '${key}' must be an array of strings.`);
          }
          const optionsList = parseOptions(field.options);

          const lowerOptions = optionsList.map(o => o.trim().toLowerCase());
          for (const item of value) {
            const trimmedItem = String(item).trim();
            if (!lowerOptions.includes(trimmedItem.toLowerCase())) {
              throw new Error(`Value '${item}' is not a valid option for multi-select '${key}'.`);
            }
          }

          valuesToWrite.jsonValue = JSON.stringify(value.map(item => String(item).trim()));
          break;
        }
        default:
          throw new Error(`Unsupported field type: ${field.type}`);
      }

      operations.push({
        fieldId: field.id,
        action: "UPSERT",
        values: valuesToWrite
      });
    }

    return operations;
  }
}
