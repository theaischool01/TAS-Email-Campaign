export interface SegmentRule {
  type: "RULE";
  field: string;
  operator: string;
  value?: any;
}

export interface SegmentRuleGroup {
  conjunction: "AND" | "OR";
  rules: Array<SegmentRule | SegmentRuleGroup>;
}

export interface CustomFieldSchema {
  id: string;
  key: string;
  displayName: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "DROPDOWN" | "DATE" | "MULTI_SELECT" | string;
  options?: string[] | any;
}
