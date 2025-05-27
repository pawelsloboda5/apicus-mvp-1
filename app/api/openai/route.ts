import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge"; // Runs on the Edge runtime for lowest latency

// Expected payload shape
// {
//   "messages": [{ role: "system" | "user" | "assistant", content: string }],
//   "model"?: string,
//   "tools"?: any[]
// }

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT, // For Azure deployments; ignored for OpenAI cloud
});

export async function POST(req: Request) {
  try {
    const { messages, model = "gpt-4.1", tools } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      tools,
    });

    return NextResponse.json(completion);
  } catch (error: unknown) {
    console.error("/api/openai error", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected error" 
    }, { status: 500 });
  }
} 