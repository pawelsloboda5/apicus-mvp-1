// automationTemplateSchema.ts
// -------------------------------------------------------------
// Schema (TypeScript interface) for documents in the `apicus-templates`
// collection stored in Azure Cosmos DB for MongoDB. The design aligns
// with our front-end FlowNode/FlowEdge models so that templates can be
// rendered directly on the React Flow canvas once imported.
// -------------------------------------------------------------

/**
 * A single step inside an automation template (e.g. Zapier step).
 */
export interface TemplateStep {
  /** Zero-based order of the step in the template */
  index: number;
  /** Human-readable label, e.g. "Send Email" */
  label: string;
  /** Action/key identifying the operation in the source platform */
  action: string;
  /** CRUD-like category (trigger/read/write/search/etc.) */
  typeOf: string;
  /** App metadata */
  appId: string;
  appName: string;
  appSlug: string;
}

/**
 * Lightweight representation of a React-Flow node for template preview.
 * Mirrors the shape used in lib/db.ts minus db-specific fields.
 */
export interface TemplateNode {
  reactFlowId: string;
  type: "trigger" | "action" | "decision" | string;
  label: string;
  platformMeta?: unknown;
  data: unknown;
  position: { x: number; y: number };
}

/**
 * Lightweight representation of a React-Flow edge for template preview.
 */
export interface TemplateEdge {
  reactFlowId: string;
  label?: string;
  platformMeta?: unknown;
  data: unknown;
}

/**
 * Main automation template document stored in the `apicus-templates`
 * collection. This structure is intentionally denormalised to make
 * semantic search queries and template rendering straightforward.
 */
export interface AutomationTemplate {
  /** Original template identifier from the source platform */
  templateId: string;
  /** "Send emails via Gmail when Google Sheets rows are updated" */
  title: string;
  /** URL slug or canonical path used by the platform */
  url?: string;
  /** Direct editor URL if available */
  editorUrl?: string;
  /** e.g. "zapier", "make", "n8n", or "internal" */
  source: string;

  /** Minimal natural-language summary used for semantic matching */
  richDescription: string;

  /**
   * Example natural-language queries a non-technical user might type that
   * should map to this template. These help generate and evaluate search
   * embeddings (they are included when computing the vector).
   * e.g. [
   *   "Send welcome emails whenever a new spreadsheet row is added",
   *   "Notify customers by email when Google Sheets is updated"
   * ]
   */
  exampleUserPrompts?: string[];

  /** Step-level metadata */
  steps: TemplateStep[];
  appIds: string[];
  appNames: string[];
  stepCount: number;
  firstStepType: string;
  lastStepType: string;
  stepSequence: string[];

  /** Optional React-Flow representation for instant canvas import */
  nodes?: TemplateNode[];
  edges?: TemplateEdge[];

  /**
   * Vector embedding for semantic search (Azure Cognitive Search / Atlas).
   * Stored as an array of 1536 floats (OpenAI text-embedding-3 small model)
   */
  embedding?: number[];

  /** ISO timestamps */
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
} 