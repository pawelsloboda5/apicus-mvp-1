import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { TemplateResponse } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  if (!templateId) {
    return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "apicus-db-data");
    
    // Check if embedding should be included (for server-side vector operations only)
    const url = new URL(req.url);
    const includeEmbedding = url.searchParams.get('includeEmbedding') === 'true';
    
    const projection = includeEmbedding 
      ? {} // Include all fields
      : { // Exclude embedding by omitting it from the list
          _id: 1,
          templateId: 1,
          title: 1,
          url: 1,
          editorUrl: 1,
          source: 1,
          platform: 1,
          richDescription: 1,
          exampleUserPrompts: 1,
          steps: 1,
          appIds: 1,
          appNames: 1,
          stepCount: 1,
          firstStepType: 1,
          lastStepType: 1,
          stepSequence: 1,
          processedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          nodes: 1,
          edges: 1,
          appPricingMap: 1,
          pricingEnrichedAt: 1
        }
    
    const doc = await db
      .collection("apicus-templates")
      .findOne({ templateId }, { projection });
      
    if (!doc) {
      return NextResponse.json({ error: "Template not found", templateId }, { status: 404 });
    }

    // Transform MongoDB document to TemplateResponse format
    const response: TemplateResponse = {
      mongoId: doc._id?.toString(),
      templateId: doc.templateId,
      title: doc.title,
      url: doc.url,
      editorUrl: doc.editorUrl,
      source: doc.source,
      platform: doc.platform,
      richDescription: doc.richDescription,
      exampleUserPrompts: doc.exampleUserPrompts,
      steps: doc.steps,
      appIds: doc.appIds,
      appNames: doc.appNames,
      stepCount: doc.stepCount,
      firstStepType: doc.firstStepType,
      lastStepType: doc.lastStepType,
      stepSequence: doc.stepSequence,
      processedAt: doc.processedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      nodes: doc.nodes,
      edges: doc.edges,
      appPricingMap: doc.appPricingMap || {},
      pricingEnrichedAt: doc.pricingEnrichedAt,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch template",
        detail: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 