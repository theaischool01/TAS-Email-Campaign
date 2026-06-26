export const RESERVED_KEYS = new Set([
  "id",
  "email",
  "first_name",
  "firstname",
  "last_name",
  "lastname",
  "name",
  "phone",
  "company",
  "city",
  "tags",
  "status",
  "source",
  "userid",
  "createdat",
  "updatedat",
  "softbouncecount",
  "lists",
  "activities",
  "deliveries"
]);

export function isReservedField(key: string): boolean {
  if (!key) return false;
  const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return RESERVED_KEYS.has(normalizedKey);
}
