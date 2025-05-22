import { NextResponse } from "next/server";
import OpenAI from "openai";
import clientPromise from "@/lib/mongo";
import { Db } from "mongodb";

// Note: Must run in Node.js runtime because MongoDB driver relies on Node core modules.
// (Edge runtime lacks 'net', 'tls', etc.)

// GET /api/templates/search?q=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  // Build embedding for query ------------------------------------------------
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const embeddingDeployment = process.env.AZURE_TEXT_EMBEDDING_3_SMALL_DEPLOYMENT || "text-embedding-3-small";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

  if (!OPENAI_API_KEY || !azureEndpoint) {
    return NextResponse.json({ error: "OpenAI env vars missing" }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: `${azureEndpoint}/openai/deployments/${embeddingDeployment}`,
    defaultHeaders: { "api-key": OPENAI_API_KEY },
    defaultQuery: { "api-version": apiVersion },
  });

  let embedding: number[];
  try {
    const resp = await openai.embeddings.create({ input: q, dimensions: 1536 } as any);
    embedding = (resp.data[0] as any).embedding;
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
          k: 1,
        },
      },
    },
    { $limit: 1 },
    { $project: { templateId: 1, title: 1, nodes: 1, edges: 1, _id: 0 } },
  ];

  let result: any;
  try {
    [result] = await collection.aggregate(cosmosPipeline).toArray();
  } catch (err: any) {
    // If Cosmos operator not found, fall back to Atlas $vectorSearch
    if (err.message?.includes("cosmosSearch")) {
      const atlasPipeline = [
        {
          $vectorSearch: {
            index: "embedding_index", // ensure this index exists
            path: "embedding",
            queryVector: embedding,
            numCandidates: 50,
            limit: 1,
          },
        },
        { $project: { templateId: 1, title: 1, nodes: 1, edges: 1, _id: 0 } },
      ];
      try {
        [result] = await collection.aggregate(atlasPipeline).toArray();
      } catch (err2) {
        console.error("Vector search error", err2);
        return NextResponse.json({ error: "Vector search failed", detail: err2 instanceof Error ? err2.message : String(err2) }, { status: 500 });
      }
    } else {
      console.error("Aggregation error", err);
      return NextResponse.json({ error: "Search aggregation failed", detail: err.message }, { status: 500 });
    }
  }

  if (!result) {
    return NextResponse.json({ error: "No match" }, { status: 404 });
  }

  return NextResponse.json({ templateId: result.templateId });
} 