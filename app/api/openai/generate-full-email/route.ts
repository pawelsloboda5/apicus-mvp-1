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

// Core metrics that are always included
const CORE_FIELDS = ['scenarioName', 'platform', 'runsPerMonth', 'netROI', 'roiRatio', 'paybackPeriod'];

// Helper to select 70% of fields randomly while keeping core fields
function selectFieldsForContext(allFields: Record<string, unknown>, coreFields: string[] = CORE_FIELDS): Record<string, unknown> {
  const selectedFields: Record<string, unknown> = {};
  
  // Always include core fields
  coreFields.forEach(field => {
    if (field in allFields) {
      selectedFields[field] = allFields[field];
    }
  });
  
  // Get remaining fields
  const remainingFields = Object.keys(allFields).filter(key => !coreFields.includes(key));
  
  // Select 70% of remaining fields randomly
  const numToSelect = Math.ceil(remainingFields.length * 0.7);
  const shuffled = remainingFields.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, numToSelect);
  
  selected.forEach(field => {
    selectedFields[field] = allFields[field];
  });
  
  return selectedFields;
}

interface EmailGenerationPayload {
  // Core scenario data
  scenarioName?: string;
  platform?: string;
  taskType?: string;
  
  // Basic metrics
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  taskMultiplier?: number;
  
  // Calculated ROI values
  timeValue?: number;
  platformCost?: number;
  netROI?: number;
  roiRatio?: number;
  paybackPeriod?: string;
  
  // Optional metrics
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
  revenueValue?: number;
  
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  riskValue?: number;
  
  // Workflow information
  workflowSteps?: Array<{
    type: string;
    label: string;
    appName?: string;
    action?: string;
  }>;
  totalSteps?: number;
  uniqueApps?: string[];
  
  // Generation options
  lengthOption?: 'concise' | 'standard' | 'detailed';
}

function getLengthInstructions(lengthOption: string) {
  switch(lengthOption) {
    case 'concise':
      return 'Keep it very brief and punchy. Maximum 1-2 sentences.';
    case 'detailed':
      return 'Provide comprehensive detail. 3-4 sentences with specific examples and metrics.';
    default:
      return 'Standard length. 2-3 sentences with key points.';
  }
}

