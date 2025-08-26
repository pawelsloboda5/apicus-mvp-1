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
    // Basic info
    projectName?: string;
    clientName?: string;
    taskType?: string;
    platform?: string;

    // Core ROI metrics (optional for title; richer for businessImpact)
    roiRatio?: number;
    paybackDays?: number;
    hoursSaved?: number;
    netROI?: number;

    // ROI settings
    runsPerMonth?: number;
    minutesPerRun?: number;
    hourlyRate?: number;
    taskMultiplier?: number;

    // Risk & Compliance
    complianceEnabled?: boolean;
    riskLevel?: number;
    riskFrequency?: number;
    errorCost?: number;

    // Revenue uplift
    revenueEnabled?: boolean;
    monthlyVolume?: number;
    conversionRate?: number;
    valuePerConversion?: number;
    revenueValue?: number;
    riskValue?: number;

    // Workflow context (sanitized JSON from client)
    workflow?: {
      nodes?: Array<{
        id?: string;
        type?: string;
        data?: {
          label?: string;
          appId?: string;
          appName?: string;
          action?: string;
          typeOf?: string;
          logoUrl?: string;
        };
      }>;
    };

    // Legacy field used by older callers
    uniqueApps?: string[];
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
      // New 2–4 sentences business impact guidance
      systemPrompt = `Write a concise business impact summary (2–4 sentences) for this automation. Focus on the business outcome and practical value rather than repeating metrics. Explain how the automation changes the way work is done, what problems it removes, and what benefits the business gains (e.g., faster response times, fewer errors, improved client experience, more consistent follow-up). Avoid simply restating numbers already shown in the ROI breakdown.`;

      // Derive a compact workflow summary from provided workflow JSON
      const nodes = context.workflow?.nodes || [];
      const appNames = Array.from(
        new Set(
          nodes
            .map(n => n?.data?.appName)
            .filter((v): v is string => Boolean(v))
        )
      );
      const stepSnippets = nodes
        .filter(n => ['trigger', 'action', 'decision'].includes((n.type || '').toLowerCase()))
        .slice(0, 6)
        .map(n => {
          const parts = [n?.data?.label, n?.data?.appName, n?.data?.action, n?.data?.typeOf]
            .filter(Boolean)
            .join(' - ');
          return parts || n.type || 'step';
        });

      userPrompt = `Context for the automation project:
Project: ${context.projectName || 'Automation'}
Client: ${context.clientName || 'Agency client'}
Use case: ${context.taskType || 'general'} on ${context.platform || 'platform'}
Runs per month: ${context.runsPerMonth ?? 'n/a'}
Minutes saved per run: ${context.minutesPerRun ?? 'n/a'}
Hourly rate: ${context.hourlyRate ?? 'n/a'}
Compliance risk reduction enabled: ${context.complianceEnabled ? 'yes' : 'no'} (level: ${context.riskLevel ?? 'n/a'}, freq: ${context.riskFrequency ?? 'n/a'}, error cost: ${context.errorCost ?? 'n/a'})
Revenue uplift enabled: ${context.revenueEnabled ? 'yes' : 'no'} (volume: ${context.monthlyVolume ?? 'n/a'}, CR: ${context.conversionRate ?? 'n/a'}%, value/conv: ${context.valuePerConversion ?? 'n/a'})
Workflow apps: ${appNames.length ? appNames.join(', ') : 'n/a'}
Workflow steps: ${stepSnippets.length ? stepSnippets.join(' | ') : 'n/a'}

Write the business impact summary now (2–4 sentences).`;
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

    // Validate title word count only
    const wordCount = generatedContent.split(/\s+/).length;
    if (type === 'title' && wordCount > 5) {
      const truncated = generatedContent.split(/\s+/).slice(0, 5).join(' ');
      return NextResponse.json({ content: truncated, wordCount: 5 });
    }

    return NextResponse.json({ content: generatedContent, wordCount });
    
  } catch (error: unknown) {
    console.error("/api/openai/generate-roi-content error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error" 
    }, { status: 500 });
  }
} 