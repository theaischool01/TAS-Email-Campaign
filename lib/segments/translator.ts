export function translateLegacyToCriteria(
  listIds: string[],
  includedTags: string[]
): any {
  const rules: any[] = [];

  // 1. Map target lists
  if (listIds && listIds.length > 0) {
    rules.push({
      type: "RULE",
      field: "list.id",
      operator: "in_list",
      value: listIds
    });
  }

  // 2. Map target tags (ANY of these tags -> contains_any)
  if (includedTags && includedTags.length > 0) {
    rules.push({
      type: "RULE",
      field: "contact.tags",
      operator: "contains_any",
      value: includedTags
    });
  }

  // Return root AND conjunction group
  return {
    conjunction: "AND",
    rules
  };
}