async function generateSection(
  sectionType: 'subject' | 'hook' | 'cta' | 'offer',
  context: Record<string, unknown>,
  previousSections: Record<string, string>,
  lengthOption: string = 'standard'
) {
  const lengthInstructions = getLengthInstructions(lengthOption);
  
  let systemPrompt = '';
  switch(sectionType) {
    case 'subject':
      systemPrompt = `Generate a compelling email subject line for an automation ROI proposal. ${lengthInstructions} Focus on the most impressive metric or benefit. Context includes workflow automation details and ROI calculations.`;
      break;
    case 'hook':
      systemPrompt = `Generate an engaging hook for a cold outreach email about an automation solution. ${lengthInstructions} Reference the pain point and immediate value. Build on the subject line theme.`;
      break;
    case 'cta':
      systemPrompt = `Generate a clear call-to-action paragraph that references the ROI data and leads to a PDF download. ${lengthInstructions} Build on the established narrative from subject and hook.`;
      break;
    case 'offer':
      systemPrompt = `Generate a soft offer paragraph suggesting a pilot, demo, or consultation. ${lengthInstructions} Reference the solution's potential while maintaining a consultative tone. Complete the email narrative.`;
      break;
  }
  
  // Build conversation context with previous sections
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt
    }
  ];
  
  // Add previous sections as context
  if (Object.keys(previousSections).length > 0) {
    messages.push({
      role: "assistant",
      content: `Previous email sections generated:\n${Object.entries(previousSections)
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n')}`
    });
  }
  
  // Add the context data
  messages.push({
    role: "user",
    content: `Generate the ${sectionType} section based on this context:\n${JSON.stringify(context, null, 2)}\n\nProvide only the generated text, no explanations.`
  });
  
  const completion = await openai.chat.completions.create({
    model: chatDeploymentName,
    messages,
    temperature: 0.7,
    max_tokens: sectionType === 'subject' ? 100 : 300,
  });
  
  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function POST(req: Request) {
  if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
    return NextResponse.json({ error: "Azure OpenAI env vars missing" }, { status: 500 });
  }

  try {
    const payload = await req.json() as EmailGenerationPayload;
    const lengthOption = payload.lengthOption || 'standard';
    
    // Build comprehensive context object
    const fullContext: Record<string, unknown> = {
      scenarioName: payload.scenarioName || 'Workflow Automation',
      platform: payload.platform || 'automation platform',
      taskType: payload.taskType || 'general',
      
      // Core metrics
      runsPerMonth: payload.runsPerMonth || 0,
      minutesPerRun: payload.minutesPerRun || 0,
      hourlyRate: payload.hourlyRate || 0,
      taskMultiplier: payload.taskMultiplier || 1,
      
      // ROI calculations
      timeValue: payload.timeValue || 0,
      platformCost: payload.platformCost || 0,
      netROI: payload.netROI || 0,
      roiRatio: payload.roiRatio || 0,
      paybackPeriod: payload.paybackPeriod || 'Unknown',
      
      // Time saved calculations
      totalHoursSaved: ((payload.runsPerMonth || 0) * (payload.minutesPerRun || 0)) / 60,
      dailyTimeSaved: ((payload.runsPerMonth || 0) * (payload.minutesPerRun || 0)) / 60 / 30,
    };
    
    // Add revenue metrics if enabled
    if (payload.revenueEnabled) {
      fullContext.revenueMetrics = {
        monthlyVolume: payload.monthlyVolume || 0,
        conversionRate: payload.conversionRate || 0,
        valuePerConversion: payload.valuePerConversion || 0,
        totalRevenueImpact: payload.revenueValue || 0,
        additionalConversions: ((payload.monthlyVolume || 0) * ((payload.conversionRate || 0) / 100))
      };
    }
    
    // Add compliance metrics if enabled
    if (payload.complianceEnabled) {
      fullContext.complianceMetrics = {
        riskLevel: payload.riskLevel || 0,
        riskFrequency: payload.riskFrequency || 0,
        errorCost: payload.errorCost || 0,
        totalRiskMitigation: payload.riskValue || 0,
        errorsPreventedMonthly: ((payload.runsPerMonth || 0) * ((payload.riskFrequency || 0) / 100))
      };
    }
    
    // Add workflow context
    if (payload.workflowSteps && payload.workflowSteps.length > 0) {
      fullContext.workflowSummary = {
        totalSteps: payload.totalSteps || payload.workflowSteps.length,
        uniqueApps: payload.uniqueApps || [],
        keySteps: payload.workflowSteps.slice(0, 5), // First 5 steps for context
        automationType: payload.workflowSteps[0]?.appName || 'Custom Workflow'
      };
    }
    
    // Generate sections sequentially with context building
    const generatedSections: Record<string, string> = {};
    
    // 1. Generate Subject Line with 70% of fields
    const subjectContext = selectFieldsForContext(fullContext);
    generatedSections.subjectLine = await generateSection('subject', subjectContext, {}, lengthOption);
    
    // 2. Generate Hook with subject + 70% of fields
    const hookContext = selectFieldsForContext(fullContext);
    generatedSections.hookText = await generateSection('hook', hookContext, 
      { subjectLine: generatedSections.subjectLine }, lengthOption);
    
    // 3. Generate CTA with subject + hook + 70% of fields
    const ctaContext = selectFieldsForContext(fullContext);
    generatedSections.ctaText = await generateSection('cta', ctaContext, 
      { 
        subjectLine: generatedSections.subjectLine,
        hookText: generatedSections.hookText 
      }, lengthOption);
    
    // 4. Generate Offer with all previous + 70% of fields
    const offerContext = selectFieldsForContext(fullContext);
    generatedSections.offerText = await generateSection('offer', offerContext, 
      { 
        subjectLine: generatedSections.subjectLine,
        hookText: generatedSections.hookText,
        ctaText: generatedSections.ctaText
      }, lengthOption);
    
    return NextResponse.json({
      ...generatedSections,
      metadata: {
        lengthOption,
        contextFieldsUsed: Object.keys(fullContext).length,
        workflowStepsIncluded: payload.workflowSteps?.length || 0
      }
    });

  } catch (error: unknown) {
    console.error("/api/openai/generate-full-email error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error during full email generation" 
    }, { status: 500 });
  }
}