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
  payload?: unknown; // Made optional as we are adding specific fields

  /* ---------- ROI inputs ---------- */
  runsPerMonth?: number; // e.g. 1000
  minutesPerRun?: number; // e.g. 5
  hourlyRate?: number; // $/hour
  taskMultiplier?: number; // V*
  taskType?: string; // e.g., 'general', 'admin'
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;

  /* ---------- Canvas & Workflow State ---------- */
  nodesSnapshot?: any[]; // Store React Flow nodes directly
  edgesSnapshot?: any[]; // Store React Flow edges directly
  viewport?: any; // Store React Flow viewport

  // For linking to an original template if this scenario was derived from one
  originalTemplateId?: string;
  // To store the original search query that led to this set of scenarios/alternatives
  searchQuery?: string;
  // To store alternative templates, if this scenario is the primary from a search
  // This might be better managed in a separate table or transient state depending on exact UX
  // For now, let's consider it might be part of the scenario that holds the primary result.
  alternativeTemplatesCache?: any[]; // Simplified: stores full alternative template objects

  /* ---------- Email Generation Details ---------- */
  emailFirstName?: string;
  emailYourName?: string;
  emailYourCompany?: string;
  emailYourEmail?: string;
  emailCalendlyLink?: string;
  emailPdfLink?: string;
  emailHookText?: string;
  emailCtaText?: string;
  emailSubjectLine?: string;
  emailOfferText?: string;
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

    // Version 4 – add ROI input fields
    this.version(4)
      .stores({
        scenarios: "++id, slug, updatedAt, platform, runsPerMonth, hourlyRate, taskMultiplier",
        nodes: "++id, scenarioId, reactFlowId, type",
        edges: "++id, scenarioId, reactFlowId",
      })
      .upgrade(tx => {
        tx.table("scenarios").toCollection().modify((sc: any) => {
          if (!("runsPerMonth" in sc)) sc.runsPerMonth = 1000;
          if (!("minutesPerRun" in sc)) sc.minutesPerRun = 5;
          if (!("hourlyRate" in sc)) sc.hourlyRate = 30;
          if (!("taskMultiplier" in sc)) sc.taskMultiplier = 1.5;
        });
      });

    // Version 5 – Add fields for full scenario snapshot and extended ROI inputs
    this.version(5)
      .stores({
        scenarios: "++id, slug, name, updatedAt, platform, originalTemplateId, searchQuery",
        nodes: "++id, scenarioId, reactFlowId, type",
        edges: "++id, scenarioId, reactFlowId",
      })
      .upgrade(tx => {
        tx.table("scenarios").toCollection().modify((sc: Scenario) => {
          if (!sc.taskType) sc.taskType = "general";
          if (typeof sc.complianceEnabled === 'undefined') sc.complianceEnabled = false;
          if (!sc.riskLevel) sc.riskLevel = 3;
          if (!sc.riskFrequency) sc.riskFrequency = 5;
          if (!sc.errorCost) sc.errorCost = 500;
          if (typeof sc.revenueEnabled === 'undefined') sc.revenueEnabled = false;
          if (!sc.monthlyVolume) sc.monthlyVolume = 100;
          if (!sc.conversionRate) sc.conversionRate = 5;
          if (!sc.valuePerConversion) sc.valuePerConversion = 200;
          if (!sc.nodesSnapshot) sc.nodesSnapshot = [];
          if (!sc.edgesSnapshot) sc.edgesSnapshot = [];
        });
      });
      
    // Version 6 – Add fields for Email Generation
    this.version(6)
      .stores({
        scenarios: "++id, slug, name, updatedAt, platform, originalTemplateId, searchQuery, emailYourName", // Added emailYourName for potential indexing
        nodes: "++id, scenarioId, reactFlowId, type",
        edges: "++id, scenarioId, reactFlowId",
      })
      .upgrade(tx => {
        tx.table("scenarios").toCollection().modify((sc: Scenario) => {
          // Initialize new optional email fields if they don't exist
          if (!sc.emailFirstName) sc.emailFirstName = "";
          if (!sc.emailYourName) sc.emailYourName = "";
          if (!sc.emailYourCompany) sc.emailYourCompany = "";
          if (!sc.emailYourEmail) sc.emailYourEmail = "";
          if (!sc.emailCalendlyLink) sc.emailCalendlyLink = "";
          if (!sc.emailPdfLink) sc.emailPdfLink = "";
          if (!sc.emailHookText) sc.emailHookText = "I noticed your team still shuttles data from webhooks into Google&nbsp;Sheets and Airtable by hand or script. We just finished a <em>6-step Zapier playbook</em> that frees <strong>~15 hours</strong> of repetitive work every month and pays for itself on day&nbsp;one.";
          if (!sc.emailCtaText) sc.emailCtaText = "I packaged the numbers and a quick how it works diagram into a one-page PDF here:";
          if (!sc.emailSubjectLine) sc.emailSubjectLine = "Streamline Your Workflow & See Immediate ROI";
          if (!sc.emailOfferText) sc.emailOfferText = "If you'd like, I can spin up a <strong>2-week pilot</strong> in your Zapier workspace—no code, no disruption—to prove the savings on live data.";
        });
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
    platform: "zapier",
    runsPerMonth: 250,    
    minutesPerRun: 3,       
    hourlyRate: 30,         
    taskMultiplier: 1.5,    
    taskType: "general",
    complianceEnabled: false,
    riskLevel: 3,
    riskFrequency: 5,
    errorCost: 500,
    revenueEnabled: false,
    monthlyVolume: 100,
    conversionRate: 5,
    valuePerConversion: 200,
    nodesSnapshot: [],
    edgesSnapshot: [],
    // Initialize email fields
    emailFirstName: "",
    emailYourName: "",
    emailYourCompany: "",
    emailYourEmail: "",
    emailCalendlyLink: "",
    emailPdfLink: "",
    emailHookText: "I noticed your team still shuttles data from webhooks into Google&nbsp;Sheets and Airtable by hand or script. We just finished a <em>6-step Zapier playbook</em> that frees <strong>~15 hours</strong> of repetitive work every month and pays for itself on day&nbsp;one.",
    emailCtaText: "I packaged the numbers and a quick how it works diagram into a one-page PDF here:",
    emailSubjectLine: "Streamline Your Workflow & See Immediate ROI",
    emailOfferText: "If you'd like, I can spin up a <strong>2-week pilot</strong> in your Zapier workspace—no code, no disruption—to prove the savings on live data.",
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