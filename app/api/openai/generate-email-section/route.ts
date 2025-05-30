import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const chatDeploymentName = process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-4.1"; 
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-03-01-preview";

if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
  console.error("Missing Azure OpenAI environment variables for /api/openai/generate-email-section:", {
    hasApiKey: !!AZURE_OPENAI_API_KEY,
    hasEndpoint: !!azureEndpoint,
    hasDeployment: !!chatDeploymentName
  });
}

const openai = new OpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  baseURL: `${azureEndpoint}/openai/deployments/${chatDeploymentName}`,
  defaultQuery: { "api-version": apiVersion },
  defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
});

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

export async function POST(req: Request) {
  if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
    return NextResponse.json({ error: "Azure OpenAI env vars missing" }, { status: 500 });
  }

  try {
    const { 
      roiData, 
      textToRewrite, 
      systemPrompt, 
      lengthOption = 'standard',
      previousSections = {},
      section,
      toneOption = 'professional_warm'
    } = await req.json();

    if (!roiData || !textToRewrite || !systemPrompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const lengthInstructions = getLengthInstructions(lengthOption);
    
    // Extract email context from roiData if present
    let contextInstructions = '';
    if (roiData.emailContext) {
      const contextParts = [];
      const emailContext = roiData.emailContext;
      
      if (emailContext.personas?.length) {
        contextParts.push(`TARGET PERSONAS: ${emailContext.personas.join(', ')} - Write specifically for these roles using their terminology.`);
      }
      if (emailContext.industries?.length) {
        contextParts.push(`INDUSTRIES: ${emailContext.industries.join(', ')} - Use industry-specific language and references.`);
      }
      if (emailContext.painPoints?.length) {
        contextParts.push(`PAIN POINTS: ${emailContext.painPoints.join(', ')} - Address these specific problems directly.`);
      }
      if (emailContext.metrics?.length) {
        contextParts.push(`KEY METRICS: ${emailContext.metrics.join(', ')} - Emphasize improvements in these areas.`);
      }
      if (emailContext.urgencyFactors?.length) {
        contextParts.push(`URGENCY: ${emailContext.urgencyFactors.join(', ')} - Reference these time-sensitive factors.`);
      }
      if (emailContext.socialProofs?.length) {
        contextParts.push(`SOCIAL PROOF: ${emailContext.socialProofs.join(', ')} - Weave in these credibility elements.`);
      }
      if (emailContext.objections?.length) {
        contextParts.push(`OBJECTIONS: ${emailContext.objections.join(', ')} - Subtly address these concerns.`);
      }
      if (emailContext.valueProps?.length) {
        contextParts.push(`VALUE PROPS: ${emailContext.valueProps.join(', ')} - Highlight these specific benefits.`);
      }
      
      if (contextParts.length > 0) {
        contextInstructions = `\n\nEMAIL CONTEXT TO INCORPORATE:\n${contextParts.join('\n')}\n\nUse these context elements creatively - don't just list them.`;
      }
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${systemPrompt} ${lengthInstructions}${contextInstructions}
        
Current ROI Data for reference: ${JSON.stringify({
  scenarioName: roiData.scenarioName,
  platform: roiData.platform,
  netROI: roiData.netROI,
  roiRatio: roiData.roiRatio,
  paybackPeriod: roiData.paybackPeriod,
  totalHoursSaved: roiData.totalHoursSaved,
  runsPerMonth: roiData.runsPerMonth
})}

The user wants to rewrite the following text: "${textToRewrite}". 

IMPORTANT FORMATTING RULES:
- Provide only the rewritten text, no explanations
- Use <strong> and <em> HTML tags instead of markdown
- Keep &nbsp; HTML entities if present
- Be conversational and natural
- Match the tone: ${toneOption}
- For section type "${section || 'general'}": focus on making it compelling and specific to the context provided`,
      },
    ];

    // Add previous sections context if available
    if (Object.keys(previousSections).length > 0) {
      messages.push({
        role: "assistant",
        content: `Context from previous email sections:\n${Object.entries(previousSections)
          .map(([key, value]) => `${key}: "${value}"`)
          .join('\n')}`
      });
    }

    messages.push({
      role: "user",
      content: textToRewrite,
    });

    const completion = await openai.chat.completions.create({
      model: chatDeploymentName,
      messages,
      temperature: 0.7,
      max_tokens: lengthOption === 'concise' ? 150 : lengthOption === 'detailed' ? 400 : 300,
    });

    const generatedText = completion.choices[0]?.message?.content?.trim();

    if (!generatedText) {
        return NextResponse.json({ error: "Failed to generate text from OpenAI" }, { status: 500 });
    }

    return NextResponse.json({ generatedText });

  } catch (error: unknown) {
    console.error("/api/openai/generate-email-section error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error during email section generation" 
    }, { status: 500 });
  }
}