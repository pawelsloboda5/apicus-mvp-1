import { z } from 'zod';
import { Node, Edge } from '@xyflow/react';

// Common types
export type Platform = 'make' | 'n8n' | 'zapier';

export interface ImportedWorkflow {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    platform: Platform;
    originalName: string;
    importDate: number;
    originalData?: unknown;
    nodeCount: number;
    estimatedMinutes?: number;
  };
}

export interface ParseResult {
  success: boolean;
  data?: ImportedWorkflow;
  error?: string;
}

// Make.com (Integromat) schemas
export const MakeModuleSchema = z.object({
  id: z.number(),
  module: z.string(),
  version: z.number().optional(),
  parameters: z.record(z.unknown()).optional(),
  mapper: z.record(z.unknown()).optional(),
  metadata: z.object({
    designer: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
  }).optional(),
  routes: z.array(z.object({
    flow: z.array(z.lazy(() => MakeModuleSchema)),
  })).optional(),
});

export const MakeConnectionSchema = z.object({
  id: z.number().optional(),
  source: z.number(),
  target: z.number(),
});

export const MakeBlueprintSchema = z.object({
  name: z.string(),
  flow: z.array(MakeModuleSchema),
  metadata: z.object({
    version: z.number().optional(),
  }).optional(),
});

// n8n schemas
export const N8nNodeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  position: z.tuple([z.number(), z.number()]),
  parameters: z.record(z.unknown()).optional(),
  credentials: z.record(z.unknown()).optional(),
  disabled: z.boolean().optional(),
  typeVersion: z.number().optional(),
});

export const N8nConnectionSchema = z.record(
  z.object({
    main: z.array(
      z.array(
        z.object({
          node: z.string(),
          type: z.string().optional(),
          index: z.number().optional(),
        })
      )
    ).optional(),
  })
);

export const N8nWorkflowSchema = z.object({
  name: z.string(),
  nodes: z.array(N8nNodeSchema),
  connections: N8nConnectionSchema,
  settings: z.record(z.unknown()).optional(),
  staticData: z.unknown().optional(),
  pinData: z.record(z.unknown()).optional(),
});

// Zapier schemas
export const ZapierStepSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'action', 'filter', 'path']),
  app: z.string().optional(),
  action: z.string().optional(),
  position: z.number(),
  name: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

export const ZapierZapSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string().optional(),
  steps: z.array(ZapierStepSchema),
});

export const ZapierExportSchema = z.object({
  zaps: z.array(ZapierZapSchema),
  export_version: z.string().optional(),
  exported_at: z.string().optional(),
});

// Node type mappings for each platform
export const NODE_TYPE_MAP = {
  make: {
    'webhooks:WebHook': 'trigger',
    'webhook': 'trigger',
    'router': 'decision',
    'filter': 'decision',
    'flow-control': 'decision',
    'iterator': 'action',
    'aggregator': 'action',
    'json': 'action',
    'http': 'action',
    'sleep': 'action',
    // Default mapping
    default: 'action',
  },
  n8n: {
    'n8n-nodes-base.webhook': 'trigger',
    'n8n-nodes-base.webhookTrigger': 'trigger',
    'n8n-nodes-base.cronTrigger': 'trigger',
    'n8n-nodes-base.emailTrigger': 'trigger',
    'n8n-nodes-base.if': 'decision',
    'n8n-nodes-base.switch': 'decision',
    'n8n-nodes-base.splitInBatches': 'decision',
    'n8n-nodes-base.merge': 'action',
    'n8n-nodes-base.httpRequest': 'action',
    'n8n-nodes-base.set': 'action',
    'n8n-nodes-base.function': 'action',
    'n8n-nodes-base.code': 'action',
    // Default mapping
    default: 'action',
  },
  zapier: {
    'trigger': 'trigger',
    'action': 'action',
    'filter': 'decision',
    'path': 'decision',
    'formatter': 'action',
    'delay': 'action',
    // Default mapping
    default: 'action',
  },
} as const;

// Error types
export class ImportError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_FORMAT' | 'UNSUPPORTED_PLATFORM' | 'PARSE_ERROR' | 'FILE_TOO_LARGE',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

// File size limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_NODES = 1000;

// Auto-layout configuration
export interface LayoutConfig {
  direction: 'TB' | 'LR';
  nodeSpacing: number;
  rankSpacing: number;
  animate: boolean;
} 