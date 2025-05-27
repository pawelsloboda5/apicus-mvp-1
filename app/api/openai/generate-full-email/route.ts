import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
// This should be your CHAT COMPLETION deployment name, e.g., the deployment of gpt-4.1
const chatDeploymentName = process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-4.1"; 
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

if (!apiKey || !azureEndpoint) {
  // Added a check here to make sure essential env vars are present
  console.error("Missing Azure OpenAI API Key or Endpoint environment variables.");
  // Consider not throwing here directly if you want to return a JSON response, 
  // but for critical config, an early exit might be desired in some setups.
}

const openai = new OpenAI({
  apiKey: apiKey,
  // Construct baseURL similar to the working embeddings route, including the deployment name
  baseURL: `${azureEndpoint}/openai/deployments/${chatDeploymentName}`,
  defaultQuery: { "api-version": apiVersion },
  defaultHeaders: { "api-key": apiKey },
});

interface EmailGenerationPayload {
  roiData: any; // Define a more specific type if possible
  scenarioName?: string;
  platform?: string;
  // Add any other relevant data from the currentScenario
}

async function generateSection(prompt: string, roiData: any, textToRefine?: string) {
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

  } catch (error: any) {
    console.error("/api/openai/generate-full-email error", error);
    return NextResponse.json({ error: error?.message || "Unexpected error during full email generation" }, { status: 500 });
  }
} 