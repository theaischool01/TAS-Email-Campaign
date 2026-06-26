import { CustomFieldMeta } from "./validator";

export interface CompilerContext {
  values: any[];
  parameterIndex: number;
  customFields: Map<string, CustomFieldMeta>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface CompilerOptions {
  mode: "COUNT" | "STREAM";
  cursorId?: string;
  batchSize?: number;
}

export class SegmentQueryCompiler {
  static compile(
    userId: string,
    criteria: any,
    fieldRegistry: Map<string, CustomFieldMeta>,
    options: CompilerOptions
  ): { sql: string; values: any[] } {
    const context: CompilerContext = {
      values: [userId], // Bind $1 to userId
      parameterIndex: 2,
      customFields: fieldRegistry
    };

    const whereClause = this.compileNode(criteria, context) || "1=1";

    let sql = "";
    if (options.mode === "COUNT") {
      sql = `SELECT COUNT(*)::integer AS count FROM contacts c WHERE c."userId" = $1 AND c.status = 'ACTIVE' AND (${whereClause})`;
    } else {
      let pageClause = "";
      if (options.cursorId) {
        const cursorParam = `$${context.parameterIndex++}`;
        context.values.push(options.cursorId);
        pageClause = `AND c.id > ${cursorParam} `;
      }
      
      const limitParam = `$${context.parameterIndex++}`;
      context.values.push(options.batchSize || 1000);

      sql = `SELECT c.id FROM contacts c WHERE c."userId" = $1 AND c.status = 'ACTIVE' ${pageClause}AND (${whereClause}) ORDER BY c.id ASC LIMIT ${limitParam}`;
    }

    return { sql, values: context.values };
  }

