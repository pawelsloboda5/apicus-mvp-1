import { NextResponse } from "next/server";
import OpenAI from "openai";
import clientPromise from "@/lib/mongo";
import { Db } from "mongodb";

export const runtime = "nodejs"; // Use Node.js runtime for MongoDB driver compatibility
// This is necessary because the MongoDB driver relies on Node.js core modules

// GET /api/templates/search?q=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    
    if (!q) {
      return NextResponse.json({ error: "Missing q" }, { status: 400 });
    }

    console.log("Starting search for query:", q);

    // Build embedding for query ------------------------------------------------
    const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const embeddingDeployment = process.env.AZURE_TEXT_EMBEDDING_3_SMALL_DEPLOYMENT || "text-embedding-3-small";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

    console.log("Environment check:", {
      hasApiKey: !!AZURE_OPENAI_API_KEY,
      hasEndpoint: !!azureEndpoint,
      hasDeployment: !!embeddingDeployment,
      apiKeyLength: AZURE_OPENAI_API_KEY?.length,
      endpoint: azureEndpoint?.substring(0, 30) + "..." // Don't log full endpoint
    });

    if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
      console.error("Missing Azure OpenAI environment variables");
      return NextResponse.json({ 
        error: "Azure OpenAI env vars missing",
        debug: {
          hasApiKey: !!AZURE_OPENAI_API_KEY,
          hasEndpoint: !!azureEndpoint
        }
      }, { status: 500 });
    }

    console.log("Creating OpenAI client...");
    const openai = new OpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      baseURL: `${azureEndpoint}/openai/deployments/${embeddingDeployment}`,
      defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
      defaultQuery: { "api-version": apiVersion },
    });

    console.log("Generating embedding...");
    let embedding: number[];
    try {
      const resp = await openai.embeddings.create({ 
        model: "text-embedding-3-small",
        input: q, 
        dimensions: 1536 
      });
      embedding = resp.data[0]?.embedding;
      console.log("Embedding generated successfully, length:", embedding?.length);
      
      if (!embedding) {
        return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 });
      }
    } catch (embeddingError) {
      console.error("Embedding creation failed:", embeddingError);
      return NextResponse.json({ 
        error: "Embedding failed", 
        detail: embeddingError instanceof Error ? embeddingError.message : String(embeddingError)
      }, { status: 500 });
    }

    console.log("Connecting to MongoDB...");
    let db: Db;
    try {
      const client = await clientPromise;
      db = client.db(process.env.MONGODB_DB_NAME || "apicus-db-data");
      console.log("MongoDB connected successfully");
    } catch (dbError) {
      console.error("DB connection error:", dbError);
      return NextResponse.json({ 
        error: "DB connection failed", 
        detail: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    console.log("Performing vector search...");
    const collection = db.collection("apicus-templates");

    // Try Cosmos DB first, then fall back to Atlas
    try {
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

      const rawResults = await collection.aggregate(cosmosPipeline).toArray();
      console.log("Cosmos search successful, results:", rawResults.length);
      
      return NextResponse.json({ 
        templates: rawResults,
        searchType: "cosmos"
      });

    } catch (cosmosError) {
      console.log("Cosmos search failed, trying Atlas:", cosmosError instanceof Error ? cosmosError.message : String(cosmosError));
      
      // Fall back to Atlas vector search
      try {
        const atlasPipeline = [
          {
            $vectorSearch: {
              index: "vector_index", // Make sure this matches your actual index name
              path: "embedding",
              queryVector: embedding,
              numCandidates: 100,
              limit: 6,
            },
          },
          { $project: { templateId: 1, title: 1, nodes: 1, edges: 1, source: 1, platform: 1, description: 1, _id: 0 } },
        ];

        const rawResults = await collection.aggregate(atlasPipeline).toArray();
        console.log("Atlas search successful, results:", rawResults.length);
        
        return NextResponse.json({ 
          templates: rawResults,
          searchType: "atlas"
        });

      } catch (atlasError) {
        console.error("Both vector search methods failed:", atlasError);
        return NextResponse.json({ 
          error: "Vector search failed", 
          detail: atlasError instanceof Error ? atlasError.message : String(atlasError)
        }, { status: 500 });
      }
    }

  } catch (globalError) {
    console.error("Global error in search API:", globalError);
    return NextResponse.json({ 
      error: "Internal server error", 
      detail: globalError instanceof Error ? globalError.message : String(globalError),
      stack: globalError instanceof Error ? globalError.stack : undefined
    }, { status: 500 });
  }
}

