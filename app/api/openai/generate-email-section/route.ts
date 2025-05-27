import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
// Use the same deployment name as in generate-full-email or a specific one if different
const chatDeploymentName = process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-4.1"; 
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview"; // or your specific API version

if (!apiKey || !azureEndpoint) {
  console.error("Missing Azure OpenAI API Key or Endpoint environment variables for /api/openai/generate-email-section.");
  // It's good practice to also check for chatDeploymentName if it's critical
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: `${azureEndpoint}/openai/deployments/${chatDeploymentName}`,
  defaultQuery: { "api-version": apiVersion },
  defaultHeaders: { "api-key": apiKey },
});

export async function POST(req: Request) {
  try {
    const { roiData, textToRewrite, systemPrompt } = await req.json();

    if (!roiData || !textToRewrite || !systemPrompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${systemPrompt} Current ROI Data: ${JSON.stringify(roiData)}. The user wants to rewrite the following text: "${textToRewrite}". Provide only the rewritten text. Ensure the output is suitable for direct injection into an HTML email template, meaning if you use markdown like bold or italics, use <strong> or <em> tags respectively. Do not use markdown asterisks or underscores for emphasis. Retain HTML entities like &nbsp; if present in the original text. Do not add any introductory or concluding phrases beyond the rewritten text itself.`,
      },
      {
        role: "user",
        content: textToRewrite, // Provide the text to rewrite again as user message for context
      },
    ];

    const completion = await openai.chat.completions.create({
      model: chatDeploymentName, // Use the deployment name as the model
      messages,
      temperature: 0.7,
      max_tokens: 300, // Increased slightly for potentially richer content
    });

    const generatedText = completion.choices[0]?.message?.content?.trim();

    if (!generatedText) {
        return NextResponse.json({ error: "Failed to generate text from OpenAI" }, { status: 500 });
    }

    return NextResponse.json({ generatedText });

  } catch (error: any) {
    console.error("/api/openai/generate-email-section error", error.status, error.message, error.headers, error.error);
    return NextResponse.json({ error: error?.message || "Unexpected error during email section generation", detail: error?.error }, { status: error?.status || 500 });
  }
} 