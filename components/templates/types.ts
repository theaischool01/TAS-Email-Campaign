export interface ImageSettings {
  fit?: 'cover' | 'contain' | 'fill';
  zoom?: number;
  objectPosition?: {
    x: number;
    y: number;
  };
}

export interface TemplateBlock {
  id: string;
  type: string;
  content: Record<string, any>;
  styles: Record<string, any>;
  children?: TemplateBlock[];
}

export interface ParseResult {
  blocks: TemplateBlock[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
}

