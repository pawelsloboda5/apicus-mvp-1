import { nanoid } from 'nanoid';
import { Node, Edge } from '@xyflow/react';
import { ImportedWorkflow, ImportError, NODE_TYPE_MAP } from '../types';
import { autoLayout } from '../layout';

type N8nNode = {
  id?: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  typeVersion?: number;
  disabled?: boolean;
};

type N8nConnections = Record<
  string,
  {
    main?: Array<
      Array<{
        node: string;
        type?: string;
        index?: number;
      }>
    >;
  }
>;

interface N8nLikeWorkflow {
  name?: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: unknown;
  staticData?: unknown;
  pinData?: unknown;
}

function mapType(n8nType: string): 'trigger' | 'action' | 'decision' {
  const map = NODE_TYPE_MAP.n8n;
  // exact key match first
  if (map[n8nType as keyof typeof map]) {
    return map[n8nType as keyof typeof map] as 'trigger' | 'action' | 'decision';
  }
  const lower = n8nType.toLowerCase();
  if (lower.includes('trigger')) return 'trigger';
  if (lower.includes('if') || lower.includes('switch') || lower.includes('split')) return 'decision';
  return 'action';
}

function toTitleCaseWords(input: string): string {
  // Split camelCase into words and capitalize
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/);
  return words
    .map((w) => (w.toLowerCase() === 'http' ? 'HTTP' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function extractApp(n8nType: string): string {
  const raw = n8nType.split('.').pop() || n8nType;
  // Friendly names for common n8n base nodes
  const map: Record<string, string> = {
    httpRequest: 'HTTP',
    webhook: 'Webhook',
    webhookTrigger: 'Webhook',
    cronTrigger: 'Cron',
    emailTrigger: 'Email',
    splitInBatches: 'Split',
    merge: 'Merge',
    set: 'Set',
    function: 'Function',
    code: 'Code',
    if: 'If',
    switch: 'Switch',
  };
  return map[raw] || toTitleCaseWords(raw);
}

function mapTypeOf(n8nType: string, parameters?: Record<string, unknown>): string | undefined {
  const last = (n8nType.split('.').pop() || '').toLowerCase();
  if (last.includes('webhook')) return 'webhook';
  if (last === 'httprequest') return 'api';
  if (last === 'merge') return 'merge';
  if (last === 'function' || last === 'code' || last === 'set') return 'transform';
  if (last.includes('email')) return 'messaging';
  // Parameters sometimes include an operation which can hint intent
  const op = parameters && typeof parameters === 'object' && 'operation' in parameters
    ? String((parameters as Record<string, unknown>)['operation']).toLowerCase()
    : undefined;
  if (op?.includes('get') || op?.includes('request') || op?.includes('fetch')) return 'api';
  if (op?.includes('send')) return 'messaging';
  return undefined;
}

export function parseN8nWorkflow(data: unknown): ImportedWorkflow {
  if (!data || typeof data !== 'object') {
    throw new ImportError('Invalid n8n workflow format', 'INVALID_FORMAT');
  }
  const wf = data as Partial<N8nLikeWorkflow>;
  if (!Array.isArray(wf.nodes) || typeof wf.connections !== 'object') {
    throw new ImportError('Invalid n8n workflow: missing nodes/connections', 'INVALID_FORMAT');
  }

  const nameToId = new Map<string, string>();
  const nodes: Node[] = [];

  wf.nodes.forEach((n) => {
    const nodeId = n.id || `node-${nanoid(6)}`;
    nameToId.set(n.name, nodeId);
    const [x, y] = Array.isArray(n.position) ? n.position : [0, 0];
    const nodeType = mapType(n.type);
    nodes.push({
      id: nodeId,
      type: nodeType,
      position: { x, y },
      data: {
        label: n.name,
        appName: extractApp(n.type),
        action:
          n.parameters && typeof n.parameters === 'object' && 'operation' in n.parameters
            ? String((n.parameters as Record<string, unknown>)['operation'])
            : extractApp(n.type),
        platform: 'n8n',
        typeOf: mapTypeOf(n.type, n.parameters),
        platformMeta: {
          platform: 'n8n',
          type: n.type,
          typeVersion: n.typeVersion,
          disabled: n.disabled,
          credentials: n.credentials,
          rawParameters: n.parameters,
        },
      },
    });
  });

  const edges: Edge[] = [];
  const conns = wf.connections as N8nConnections;
  Object.entries(conns).forEach(([fromName, outputs]) => {
    const fromId = nameToId.get(fromName);
    if (!fromId) return;
    const mains = outputs.main || [];
    for (const outputGroup of mains) {
      for (const conn of outputGroup || []) {
        const toId = nameToId.get(conn.node);
        if (!toId) continue;
        edges.push({
          id: `edge-${nanoid(6)}`,
          source: fromId,
          target: toId,
          type: 'custom',
        });
      }
    }
  });

  const needsLayout = nodes.every((n) => n.position.x === 0 && n.position.y === 0);
  const finalNodes = needsLayout ? autoLayout(nodes, edges) : nodes;

  return {
    nodes: finalNodes,
    edges,
    metadata: {
      platform: 'n8n',
      originalName: wf.name || 'Imported n8n Workflow',
      importDate: Date.now(),
      originalData: data,
      nodeCount: finalNodes.length,
    },
  };
}


