export function generateCustomFieldKey(displayName: string): string {
  if (!displayName) return "";
  let key = displayName.trim().toLowerCase();
  
  // Replace spaces, hyphens, and slashes with underscores
  key = key.replace(/[\s\-\/]+/g, "_");
  
  // Remove unsupported characters (keep only alphanumeric and underscores)
  key = key.replace(/[^a-z0-9_]/g, "");
  
  // Collapse multiple underscores
  key = key.replace(/_+/g, "_");
  
  // Remove leading/trailing underscores
  key = key.replace(/^_+|_+$/g, "");
  
  return key;
}
