// enrichTemplatesWithFlow.ts
// ---------------------------------------------------------------------------
// Post-migration enrichment script.
// For every document in the `apicus-templates` collection it derives
// React-Flow compatible `nodes` and `edges` arrays (matching the lightweight
// TemplateNode/TemplateEdge shape from automationTemplateSchema.ts) based on
// the existing `steps` array.
// ---------------------------------------------------------------------------

import { MongoClient, WithId, Document } from "mongodb";
import * as dotenv from "dotenv";
import {
  TemplateNode,
  TemplateEdge,
} from "./automationTemplateSchema";

dotenv.config();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.MONGODB_DB_NAME || "apicus-db-data";
const COLLECTION = process.env.TEMPLATES_COLLECTION || "apicus-templates";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI env var");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Simple helper: convert a `steps` array into React-Flow nodes and edges.
// ---------------------------------------------------------------------------
export function buildNodesAndEdges(
  steps: any[]
): { nodes: TemplateNode[]; edges: TemplateEdge[] } {
  const nodes: TemplateNode[] = [];
  const edges: TemplateEdge[] = [];

  const xGap = 250; // px horizontal spacing
  const yLevel = 0; // single-row layout for now

  steps.forEach((step, idx) => {
    const reactFlowId = `n${idx}`; // deterministic id so we can wire edges

    // Heuristic: first step is a trigger, everything else actions.
    // TODO: refine based on step.typeOf (read/search etc.) if needed.
    const nodeType: "trigger" | "action" | "decision" =
      idx === 0 ? "trigger" : "action";

    const node: TemplateNode = {
      reactFlowId,
      type: nodeType,
      label: step.label,
      // Preserve any platform-specific meta we may care about later.
      platformMeta: {
        action: step.action,
        typeOf: step.typeOf,
        appId: step.appId,
        appSlug: step.appSlug,
        appName: step.appName,
      },
      data: step, // keep a full copy for reference
      position: { x: idx * xGap, y: yLevel },
    };

    nodes.push(node);

    // Create sequential edge from previous node → current
    if (idx > 0) {
      const edgeId = `e${idx - 1}-${idx}`;
      const edge: TemplateEdge = {
        reactFlowId: edgeId,
        label: undefined,
        data: {
          source: nodes[idx - 1].reactFlowId,
          target: reactFlowId,
        },
      } as TemplateEdge;
      edges.push(edge);
    }
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Helper to enrich a single template with nodes and edges
// ---------------------------------------------------------------------------
export async function enrichTemplateWithFlow(
  client: MongoClient,
  dbName: string,
  collectionName: string,
  templateId: string
): Promise<{ nodes: TemplateNode[]; edges: TemplateEdge[] } | null> {
  const col = client.db(dbName).collection(collectionName);
  
  // Find the template
  const doc = await col.findOne({ templateId });
  if (!doc) return null;
  
  // Skip if already enriched
  if (doc.nodes && Array.isArray(doc.nodes) && doc.nodes.length > 0 &&
      doc.edges && Array.isArray(doc.edges) && doc.edges.length > 0) {
    console.log(`Template ${templateId} already enriched, skipping`);
    return { nodes: doc.nodes, edges: doc.edges };
  }
  
  const steps = Array.isArray(doc.steps) ? doc.steps : [];
  if (steps.length === 0) return null;
  
  const { nodes, edges } = buildNodesAndEdges(steps);
  
  // Update the document
  await col.updateOne(
    { templateId },
    { $set: { nodes, edges } }
  );
  
  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------
async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const col = client.db(DB_NAME).collection(COLLECTION);

  console.log("Connected. Building nodes & edges for templates …");

  // Only find documents that don't have nodes/edges or have empty arrays
  const cursor = col.find({
    $or: [
      { nodes: { $exists: false } },
      { edges: { $exists: false } },
      { nodes: { $size: 0 } },
      { edges: { $size: 0 } }
    ]
  });
  
  let totalCount = await col.countDocuments();
  let needsEnrichment = await cursor.count();
  
  console.log(`Found ${needsEnrichment} templates out of ${totalCount} that need enrichment`);
  
  let processed = 0;

  while (await cursor.hasNext()) {
    const doc = (await cursor.next()) as WithId<Document> | null;
    if (!doc) break;

    const steps = Array.isArray(doc.steps) ? doc.steps : [];
    if (steps.length === 0) continue;

    const { nodes, edges } = buildNodesAndEdges(steps);

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          nodes,
          edges,
        },
      }
    );

    processed += 1;
    if (processed % 10 === 0) {
      console.log(`Processed ${processed}/${needsEnrichment} templates …`);
    }
  }

  console.log(`Enrichment complete. Updated ${processed} documents.`);
  await client.close();
}

// Only run the main function if this file is executed directly
if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} 