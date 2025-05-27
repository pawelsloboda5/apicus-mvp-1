import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      hasAzureKey: !!process.env.AZURE_OPENAI_API_KEY,
      hasAzureEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hasMongoUri: !!process.env.MONGODB_URI,
      azureKeyLength: process.env.AZURE_OPENAI_API_KEY?.length,
      azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      mongoDbName: process.env.MONGODB_DB_NAME,
      embeddingDeployment: process.env.AZURE_TEXT_EMBEDDING_3_SMALL_DEPLOYMENT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      allEnvVars: Object.keys(process.env).length,
      nodeEnv: process.env.NODE_ENV
    }
  });
}