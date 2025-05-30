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
  
  // Email context from nodes
  emailContext?: {
    personas?: string[];
    industries?: string[];
    painPoints?: string[];
    metrics?: string[];
    urgencyFactors?: string[];
    socialProofs?: string[];
    objections?: string[];
    valueProps?: string[];
  };
  
  // Generation options
  lengthOption?: 'concise' | 'standard' | 'detailed';
  toneOption?: string;
  
  // Section enablement flags
  enabledSections?: {
    subject?: boolean;
    hook?: boolean;
    cta?: boolean;
    offer?: boolean;
    ps?: boolean;
    testimonial?: boolean;
    urgency?: boolean;
  };
}

function getLengthInstructions(lengthOption: string) {
  switch(lengthOption) {
    case 'concise':
      return 'Very brief. Maximum 1 sentence. Under 20 words.';
    case 'detailed':
      return '2-3 sentences maximum. Be specific but concise.';
    default:
      return '1-2 sentences. Keep it punchy and direct.';
  }
}

async function generateSection(
  sectionType: 'subject' | 'hook' | 'cta' | 'offer' | 'ps' | 'testimonial' | 'urgency',
  context: Record<string, unknown>,
  previousSections: Record<string, string>,
  lengthOption: string = 'standard',
  toneOption: string = 'professional_warm'
) {
  const lengthInstructions = getLengthInstructions(lengthOption);
  
  // Define tone-specific instructions
  const toneInstructions: Record<string, string> = {
    'professional_warm': 'Professional but conversational. Like a helpful consultant talking directly to a client.',
    'casual_friendly': 'Casual and friendly. Use contractions. Keep it natural.',
    'direct_results': 'Direct and results-focused. Lead with outcomes. Skip pleasantries.',
    'consultative_helpful': 'Helpful expert tone. Guide them to success without being pushy.'
  };
  
  const toneGuidance = toneInstructions[toneOption] || toneInstructions['professional_warm'];
  
  // Build email context instructions if available
  let contextInstructions = '';
  const emailContext = context.emailContext as EmailGenerationPayload['emailContext'];
  if (emailContext) {
    const contextParts = [];
    
    if (emailContext.personas?.length) {
      contextParts.push(`Target audience: ${emailContext.personas.join(', ')}`);
    }
    if (emailContext.industries?.length) {
      contextParts.push(`Industry context: ${emailContext.industries.join(', ')}`);
    }
    if (emailContext.painPoints?.length) {
      contextParts.push(`Key pain points to address: ${emailContext.painPoints.join(', ')}`);
    }
    if (emailContext.metrics?.length) {
      contextParts.push(`Success metrics to emphasize: ${emailContext.metrics.join(', ')}`);
    }
    if (emailContext.urgencyFactors?.length) {
      contextParts.push(`Urgency factors: ${emailContext.urgencyFactors.join(', ')}`);
    }
    if (emailContext.socialProofs?.length) {
      contextParts.push(`Social proof elements: ${emailContext.socialProofs.join(', ')}`);
    }
    if (emailContext.objections?.length) {
      contextParts.push(`Objections to address: ${emailContext.objections.join(', ')}`);
    }
    if (emailContext.valueProps?.length) {
      contextParts.push(`Value propositions to highlight: ${emailContext.valueProps.join(', ')}`);
    }
    
    if (contextParts.length > 0) {
      contextInstructions = `\n\nIMPORTANT CONTEXT TO INCORPORATE:\n${contextParts.join('\n')}`;
    }
  }
  
  // Add global formatting rules
  const globalFormattingRules = `
CRITICAL FORMATTING RULES:
- NEVER use em dashes (—). Use commas or periods instead.
- Keep sentences SHORT. Break up long ones.
- Be concise. Remove filler words and repetitive phrases.
- Total email must be under 220 words.
- Write like you're talking to a colleague, not writing a formal proposal.`;
  
  let systemPrompt = '';
  switch(sectionType) {
    case 'subject':
      systemPrompt = `Generate a compelling email subject line for an automation ROI proposal. MAXIMUM 6-8 words. Focus on ONE specific benefit or metric. No generic words like 'Automate' or 'Transform'. Examples: "Cut data entry 80% this month" or "Save 15 hours weekly guaranteed". ${toneGuidance}${contextInstructions}`;
      break;
    case 'hook':
      systemPrompt = `Generate an engaging hook for a cold outreach email about automation. ${lengthInstructions} Start with their specific pain point or current situation. Use natural language and contractions. No corporate jargon. ${globalFormattingRules} ${toneGuidance}${contextInstructions}`;
      break;
    case 'cta':
      systemPrompt = `Generate a clear call-to-action that references ROI data and leads to PDF download. ${lengthInstructions} Be specific about what's in the PDF. Use concrete numbers naturally. Make it inviting (e.g., "Want to see the breakdown?" or "Here's your custom ROI snapshot:"). ${globalFormattingRules} ${toneGuidance}${contextInstructions}`;
      break;
    case 'offer':
      systemPrompt = `Generate a soft offer suggesting a pilot, demo, or consultation. ${lengthInstructions} Make it feel helpful, not salesy. Use phrases like "happy to show you" or "let's walk through it together". Focus on next steps. ${globalFormattingRules} ${toneGuidance}${contextInstructions}`;
      break;
    case 'ps':
      systemPrompt = `Generate a PS line. ONE short sentence only. Under 15 words. Add a surprising fact or create urgency. Examples: "PS. Your competitor automated this last month" or "PS. Setup takes under 30 minutes". ${globalFormattingRules} ${toneGuidance}${contextInstructions}`;
      break;
    case 'testimonial':
      systemPrompt = `Generate a brief testimonial quote. ONE sentence with specific metrics. Include attribution. Example: "Cut reporting time by 85% in week one" - Sarah Chen, Ops Manager. ${globalFormattingRules} ${toneGuidance}${contextInstructions}`;
      break;
    case 'urgency':
      systemPrompt = `Generate a subtle urgency line. ONE short sentence. Create FOMO without being pushy. Examples: "Three competitors started last quarter" or "Q4 calendars filling fast". ${globalFormattingRules} ${toneGuidance}${contextInstructions}`;
      break;
  }
  
  // Add anti-repetition instructions if we have previous sections
  if (Object.keys(previousSections).length > 0) {
    systemPrompt += ` IMPORTANT: Don't repeat these concepts already used: ${Object.values(previousSections).join(' | ')}. Find fresh angles.`;
  }
  
  // Build conversation context with previous sections
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt
    }
  ];
  
  // Add tone guidance with brevity emphasis
  messages.push({
    role: "system", 
    content: "Write like a helpful consultant who wants to solve problems. Be specific, not generic. Every word must earn its place. Cut anything that doesn't add value. Remember: total email under 220 words."
  });
  
  // Add previous sections as context
  if (Object.keys(previousSections).length > 0) {
    messages.push({
      role: "assistant",
      content: `Previous email sections generated:\n${Object.entries(previousSections)
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n')}`
    });
  }
  
  // Add the context data with instructions for natural integration
  messages.push({
    role: "user",
    content: `Generate the ${sectionType} section based on this context. Keep it concise and direct.\n\nContext:\n${JSON.stringify(context, null, 2)}\n\nProvide only the generated text, no explanations.`
  });
  
  const completion = await openai.chat.completions.create({
    model: chatDeploymentName,
    messages,
    temperature: sectionType === 'subject' ? 0.8 : 0.7, // Slightly lower for more focused output
    max_tokens: sectionType === 'subject' ? 30 : (sectionType === 'ps' || sectionType === 'urgency' ? 50 : 150), // Reduced token limits
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
    const toneOption = payload.toneOption || 'professional_warm';
    const enabledSections = payload.enabledSections || {
      subject: true,
      hook: true,
      cta: true,
      offer: true,
      ps: true,
      testimonial: false,
      urgency: false,
    };
    
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
      
      // Email context if provided
      ...(payload.emailContext && { emailContext: payload.emailContext }),
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
    if (enabledSections.subject !== false) {
      const subjectContext = selectFieldsForContext(fullContext);
      generatedSections.subjectLine = await generateSection('subject', subjectContext, {}, lengthOption, toneOption);
    }
    
    // 2. Generate Hook with subject + 70% of fields
    if (enabledSections.hook !== false) {
      const hookContext = selectFieldsForContext(fullContext);
      generatedSections.hookText = await generateSection('hook', hookContext, 
        generatedSections.subjectLine ? { subjectLine: generatedSections.subjectLine } : {}, 
        lengthOption, toneOption);
    }
    
    // 3. Generate CTA with subject + hook + 70% of fields
    if (enabledSections.cta !== false) {
      const ctaContext = selectFieldsForContext(fullContext);
      generatedSections.ctaText = await generateSection('cta', ctaContext, 
        { 
          ...(generatedSections.subjectLine && { subjectLine: generatedSections.subjectLine }),
          ...(generatedSections.hookText && { hookText: generatedSections.hookText })
        }, lengthOption, toneOption);
    }
    
    // 4. Generate Offer with all previous + 70% of fields
    if (enabledSections.offer !== false) {
      const offerContext = selectFieldsForContext(fullContext);
      generatedSections.offerText = await generateSection('offer', offerContext, 
        { 
          ...(generatedSections.subjectLine && { subjectLine: generatedSections.subjectLine }),
          ...(generatedSections.hookText && { hookText: generatedSections.hookText }),
          ...(generatedSections.ctaText && { ctaText: generatedSections.ctaText })
        }, lengthOption, toneOption);
    }
    
    // 5. Generate PS line if enabled
    if (enabledSections.ps) {
      const psContext = selectFieldsForContext(fullContext);
      generatedSections.psText = await generateSection('ps', psContext, generatedSections, lengthOption, toneOption);
    }
    
    // 6. Generate testimonial if enabled
    if (enabledSections.testimonial) {
      const testimonialContext = selectFieldsForContext(fullContext);
      generatedSections.testimonialText = await generateSection('testimonial', testimonialContext, generatedSections, lengthOption, toneOption);
    }
    
    // 7. Generate urgency line if enabled
    if (enabledSections.urgency) {
      const urgencyContext = selectFieldsForContext(fullContext);
      generatedSections.urgencyText = await generateSection('urgency', urgencyContext, generatedSections, lengthOption, toneOption);
    }
    
    return NextResponse.json({
      ...generatedSections,
      metadata: {
        lengthOption,
        toneOption,
        contextFieldsUsed: Object.keys(fullContext).length,
        workflowStepsIncluded: payload.workflowSteps?.length || 0,
        emailContextProvided: !!payload.emailContext && Object.values(payload.emailContext).some(arr => arr && arr.length > 0),
        enabledSections
      }
    });

  } catch (error: unknown) {
    console.error("/api/openai/generate-full-email error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error during full email generation" 
    }, { status: 500 });
  }
}