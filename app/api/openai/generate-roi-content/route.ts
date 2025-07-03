import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Azure OpenAI configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const chatDeploymentName = process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-4.1";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-03-01-preview";

if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
  console.error("Missing Azure OpenAI environment variables:", {
    hasApiKey: !!AZURE_OPENAI_API_KEY,
    hasEndpoint: !!azureEndpoint
  });
}

const openai = new OpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  baseURL: `${azureEndpoint}/openai/deployments/${chatDeploymentName}`,
  defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
  defaultQuery: { "api-version": apiVersion },
});

interface ROIContentRequest {
  type: 'title' | 'businessImpact';
  context: {
    projectName?: string;
    clientName?: string;
    taskType?: string;
    platform?: string;
    roiRatio?: number;
    paybackDays?: number;
    hoursSaved?: number;
    netROI?: number;
    uniqueApps?: string[];
    complianceEnabled?: boolean;
    revenueEnabled?: boolean;
    revenueValue?: number;
    riskValue?: number;
  };
}

export async function POST(req: Request) {
  if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
    return NextResponse.json({ error: "Azure OpenAI env vars missing" }, { status: 500 });
  }

  try {
    const { type, context } = await req.json() as ROIContentRequest;

    if (!type || !context) {
      return NextResponse.json({ error: "type and context required" }, { status: 400 });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'title') {
      systemPrompt = `You are a professional automation consultant creating concise, impactful ROI report titles. 
      Generate a title that is EXACTLY 5 words or less. The title should be specific to the automation type and compelling.
      
      Rules:
      - Maximum 5 words (strict limit)
      - Be specific about the automation benefit
      - Use action words when possible
      - Avoid generic terms like "ROI Report" or "Analysis"
      - Focus on the value/outcome
      
      Examples:
      - "Sales Automation Triples Revenue"
      - "Cut Response Time 90%"
      - "Eliminate Manual Data Entry"
      - "Scale Support Without Hiring"`;

      userPrompt = `Generate a 5-word-or-less title for this automation project:
      Project: ${context.projectName || 'Automation'}
      Type: ${context.taskType || 'general'}
      ROI: ${context.roiRatio ? context.roiRatio.toFixed(1) + 'x' : 'High'}
      Apps used: ${context.uniqueApps?.slice(0, 3).join(', ') || 'Multiple'}`;
    
    } else if (type === 'businessImpact') {
      systemPrompt = `You are an expert automation consultant writing compelling business impact statements. 
      Generate a business impact statement that is EXACTLY 30 words or less. Be specific, quantitative, and outcome-focused.
      
      Rules:
      - Maximum 30 words (strict limit)
      - Include specific metrics when available
      - Focus on business outcomes, not technical details
      - Use active voice
      - Be persuasive but factual
      - Tailor to automation consultants/agencies and their clients
      
      Structure options:
      - Start with the biggest benefit
      - Lead with time or cost savings
      - Emphasize competitive advantage
      - Focus on growth enablement`;

      userPrompt = `Generate a 30-word business impact statement:
      Hours saved monthly: ${context.hoursSaved?.toFixed(1) || 'significant'}
      ROI: ${context.roiRatio ? context.roiRatio.toFixed(1) + 'x' : 'High'}
      Payback: ${context.paybackDays} days
      ${context.complianceEnabled ? 'Reduces compliance risks by 95%.' : ''}
      ${context.revenueEnabled && context.revenueValue ? `Generates $${context.revenueValue.toFixed(0)} additional monthly revenue.` : ''}
      Platform: ${context.platform || 'automation'}
      Client: ${context.clientName || 'agency clients'}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const generatedContent = completion.choices[0]?.message?.content?.trim() || "";

    // Validate word count
    const wordCount = generatedContent.split(/\s+/).length;
    if (type === 'title' && wordCount > 5) {
      // Truncate to 5 words if needed
      const truncated = generatedContent.split(/\s+/).slice(0, 5).join(' ');
      return NextResponse.json({ content: truncated, wordCount: 5 });
    }
    if (type === 'businessImpact' && wordCount > 30) {
      // Truncate to 30 words if needed
      const truncated = generatedContent.split(/\s+/).slice(0, 30).join(' ');
      return NextResponse.json({ content: truncated, wordCount: 30 });
    }

    return NextResponse.json({ content: generatedContent, wordCount });
    
  } catch (error: unknown) {
    console.error("/api/openai/generate-roi-content error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error" 
    }, { status: 500 });
  }
} 