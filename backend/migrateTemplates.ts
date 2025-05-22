// migrateTemplates.ts
// ---------------------------------------------
// One-off migration script: reads legacy Zapier-processed
// templates from collection `2apicus-processed-templates`
// (in the same MongoDB cluster) and inserts transformed
// documents into `apicus-db.apicus-templates` using the
// `AutomationTemplate` schema defined in automationTemplateSchema.ts.
// ---------------------------------------------

import { MongoClient, WithId, Document } from "mongodb";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import { AutomationTemplate, TemplateStep } from "./automationTemplateSchema";

dotenv.config();

/* ------------------------------------------------------------------ */
// Config
const MONGODB_URI = process.env.MONGODB_URI as string;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI env var");
  process.exit(1);
}

const SOURCE_DB = "apicus-db-data"; 
const SOURCE_COLLECTION = "apicus-processed-templates";
const TARGET_DB = "apicus-db-data";
const TARGET_COLLECTION = "apicus-templates";

// ---------- OpenAI / Azure OpenAI configuration ----------
let openai: OpenAI | null = null;

if (OPENAI_API_KEY) {
  // Detect Azure vs public OpenAI by presence of endpoint env variable
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (azureEndpoint) {
    // Azure: baseURL must include deployment name
    const deployment = process.env.AZURE_4_1_DEPLOYMENT || "o3"; // deployment name in Azure portal
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: `${azureEndpoint}/openai/deployments/${deployment}`,
      defaultHeaders: {
        "api-key": OPENAI_API_KEY,
      },
      defaultQuery: { "api-version": apiVersion },
    });
  } else {
    // Public OpenAI
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
}

/* ------------------------------------------------------------------ */
// Helper to derive simple example prompts from a template title.
async function createPrompts(
  title: string,
  richDescription: string,
  steps: { label: string; appName: string }[]
): Promise<string[]> {
  if (!openai) {
    // Fallback simple heuristic if OpenAI key missing
    const base = title
      .replace(/\b(New|Updated|Create|Generate|Send)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return [
      title,
      `Automate ${base.charAt(0).toLowerCase() + base.slice(1)}`,
      `I want to ${base.charAt(0).toLowerCase() + base.slice(1)}`,
    ];
  }

  const stepSummary = steps
    .map(s => `${s.label} (${s.appName})`)
    .join(" -> ");

  const isAzure = !!process.env.AZURE_OPENAI_ENDPOINT;
  const model = isAzure ? undefined : (process.env.OPENAI_MODEL || "gpt-4o-mini");

  // Build the request payload conditionally: Azure deployments include the model via the URL path
  const requestPayload: any = {
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are an automation consultant helping non-technical small-business owners describe their automation needs in plain English. For the given automation template, craft 3 concise natural-language prompts that such a user might type when looking for this automation. Keep them under 15 words each and avoid technical jargon.",
      },
      {
        role: "user",
        content: `TEMPLATE TITLE: ${title}\nDESCRIPTION: ${richDescription}\nSTEPS: ${stepSummary}`,
      },
    ],
    model: "gpt-4.1",
    max_tokens: 128,
    n: 1,
  };

  if (!isAzure) {
    requestPayload.model = model;
  }

  const response = await (openai as any).chat.completions.create(requestPayload);

  // Expect a JSON array or newline list; parse robustly
  const text = response.choices[0].message.content || "";
  // Try JSON first
  try {
    const arr = JSON.parse(text.trim());
    if (Array.isArray(arr)) return arr.slice(0, 3).map(String);
  } catch {}
  // Fallback split by newline or semicolon
  return text
    .split(/[\n;]+/)
    .map((l: string) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
}

// Map legacy doc → AutomationTemplate
async function transform(doc: WithId<Document>): Promise<AutomationTemplate> {
  // Steps transformation with type rename
  const steps: TemplateStep[] = (doc.steps || []).map((s: any) => ({
    index: s.index,
    label: s.label,
    action: s.action,
    typeOf: s.type_of,
    appId: s.app_id,
    appName: s.app_name,
    appSlug: s.app_slug,
  }));

  const now = new Date();
  const examplePrompts = await createPrompts(doc.title, doc.rich_description || doc.title, steps.map(s => ({ label: s.label, appName: s.appName })));

  return {
    templateId: doc.template_id,
    title: doc.title,
    url: doc.url,
    editorUrl: doc.editor_url,
    source: "zapier", // legacy templates all from Zapier
    richDescription: doc.rich_description || doc.title,
    exampleUserPrompts: examplePrompts,

    steps,
    appIds: doc.app_ids || [],
    appNames: doc.app_names || [],
    stepCount: doc.step_count,
    firstStepType: doc.first_step_type,
    lastStepType: doc.last_step_type,
    stepSequence: doc.step_sequence || [],

    // Legacy dataset has no nodes/edges; leave undefined (to be enriched later)

    processedAt: doc.processed_at ? new Date(doc.processed_at) : undefined,
    createdAt: doc.processed_at ? new Date(doc.processed_at) : now,
    updatedAt: now,
  } as AutomationTemplate;
}

/* ------------------------------------------------------------------ */
async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const source = client.db(SOURCE_DB).collection(SOURCE_COLLECTION);
  const target = client.db(TARGET_DB).collection<AutomationTemplate>(TARGET_COLLECTION);

  // Process the 200 largest (by step_count) templates first
  const cursor = source.find().sort({ step_count: -1 }).limit(200);
  const total = await source.countDocuments();
  console.log(`Source collection total documents: ${total}`);
  let inserted = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) break;

    const transformed = await transform(doc);
    // Upsert by templateId to avoid duplicates if script re-runs
    await target.updateOne(
      { templateId: transformed.templateId },
      { $set: transformed },
      { upsert: true }
    );
    inserted += 1;
  }

  console.log(`Migration complete. Upserted ${inserted} templates.`);
  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
}); 