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

interface EmailGenerationPayload {
  roiData: Record<string, unknown>; // Replace 'any'
  scenarioName?: string;
  platform?: string;
  // Add any other relevant data from the currentScenario
}

async function generateSection(prompt: string, roiData: Record<string, unknown>, textToRefine?: string) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: prompt + ` Relevant ROI Data: ${JSON.stringify(roiData)}. Provide only the generated text.`
    },
  ];

  if (textToRefine) {
    messages[0].content = prompt + ` Relevant ROI Data: ${JSON.stringify(roiData)}. Refine this text: "${textToRefine}". Provide only the generated text.`;
    messages.push({ role: "user", content: textToRefine });
  } else {
    messages.push({ role: "user", content: "Please generate the text as instructed in the system prompt." });
  }

  const completion = await openai.chat.completions.create({
    model: chatDeploymentName,
    messages,
    temperature: 0.7,
    max_tokens: 200, // Adjust as needed per section
  });
  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function POST(req: Request) {
  if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
    return NextResponse.json({ error: "Azure OpenAI env vars missing" }, { status: 500 });
  }

  try {
    const payload = await req.json() as EmailGenerationPayload;
    const { roiData, scenarioName, platform } = payload;

    if (!roiData) {
      return NextResponse.json({ error: "Missing roiData" }, { status: 400 });
    }

    // Define system prompts for each section
    const subjectPrompt = `Generate a compelling email subject line for an automation proposal. Scenario name: ${scenarioName || 'Workflow Automation'}. Platform: ${platform || 'automation'}. Focus on key benefits.`;
    const hookPrompt = `Generate an engaging 2-3 sentence hook for a cold outreach email about an automation solution. Emphasize the primary pain point solved and the immediate value. Scenario name: ${scenarioName || 'Workflow Automation'}.`;
    const ctaPrompt = `Generate a clear and concise call-to-action paragraph for an email proposing an automation solution. It should lead to a provided PDF link.`;
    const offerPrompt = `Generate a soft offer paragraph for an email, suggesting a no-commitment pilot or demo of the automation solution.`;

    // Generate each section
    const subjectLine = await generateSection(subjectPrompt, roiData);
    const hookText = await generateSection(hookPrompt, roiData);
    const ctaText = await generateSection(ctaPrompt, roiData);
    const offerText = await generateSection(offerPrompt, roiData);

    return NextResponse.json({
      subjectLine,
      hookText,
      ctaText,
      offerText,
    });

  } catch (error: unknown) {
    console.error("/api/openai/generate-full-email error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error during full email generation" 
    }, { status: 500 });
  }
}