  private static compileNode(node: any, context: CompilerContext): string {
    if (!node || typeof node !== "object") return "";

    // Conjunction node: AND/OR
    if (node.conjunction && Array.isArray(node.rules)) {
      const parts = node.rules
        .map((r: any) => this.compileNode(r, context))
        .filter(Boolean);
      if (parts.length === 0) return "";
      return `(${parts.join(` ${node.conjunction} `)})`;
    }

    if (node.type === "GROUP") {
      const parts = node.rules
        .map((r: any) => this.compileNode(r, context))
        .filter(Boolean);
      if (parts.length === 0) return "";
      return `(${parts.join(` ${node.conjunction || "AND"} `)})`;
    }

    if (node.type === "RULE") {
      const { field, operator, value } = node;

      // 1. List rule compilation (using EXISTS)
      if (field === "list.id") {
        const param = `$${context.parameterIndex++}`;
        const listIds = Array.isArray(value) ? value : [value];
        context.values.push(listIds);

        const subQuery = `SELECT 1 FROM contact_list_members m WHERE m."contactId" = c.id AND m."contactListId" = ANY(${param}::text[])`;
        return operator === "not_in_list" ? `NOT EXISTS (${subQuery})` : `EXISTS (${subQuery})`;
      }

      // 2. Tag rule compilation (Relational)
      if (field === "contact.tags") {
        if (operator === "contains_any") {
          const param = `$${context.parameterIndex++}`;
          const tagList = Array.isArray(value) ? value : String(value).split(",").map(t => t.trim()).filter(Boolean);
          const slugs = tagList.map(t => slugify(t)).filter(Boolean);
          context.values.push(slugs);

          return `EXISTS (
            SELECT 1
            FROM contact_tags ct
            JOIN tags t ON t.id = ct."tagId"
            WHERE ct."contactId" = c.id
              AND t.slug = ANY(${param}::text[])
          )`;
        }

        if (operator === "contains_all") {
          const param = `$${context.parameterIndex++}`;
          const tagList = Array.isArray(value) ? value : String(value).split(",").map(t => t.trim()).filter(Boolean);
          const slugs = Array.from(new Set(tagList.map(t => slugify(t)).filter(Boolean)));
          context.values.push(slugs);

          const countParam = `$${context.parameterIndex++}`;
          context.values.push(slugs.length);

          return `(
            SELECT COUNT(DISTINCT t.slug)::integer
            FROM contact_tags ct
            JOIN tags t ON t.id = ct."tagId"
            WHERE ct."contactId" = c.id
              AND t.slug = ANY(${param}::text[])
          ) = ${countParam}`;
        }
        
        if (operator === "is_empty") {
          return `NOT EXISTS (
            SELECT 1 FROM contact_tags ct WHERE ct."contactId" = c.id
          )`;
        }
        if (operator === "is_not_empty") {
          return `EXISTS (
            SELECT 1 FROM contact_tags ct WHERE ct."contactId" = c.id
          )`;
        }

        if (operator === "equals") {
          const param = `$${context.parameterIndex++}`;
          context.values.push(slugify(String(value)));
          return `EXISTS (
            SELECT 1 FROM contact_tags ct 
            JOIN tags t ON t.id = ct."tagId"
            WHERE ct."contactId" = c.id AND t.slug = ${param}
          )`;
        }
        if (operator === "not_equals") {
          const param = `$${context.parameterIndex++}`;
          context.values.push(slugify(String(value)));
          return `NOT EXISTS (
            SELECT 1 FROM contact_tags ct 
            JOIN tags t ON t.id = ct."tagId"
            WHERE ct."contactId" = c.id AND t.slug = ${param}
          )`;
        }
        if (operator === "contains") {
          const param = `$${context.parameterIndex++}`;
          context.values.push(`%${value}%`);
          return `EXISTS (
            SELECT 1 FROM contact_tags ct 
            JOIN tags t ON t.id = ct."tagId"
            WHERE ct."contactId" = c.id AND t.name ILIKE ${param}
          )`;
        }
        if (operator === "not_contains") {
          const param = `$${context.parameterIndex++}`;
          context.values.push(`%${value}%`);
          return `NOT EXISTS (
            SELECT 1 FROM contact_tags ct 
            JOIN tags t ON t.id = ct."tagId"
            WHERE ct."contactId" = c.id AND t.name NOT ILIKE ${param}
          )`;
        }
      }

      // 3. System Contact fields
      if (field.startsWith("contact.")) {
        const colName = field.split(".")[1];
        // Whitelist safe column names
        const safeColumns = ["email", "firstName", "lastName", "phone", "company", "city"];
        if (!safeColumns.includes(colName)) {
          throw new Error(`Invalid system column: ${colName}`);
        }

        const dbCol = `c."${colName}"`;

        if (operator === "is_empty") {
          return `(${dbCol} IS NULL OR ${dbCol} = '')`;
        }
        if (operator === "is_not_empty") {
          return `(${dbCol} IS NOT NULL AND ${dbCol} != '')`;
        }

        const param = `$${context.parameterIndex++}`;
        let parsedVal = value;

        if (operator === "contains" || operator === "not_contains") {
          parsedVal = `%${value}%`;
        } else if (operator === "starts_with") {
          parsedVal = `${value}%`;
        } else if (operator === "ends_with") {
          parsedVal = `%${value}`;
        }

        context.values.push(parsedVal);

        if (operator === "equals") return `${dbCol} = ${param}`;
        if (operator === "not_equals") return `${dbCol} != ${param}`;
        if (operator === "contains") return `${dbCol} ILIKE ${param}`;
        if (operator === "not_contains") return `${dbCol} NOT ILIKE ${param}`;
        if (operator === "starts_with") return `${dbCol} ILIKE ${param}`;
        if (operator === "ends_with") return `${dbCol} ILIKE ${param}`;
      }

      // 4. Custom fields (compiled using EXISTS subqueries)
      if (field.startsWith("custom.")) {
        const customKey = field.split(".")[1]?.toLowerCase();
        const meta = context.customFields.get(customKey);
        if (!meta) {
          throw new Error(`Custom field registry missing for: ${customKey}`);
        }

        const fieldIdParam = `$${context.parameterIndex++}`;
        context.values.push(meta.id);

        let valueClause = "";
        
        // Multi-select matches JSONB arrays
        if (meta.type === "MULTI_SELECT") {
          if (operator === "is_empty") {
            valueClause = `(v."jsonValue" IS NULL OR v."jsonValue" = '' OR v."jsonValue" = '[]')`;
          } else if (operator === "is_not_empty") {
            valueClause = `(v."jsonValue" IS NOT NULL AND v."jsonValue" != '' AND v."jsonValue" != '[]')`;
          } else if (operator === "contains_any" || operator === "contains_all") {
            const param = `$${context.parameterIndex++}`;
            const targetArray = Array.isArray(value) ? value : [value];
            context.values.push(targetArray);
            const arrayOp = operator === "contains_any" ? "?|" : "?&";
            valueClause = `(v."jsonValue"::jsonb ${arrayOp} ${param}::text[])`;
          }
        } else {
          // Identify targeted column
          let col = "";
          if (meta.type === "TEXT" || meta.type === "DROPDOWN") col = `v."textValue"`;
          else if (meta.type === "NUMBER") col = `v."numberValue"`;
          else if (meta.type === "DATE") col = `v."dateValue"`;
          else if (meta.type === "BOOLEAN") col = `v."booleanValue"`;

          if (operator === "is_empty") {
            valueClause = `${col} IS NULL`;
          } else if (operator === "is_not_empty") {
            valueClause = `${col} IS NOT NULL`;
          } else if (operator === "between") {
            if (!Array.isArray(value) || value.length !== 2) {
              throw new Error(`Compiler expected value array of length 2 for 'between' operator, received: ${JSON.stringify(value)}`);
            }
            const param1 = `$${context.parameterIndex++}`;
            const param2 = `$${context.parameterIndex++}`;
            let val1 = value[0];
            let val2 = value[1];

            if (meta.type === "NUMBER") {
              val1 = Number(val1);
              val2 = Number(val2);
            } else if (meta.type === "DATE") {
              val1 = new Date(val1);
              val2 = new Date(val2);
            }

            context.values.push(val1, val2);
            valueClause = `${col} BETWEEN ${param1} AND ${param2}`;
          } else {
            const param = `$${context.parameterIndex++}`;
            let parsedVal: any = value;

            if (meta.type === "NUMBER") {
              parsedVal = Number(value);
            } else if (meta.type === "DATE") {
              parsedVal = new Date(value);
            } else if (meta.type === "BOOLEAN") {
              parsedVal = value === true || String(value).toLowerCase() === "true";
            } else if (meta.type === "TEXT" || meta.type === "DROPDOWN") {
              if (operator === "contains" || operator === "not_contains") {
                parsedVal = `%${value}%`;
              } else if (operator === "starts_with") {
                parsedVal = `${value}%`;
              } else if (operator === "ends_with") {
                parsedVal = `%${value}`;
              }
            }

            context.values.push(parsedVal);

            if (operator === "equals") valueClause = `${col} = ${param}`;
            else if (operator === "not_equals") valueClause = `${col} != ${param}`;
            else if (operator === "greater_than") valueClause = `${col} > ${param}`;
            else if (operator === "less_than") valueClause = `${col} < ${param}`;
            else if (operator === "greater_than_or_equal") valueClause = `${col} >= ${param}`;
            else if (operator === "less_than_or_equal") valueClause = `${col} <= ${param}`;
            else if (operator === "before") valueClause = `${col} < ${param}`;
            else if (operator === "after") valueClause = `${col} > ${param}`;
            else if (operator === "contains") valueClause = `${col} ILIKE ${param}`;
            else if (operator === "not_contains") valueClause = `${col} NOT ILIKE ${param}`;
            else if (operator === "starts_with") valueClause = `${col} ILIKE ${param}`;
            else if (operator === "ends_with") valueClause = `${col} ILIKE ${param}`;
          }
        }

        return `EXISTS (SELECT 1 FROM contact_field_values v WHERE v."contactId" = c.id AND v."fieldId" = ${fieldIdParam} AND ${valueClause})`;
      }
    }

    return "";
  }
}
