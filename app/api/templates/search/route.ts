import { NextResponse } from "next/server";
import OpenAI from "openai";
import clientPromise from "@/lib/mongo";
import { Db } from "mongodb";

// Note: Must run in Node.js runtime because MongoDB driver relies on Node core modules.
// (Edge runtime lacks 'net', 'tls', etc.) added

// GET /api/templates/search?q=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  // Build embedding for query ------------------------------------------------
  const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const embeddingDeployment = process.env.AZURE_TEXT_EMBEDDING_3_SMALL_DEPLOYMENT || "text-embedding-3-small";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

  if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
    console.error("Missing Azure OpenAI environment variables:", {
      hasApiKey: !!AZURE_OPENAI_API_KEY,
      hasEndpoint: !!azureEndpoint,
      hasDeployment: !!embeddingDeployment
    });
    return NextResponse.json({ error: "Azure OpenAI env vars missing" }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${azureEndpoint}/openai/deployments/${embeddingDeployment}`,
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
    defaultQuery: { "api-version": apiVersion },
  });

  interface EmbeddingResponse {
    data: Array<{ embedding: number[] }>;
  }

  let embedding: number[];
  try {
    const resp = await openai.embeddings.create({ 
      model: "text-embedding-3-small",
      input: q, 
      dimensions: 1536 
    });
    embedding = (resp as EmbeddingResponse).data[0].embedding;
  } catch (err) {
    console.error("Embedding error", err);
    return NextResponse.json({ error: "Embedding failed" }, { status: 500 });
  }

  // Vector search in MongoDB --------------------------------------------------
  let db: Db;
  try {
    const client = await clientPromise;
    db = client.db(process.env.MONGODB_DB_NAME || "apicus-db-data");
  } catch (err) {
    console.error("DB connection error", err);
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }

  const collection = db.collection("apicus-templates");

  const cosmosPipeline = [
    {
      $search: {
        cosmosSearch: {
          vector: embedding,
          path: "embedding",
          k: 6,
        },
      },
    },
    { $limit: 6 },
    { $project: { templateId: 1, title: 1, nodes: 1, edges: 1, source: 1, platform: 1, description: 1, _id: 0 } },
  ];

  let results: Array<{
    templateId: string;
    title: string;
    nodes: unknown;
    edges: unknown;
    source: string;
    platform: string;
    description: string;
  }>;
  try {
    const rawResults = await collection.aggregate(cosmosPipeline).toArray();
    results = rawResults as Array<{
      templateId: string;
      title: string;
      nodes: unknown;
      edges: unknown;
      source: string;
      platform: string;
      description: string;
    }>;
  } catch (err: unknown) {
    // If Cosmos operator not found, fall back to Atlas $vectorSearch
    if (err instanceof Error && err.message?.includes("cosmosSearch")) {
      const atlasPipeline = [
        {
          $vectorSearch: {
            index: "embedding_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: 6,
          },
        },
        { $project: { templateId: 1, title: 1, nodes: 1, edges: 1, source: 1, platform: 1, description: 1, _id: 0 } },
      ];
      try {
        const rawResults = await collection.aggregate(atlasPipeline).toArray();
        results = rawResults as Array<{
          templateId: string;
          title: string;
          nodes: unknown;
          edges: unknown;
          source: string;
          platform: string;
          description: string;
        }>;
      } catch (err2) {
        console.error("Vector search error", err2);
        return NextResponse.json({ error: "Vector search failed", detail: err2 instanceof Error ? err2.message : String(err2) }, { status: 500 });
      }
    } else {
      console.error("Aggregation error", err);
      return NextResponse.json({ error: "Search aggregation failed", detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  if (!results || results.length === 0) {
    return NextResponse.json({ error: "No match" }, { status: 404 });
  }

  return NextResponse.json({ templates: results });
}