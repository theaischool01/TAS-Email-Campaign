import { validateEmail } from "@/lib/email-validator";
import { CustomValueService } from "../custom-fields/value-service";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s\-\/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface ImportMapping {
  action: "SYSTEM" | "MAP_CUSTOM_FIELD" | "IGNORE";
  field?: string;
  fieldId?: string;
}

export class ImportService {
  static async importContacts(
    userId: string,
    targetListId: string,
    rows: any[],
    mappings: Record<string, ImportMapping>,
    prisma: any,
    options?: { autoCreateDropdownOptions?: boolean }
  ) {
    const counts = {
      total: rows.length,
      newContactsCreated: 0,
      existingContactsUpdated: 0,
      existingContactsAddedToList: 0,
      alreadyInList: 0,
      ignored: 0,
      failed: 0,
    };

    const errors: Array<{ row: number; email?: string; error: string }> = [];

    const addError = (rowIdx: number, email: string | undefined, message: string) => {
      counts.failed++;
      if (errors.length < 100) {
        errors.push({
          row: rowIdx + 1,
          email,
          error: message,
        });
      }
    };

    // 1. Load custom fields for validation and mapping lookup
    const allCustomFields = await prisma.contactCustomField.findMany({
      where: { userId, isArchived: false },
    });

    const customFieldsById = new Map<string, any>(
      allCustomFields.map((f: any) => [f.id, f])
    );
    const customFieldsByKey = new Map<string, any>(
      allCustomFields.map((f: any) => [f.key.toLowerCase(), f])
    );

    // 2. Resolve field mappings
    // Find column names mapping to system fields
    let emailCol: string | null = null;
    let nameCol: string | null = null;
    let firstNameCol: string | null = null;
    let lastNameCol: string | null = null;
    let phoneCol: string | null = null;
    let companyCol: string | null = null;
    let cityCol: string | null = null;
    let tagsCol: string | null = null;

    // Track custom field mappings: csvHeader -> CustomField object
    const customFieldMappings: Array<{ csvHeader: string; field: any }> = [];

    for (const [csvHeader, mapVal] of Object.entries(mappings)) {
      if (mapVal.action === "SYSTEM") {
        const fieldName = mapVal.field;
        if (fieldName === "email") emailCol = csvHeader;
        else if (fieldName === "name") nameCol = csvHeader;
        else if (fieldName === "firstName" || fieldName === "firstname" || fieldName === "first_name") firstNameCol = csvHeader;
        else if (fieldName === "lastName" || fieldName === "lastname" || fieldName === "last_name") lastNameCol = csvHeader;
        else if (fieldName === "phone") phoneCol = csvHeader;
        else if (fieldName === "company") companyCol = csvHeader;
        else if (fieldName === "city") cityCol = csvHeader;
        else if (fieldName === "tags") tagsCol = csvHeader;
      } else if (mapVal.action === "MAP_CUSTOM_FIELD") {
        const field = mapVal.fieldId ? customFieldsById.get(mapVal.fieldId) : null;
        if (field) {
          customFieldMappings.push({ csvHeader, field });
        }
      }
    }

    // Fallback headers mapping for compatibility if mappings parameter is empty or missing
    if (Object.keys(mappings).length === 0 && rows.length > 0) {
      const firstRowKeys = Object.keys(rows[0]);
      for (const key of firstRowKeys) {
        const norm = key.trim().toLowerCase();
        if (norm === "email") emailCol = key;
        else if (norm === "name") nameCol = key;
        else if (norm === "firstname" || norm === "first name" || norm === "first_name") firstNameCol = key;
        else if (norm === "lastname" || norm === "last name" || norm === "last_name") lastNameCol = key;
        else if (norm === "phone") phoneCol = key;
        else if (norm === "company") companyCol = key;
        else if (norm === "city") cityCol = key;
        else if (norm === "tags") tagsCol = key;
        else {
          // Check if key matches custom field key
          const customField = customFieldsByKey.get(norm) || customFieldsByKey.get(normalizeHeader(key));
          if (customField) {
            customFieldMappings.push({ csvHeader: key, field: customField });
          }
        }
      }
    }

    if (!emailCol) {
      throw new Error("Missing email column mapping.");
    }

    const BATCH_SIZE = 100;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const chunkOffset = i;

      const validRows: Array<{
        rowIdx: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        company: string | null;
        city: string | null;
        tags: string | null;
        customFields: Record<string, any>;
      }> = [];

      // Validate emails & extract base parameters in parallel
      const validationPromises = chunk.map(async (row, idx) => {
        const rowIdx = chunkOffset + idx;
        const rawEmail = (row[emailCol!] ?? "").trim();
        if (!rawEmail) {
          addError(rowIdx, undefined, "Email address is missing or empty.");
          return null;
        }

        const valResult = await validateEmail(rawEmail);
        if (!valResult.isValid) {
          addError(rowIdx, rawEmail, valResult.error || "Invalid email format.");
          return null;
        }

        let firstName: string | null = null;
        let lastName: string | null = null;

        if (nameCol && row[nameCol]) {
          const parts = row[nameCol].trim().split(/\s+/);
          firstName = parts[0] || null;
          lastName = parts.slice(1).join(" ") || null;
        } else {
          if (firstNameCol && row[firstNameCol]) {
            firstName = row[firstNameCol].trim() || null;
          }
          if (lastNameCol && row[lastNameCol]) {
            lastName = row[lastNameCol].trim() || null;
          }
        }

        const phone = phoneCol && row[phoneCol] ? row[phoneCol].trim() || null : null;
        const company = companyCol && row[companyCol] ? row[companyCol].trim() || null : null;
        const city = cityCol && row[cityCol] ? row[cityCol].trim() || null : null;

        const rawTags = tagsCol ? (row[tagsCol] ?? "").trim() : "";
        const sanitizedTags = rawTags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
          .join(",");

        // Extract custom fields, ignoring empty cells ("" / null / undefined)
        const customFields: Record<string, any> = {};
        for (const mapping of customFieldMappings) {
          const val = row[mapping.csvHeader];
          if (val !== undefined && val !== null && val !== "") {
            customFields[mapping.field.key] = val;
          }
        }

        return {
          rowIdx,
          email: rawEmail.toLowerCase(),
          firstName,
          lastName,
          phone,
          company,
          city,
          tags: sanitizedTags || null,
          customFields,
        };
      });

      const resolvedBatch = await Promise.all(validationPromises);
      for (const item of resolvedBatch) {
        if (item) {
          validRows.push(item);
        }
      }

      if (validRows.length === 0) continue;

      try {
        const emails = validRows.map((r) => r.email);

        // Fetch existing contacts including their current custom values
        const existingContacts = await prisma.contact.findMany({
          where: {
            userId,
            email: { in: emails },
          },
          include: {
            customFieldValues: true,
          },
        });

        const existingMap = new Map<string, any>(
          existingContacts.map((c: any) => [c.email.toLowerCase(), c])
        );

        // Fetch existing memberships for targetListId
        const existingMemberships = await prisma.contactListMember.findMany({
          where: {
            contactListId: targetListId,
            contactId: { in: existingContacts.map((c: any) => c.id) },
          },
          select: {
            contactId: true,
          },
        });

        const existingMembershipsSet = new Set<string>(
          existingMemberships.map((m: any) => m.contactId)
        );

        // Separate and execute row validation/custom validations
        const newContactsData: any[] = [];
        const updatesToExecute: any[] = [];
        const membershipsToCreate: any[] = [];

        for (const row of validRows) {
          const matched = existingMap.get(row.email);

          // Required field checks & custom field validations
          try {
            // Apply required checks for all defined custom fields
            for (const field of allCustomFields) {
              if (field.isRequired) {
                const csvVal = row.customFields[field.key];
                const hasCsvVal = csvVal !== undefined && csvVal !== null && csvVal !== "";

                if (matched) {
                  // Existing contact validation
                  const existingRecord = matched.customFieldValues.find(
                    (v: any) => v.fieldId === field.id
                  );
                  // Must have a value in CSV, exist in database, or have a default value
                  const hasDbVal = existingRecord && (
                    existingRecord.textValue !== null ||
                    existingRecord.numberValue !== null ||
                    existingRecord.dateValue !== null ||
                    existingRecord.booleanValue !== null ||
                    existingRecord.jsonValue !== null
                  );
                  if (!hasCsvVal && !hasDbVal && !field.defaultValue) {
                    throw new Error(`Required custom field '${field.displayName}' is missing.`);
                  }
                } else {
                  // New contact validation
                  if (!hasCsvVal && !field.defaultValue) {
                    throw new Error(`Required custom field '${field.displayName}' is missing.`);
                  }
                }
              }
            }

            // Run type coercions/validations via CustomValueService
            const operations = await CustomValueService.validateCustomFieldValues(
              userId,
              row.customFields,
              prisma,
              options
            );

            // Filter out DELETE operations to prevent deleting values
            const upsertOps = operations.filter((op) => op.action === "UPSERT");

            if (matched) {
              const hasMembership = existingMembershipsSet.has(matched.id);
              if (hasMembership) {
                counts.alreadyInList++;
              } else {
                membershipsToCreate.push({
                  contactListId: targetListId,
                  contactId: matched.id,
                });
                counts.existingContactsAddedToList++;
              }

              // Build contact update payload
              const updateData: any = {};
              if (row.firstName !== null) updateData.firstName = row.firstName;
              if (row.lastName !== null) updateData.lastName = row.lastName;
              if (row.phone !== null) updateData.phone = row.phone;
              if (row.company !== null) updateData.company = row.company;
              if (row.city !== null) updateData.city = row.city;

              updatesToExecute.push({
                contactId: matched.id,
                email: row.email,
                updateData,
                upsertOps,
                tags: row.tags,
              });
            } else {
              newContactsData.push({
                rowIdx: row.rowIdx,
                email: row.email,
                firstName: row.firstName,
                lastName: row.lastName,
                phone: row.phone,
                company: row.company,
                city: row.city,
                tags: row.tags,
                upsertOps,
              });
            }
          } catch (err: any) {
            addError(row.rowIdx, row.email, err.message || "Custom field validation failed.");
          }
        }

        // Run transaction for this batch
        await prisma.$transaction(async (tx: any) => {
          // 1. Process Updates for Existing Contacts
          for (const item of updatesToExecute) {
            // Update contact profile fields if changed
            if (Object.keys(item.updateData).length > 0) {
              await tx.contact.update({
                where: { id: item.contactId },
                data: item.updateData,
              });
            }

            // Sync relational tags
            if (item.tags) {
              const tagList = item.tags.split(",").map((t: any) => t.trim()).filter(Boolean);
              for (const name of tagList) {
                const slug = slugify(name);
                if (!slug) continue;
                let tag = await tx.tag.findUnique({
                  where: { userId_slug: { userId, slug } }
                });
                if (!tag) {
                  tag = await tx.tag.create({
                    data: { name, slug, userId, color: "#3B82F6" }
                  });
                }
                await tx.contactTag.upsert({
                  where: { contactId_tagId: { contactId: item.contactId, tagId: tag.id } },
                  update: {},
                  create: { contactId: item.contactId, tagId: tag.id }
                });
              }
            }

            // Write custom field values
            for (const op of item.upsertOps) {
              await tx.contactFieldValue.upsert({
                where: {
                  contactId_fieldId: {
                    contactId: item.contactId,
                    fieldId: op.fieldId,
                  },
                },
                update: op.values,
                create: {
                  contactId: item.contactId,
                  fieldId: op.fieldId,
                  ...op.values,
                },
              });
            }
            counts.existingContactsUpdated++;
          }

          // 2. Create missing new contacts
          let newMemberships: any[] = [];
          let newCreatedMap = new Map<string, string>();

          if (newContactsData.length > 0) {
            const contactsToInsert = newContactsData.map((c) => ({
              email: c.email,
              userId,
              firstName: c.firstName,
              lastName: c.lastName,
              phone: c.phone,
              company: c.company,
              city: c.city,
              status: "ACTIVE",
              source: "IMPORT",
            }));

            await tx.contact.createMany({
              data: contactsToInsert,
              skipDuplicates: true,
            });

            // Fetch newly created contacts to get their IDs
            const newEmails = newContactsData.map((c) => c.email);
            const newCreatedContacts = await tx.contact.findMany({
              where: {
                userId,
                email: { in: newEmails },
              },
              select: {
                id: true,
                email: true,
              },
            });

            newCreatedMap = new Map<string, string>(
              newCreatedContacts.map((c: any) => [c.email.toLowerCase(), c.id])
            );

            // Add new memberships
            newMemberships = newCreatedContacts.map((c: any) => ({
              contactListId: targetListId,
              contactId: c.id,
            }));

            // Write custom field values for new contacts
            for (const c of newContactsData) {
              const contactId = newCreatedMap.get(c.email);
              if (contactId) {
                for (const op of c.upsertOps) {
                  await tx.contactFieldValue.upsert({
                    where: {
                      contactId_fieldId: {
                        contactId,
                        fieldId: op.fieldId,
                      },
                    },
                    update: op.values,
                    create: {
                      contactId,
                      fieldId: op.fieldId,
                      ...op.values,
                    },
                  });
                }

                // Write tag relationships for the new contact
                if (c.tags) {
                  const tagList = c.tags.split(",").map((t: any) => t.trim()).filter(Boolean);
                  for (const name of tagList) {
                    const slug = slugify(name);
                    if (!slug) continue;
                    let tag = await tx.tag.findUnique({
                      where: { userId_slug: { userId, slug } }
                    });
                    if (!tag) {
                      tag = await tx.tag.create({
                        data: { name, slug, userId, color: "#3B82F6" }
                      });
                    }
                    await tx.contactTag.upsert({
                      where: { contactId_tagId: { contactId, tagId: tag.id } },
                      update: {},
                      create: { contactId, tagId: tag.id }
                    });
                  }
                }
              }
            }

            counts.newContactsCreated += newCreatedContacts.length;
          }

          // Create all memberships (for both new and existing contacts in this batch)
          const allMembershipsToCreate = [...newMemberships, ...membershipsToCreate];

          if (allMembershipsToCreate.length > 0) {
            await tx.contactListMember.createMany({
              data: allMembershipsToCreate,
              skipDuplicates: true,
            });
            await tx.contactToContactList.createMany({
              data: allMembershipsToCreate.map((m: any) => ({
                A: m.contactId,
                B: m.contactListId,
              })),
              skipDuplicates: true,
            });
          }
        }, {
          maxWait: 60000,
          timeout: 60000
        });
      } catch (batchErr: any) {
        console.error(`❌ Ingestion failed for batch offset ${i}:`, batchErr);
        for (const row of chunk) {
          addError(chunkOffset + chunk.indexOf(row), row[emailCol!], batchErr.message || "Database batch insert failed.");
        }
      }
    }

    return {
      success: true,
      results: counts,
      errors,
    };
  }
}
