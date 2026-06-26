import { z } from "zod";

const OptionSchema = z.string()
  .trim()
  .min(1, "Option cannot be empty")
  .max(100, "Option cannot exceed 100 characters")
  .refine(val => !/[\x00-\x1F\x7F]/.test(val), "Option contains invalid control characters");

const OptionsArraySchema = z.array(OptionSchema)
  .min(1, "Must contain at least 1 option")
  .refine(arr => {
    const lowers = arr.map(opt => opt.toLowerCase());
    return new Set(lowers).size === lowers.length;
  }, { message: "Options must not contain duplicate values (case-insensitive)" });

const BaseFieldSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(50, "Display name cannot exceed 50 characters"),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().trim().optional().nullable(),
  validationType: z.enum(["NONE", "EMAIL", "PHONE", "URL"]).default("NONE"),
  validationRegex: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0)
});

export const CreateCustomFieldSchema = z.discriminatedUnion("type", [
  BaseFieldSchema.extend({
    type: z.literal("TEXT"),
    options: z.null().optional()
  }),
  BaseFieldSchema.extend({
    type: z.literal("NUMBER"),
    options: z.null().optional()
  }),
  BaseFieldSchema.extend({
    type: z.literal("DATE"),
    options: z.null().optional()
  }),
  BaseFieldSchema.extend({
    type: z.literal("BOOLEAN"),
    options: z.null().optional()
  }),
  BaseFieldSchema.extend({
    type: z.literal("DROPDOWN"),
    options: OptionsArraySchema
  }),
  BaseFieldSchema.extend({
    type: z.literal("MULTI_SELECT"),
    options: OptionsArraySchema.max(50, "Multi-select cannot have more than 50 options")
  })
]);

export const PatchCustomFieldSchema = z.object({
  displayName: z.string().trim().min(1, "Display name cannot be empty").max(50, "Display name cannot exceed 50 characters").optional(),
  isRequired: z.boolean().optional(),
  options: z.array(OptionSchema).min(1).optional()
    .refine(arr => {
      if (!arr) return true;
      const lowers = arr.map(opt => opt.toLowerCase());
      return new Set(lowers).size === lowers.length;
    }, { message: "Options must not contain duplicate values (case-insensitive)" }),
  displayOrder: z.number().int().optional(),
  isArchived: z.boolean().optional()
});

export const ReorderCustomFieldSchema = z.array(
  z.object({
    id: z.string().cuid("Invalid field ID"),
    displayOrder: z.number().int("Display order must be an integer")
  })
);
