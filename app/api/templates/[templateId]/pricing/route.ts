import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { TemplatePricingResponse } from "@/lib/types";

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
    
    // Fetch template with pricing data, excluding embedding
    const template = await db
      .collection("apicus-templates")
      .findOne(
        { templateId },
        {
          projection: {
            templateId: 1,
            appPricingMap: 1,
            pricingEnrichedAt: 1,
            appIds: 1,
            appNames: 1
            // Note: embedding field is omitted from results by not including it
          }
        }
      );

    if (!template) {
      return NextResponse.json(
        { error: "Template not found", templateId }, 
        { status: 404 }
      );
    }

    // Create response with pricing data or empty map if not available
    const response: TemplatePricingResponse = {
      templateId: template.templateId,
      appPricingMap: template.appPricingMap || {},
      totalApps: template.appPricingMap ? Object.keys(template.appPricingMap).length : 0,
      pricingEnrichedAt: template.pricingEnrichedAt || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching template pricing data:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch template pricing data",
        detail: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 