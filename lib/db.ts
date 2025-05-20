import Dexie, { Table } from "dexie";
import { nanoid } from "nanoid";

/**
 * Dexie database instance for Apicus
 *
 * Tables:
 * 1. scenarios  - High-level ROI scenarios created by a user
 * 2. nodes      - React Flow nodes belonging to a scenario
 * 3. edges      - React Flow edges belonging to a scenario
 *
 * All tables use numeric primary keys (auto-increment) except where noted.
 */
export interface Scenario {
  id?: number; // Autoincrement
  slug: string; // nanoid string to use as URL param
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Selected automation platform */
  platform?: "zapier" | "make" | "n8n";
  // JSON payload of questionnaire inputs and computed ROI results
  payload: unknown;
}

export interface FlowNode {
  id?: number;
  scenarioId: number;
  reactFlowId: string; // id used by React Flow
  /** trigger | action | decision (branch) etc. */
  type: "trigger" | "action" | "decision";
  label: string;
  /** Additional metadata specific to platform or app */
  platformMeta?: unknown;
  data: unknown; // Raw node data for React Flow
  position: { x: number; y: number };
}

export interface FlowEdge {
  id?: number;
  scenarioId: number;
  reactFlowId: string;
  label?: string;
  platformMeta?: unknown;
  data: unknown;
}

class ApicusDB extends Dexie {
  scenarios!: Table<Scenario, number>;
  nodes!: Table<FlowNode, number>;
  edges!: Table<FlowEdge, number>;

  constructor() {
    super("ApicusDB");

    // Version 1 schema
    this.version(1).stores({
      scenarios: "++id, slug, updatedAt",
      nodes: "++id, scenarioId, reactFlowId",
      edges: "++id, scenarioId, reactFlowId",
    });

    // Version 2 – add platform index
    this.version(2)
      .stores({
        scenarios: "++id, slug, updatedAt, platform",
        nodes: "++id, scenarioId, reactFlowId",
        edges: "++id, scenarioId, reactFlowId",
      })
      .upgrade(tx => {
        tx.table("scenarios").toCollection().modify((sc: any) => {
          if (!("platform" in sc)) sc.platform = "zapier";
        });
      });

    // Version 3 – add node.type index for quicker filtering
    this.version(3)
      .stores({
        scenarios: "++id, slug, updatedAt, platform",
        nodes: "++id, scenarioId, reactFlowId, type",
        edges: "++id, scenarioId, reactFlowId",
      });
  }
}

export const db = new ApicusDB();

/**
 * Helper to create a new scenario skeleton and return its numeric id.
 */
export async function createScenario(name: string): Promise<number> {
  const now = Date.now();
  return db.scenarios.add({
    name,
    slug: nanoid(8),
    createdAt: now,
    updatedAt: now,
    payload: {},
    platform: "zapier",
  });
}

/**
 * Convenience hook to subscribe to a scenario record using dexie-react-hooks.
 * Usage: const scenario = useScenario(id);
 */
export function useScenario(id?: number) {
  // Dynamic import to avoid including Dexie hooks in server bundles
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { useLiveQuery } = require("dexie-react-hooks");
  return useLiveQuery(() => (id ? db.scenarios.get(id) : undefined), [id]);
} 