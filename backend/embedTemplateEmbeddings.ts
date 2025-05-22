// embedTemplateEmbeddings.ts
// ---------------------------------------------------------------------------
// Generates vector embeddings (OpenAI text-embedding-3 small, 1536 dims)
// for each automation template in the collection and stores them under
// the `embedding` field. Only 50-ish docs, so we process sequentially with
// small batch groups for efficiency.
// ---------------------------------------------------------------------------

import { MongoClient, WithId, Document } from "mongodb";
import * as dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

/* ------------------------------------------------------------------ */
// Config
/* ------------------------------------------------------------------ */
const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.MONGODB_DB_NAME || "apicus-db-data";
const COLLECTION = process.env.TEMPLATES_COLLECTION || "apicus-templates";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI env var");
  process.exit(1);
}

// Azure OpenAI Embeddings client ------------------------------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const embeddingDeployment = process.env.AZURE_TEXT_EMBEDDING_3_SMALL_DEPLOYMENT || "text-embedding-3-small";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY or AZURE_OPENAI_API_KEY env var");
  process.exit(1);
}

let openai: OpenAI;

if (azureEndpoint) {
  // Azure route requires deployment in URL
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: `${azureEndpoint}/openai/deployments/${embeddingDeployment}`,
    defaultHeaders: { "api-key": OPENAI_API_KEY },
    defaultQuery: { "api-version": apiVersion },
  });
} else {
  // Public OpenAI
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

/* ------------------------------------------------------------------ */
// Helper: build embedding input text
/* ------------------------------------------------------------------ */
export function buildInput(doc: any): string {
  const parts: string[] = [];
  if (doc.title) parts.push(doc.title);
  if (doc.richDescription) parts.push(doc.richDescription);
  if (Array.isArray(doc.exampleUserPrompts)) parts.push(doc.exampleUserPrompts.join(" \n "));
  return parts.join(" \n ");
}

/* ------------------------------------------------------------------ */
// Helper: embed a single template
/* ------------------------------------------------------------------ */
export async function embedTemplate(
  client: MongoClient,
  dbName: string,
  collectionName: string,
  templateId: string,
  openaiClient: OpenAI
): Promise<number[] | null> {
  const col = client.db(dbName).collection(collectionName);
  
  // Find the template
  const doc = await col.findOne({ templateId });
  if (!doc) return null;
  
  const input = buildInput(doc);
  
  try {
    const resp = await openaiClient.embeddings.create({
      // For Azure the deployment is in URL; model param optional. For public set model name.
      ...(azureEndpoint ? {} : { model: "text-embedding-3-small" }),
      input: input,
      dimensions: 1536,
    } as any);
    
    const embeddingVector = (resp.data[0] as any).embedding;
    
    // Update the document
    await col.updateOne(
      { templateId },
      { $set: { embedding: embeddingVector } }
    );
    
    return embeddingVector;
  } catch (err) {
    console.error("Error generating embedding:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
// Helper: get initialized OpenAI client
/* ------------------------------------------------------------------ */
export function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) return null;
  
  if (azureEndpoint) {
    // Azure route requires deployment in URL
    return new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: `${azureEndpoint}/openai/deployments/${embeddingDeployment}`,
      defaultHeaders: { "api-key": OPENAI_API_KEY },
      defaultQuery: { "api-version": apiVersion },
    });
  } else {
    // Public OpenAI
    return new OpenAI({ apiKey: OPENAI_API_KEY });
  }
}

/* ------------------------------------------------------------------ */
// Main runner
/* ------------------------------------------------------------------ */
async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const col = client.db(DB_NAME).collection(COLLECTION);

  console.log("Connected. Generating embeddings for templates …");

  // Fetch all docs (we only have ~50). You can skip those already embedded.
  const docs: WithId<Document>[] = await col
    .find({})
    .toArray();

  const batchSize = 10; // embedding endpoint supports up to 2048 tokens per request; 10 small texts safe.
  let processed = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batchDocs = docs.slice(i, i + batchSize);
    const inputs = batchDocs.map(buildInput);

    try {
      const resp = await openai.embeddings.create({
        // For Azure the deployment is in URL; model param optional. For public set model name.
        ...(azureEndpoint ? {} : { model: "text-embedding-3-small" }),
        input: inputs,
        dimensions: 1536,
      } as any);

      if (resp.data.length !== inputs.length) {
        throw new Error("Embedding count mismatch");
      }

      // Update each doc with its embedding vector
      for (let j = 0; j < batchDocs.length; j++) {
        const embeddingVector = (resp.data[j] as any).embedding;
        await col.updateOne(
          { _id: batchDocs[j]._id },
          { $set: { embedding: embeddingVector } }
        );
        processed += 1;
      }
      console.log(`Embedded ${processed}/${docs.length}`);
    } catch (err) {
      console.error("Embedding error", err);
    }
  }

  console.log(`Embedding complete. Updated ${processed} documents.`);
  await client.close();
}

// Only run the main function if this file is executed directly
if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 