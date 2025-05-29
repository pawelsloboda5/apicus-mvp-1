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
      section,
      previousSections = {}
    } = await req.json();

    if (!roiData || !textToRewrite || !systemPrompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const lengthInstructions = getLengthInstructions(lengthOption);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${systemPrompt} ${lengthInstructions} Current ROI Data: ${JSON.stringify(roiData)}. The user wants to rewrite the following text: "${textToRewrite}". Provide only the rewritten text. Ensure the output is suitable for direct injection into an HTML email template, meaning if you use markdown like bold or italics, use <strong> or <em> tags respectively. Do not use markdown asterisks or underscores for emphasis. Retain HTML entities like &nbsp; if present in the original text. Do not add any introductory or concluding phrases beyond the rewritten text itself.`,
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