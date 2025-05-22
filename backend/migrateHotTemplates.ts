// migrateHotTemplates.ts
// ---------------------------------------------
// Migration script: reads templates from the source collection
// that contain any of the "hot" apps (from overlapping_apps_cleaned.csv)
// and inserts them into the target collection using the
// `AutomationTemplate` schema.
// ---------------------------------------------

import { MongoClient, WithId, Document } from "mongodb";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { AutomationTemplate, TemplateStep } from "./automationTemplateSchema";
// Import the enrichment and embedding functions
import { buildNodesAndEdges, enrichTemplateWithFlow } from "./enrichTemplatesWithFlow";
import { buildInput, embedTemplate, getOpenAIClient } from "./embedTemplateEmbeddings";

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
const APP_LIST_PATH = path.join(__dirname, "overlapping_apps_cleaned.csv");

// ---------- OpenAI / Azure OpenAI configuration ----------
// For embedding use getOpenAIClient() from embedTemplateEmbeddings.ts
let openai: OpenAI | null = getOpenAIClient();

// Configure a separate client for chat completions
let chatOpenAI: OpenAI | null = null;
if (OPENAI_API_KEY) {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (azureEndpoint) {
    // Azure: use the chat deployment, not the embedding deployment
    const chatDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_4_1_DEPLOYMENT || "o3";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";
    
    chatOpenAI = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: `${azureEndpoint}/openai/deployments/${chatDeployment}`,
      defaultHeaders: { "api-key": OPENAI_API_KEY },
      defaultQuery: { "api-version": apiVersion },
    });
  } else {
    // Public OpenAI
    chatOpenAI = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
}

/* ------------------------------------------------------------------ */
// Helper to derive simple example prompts from a template title.
async function createPrompts(
  title: string,
  richDescription: string,
  steps: { label: string; appName: string }[]
): Promise<string[]> {
  if (!chatOpenAI) {
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

  try {
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
      max_tokens: 128,
      n: 1,
    };

    // Only set model for public OpenAI
    if (!isAzure) {
      requestPayload.model = model || "gpt-4o-mini";
    }

    const response = await (chatOpenAI as any).chat.completions.create(requestPayload);

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
  } catch (error) {
    console.error("Error generating prompts with OpenAI, using fallback:", error);
    // Fallback if API call fails
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
// Read the app list from CSV file
function readHotAppList(filePath: string): string[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Skip header row and filter out empty lines
    return fileContent
      .split('\n')
      .slice(1)
      .map(line => line.trim().toLowerCase())
      .filter(Boolean);
  } catch (error) {
    console.error(`Error reading app list from ${filePath}:`, error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
async function migrateHotTemplates() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const source = client.db(SOURCE_DB).collection(SOURCE_COLLECTION);
  const target = client.db(TARGET_DB).collection<AutomationTemplate>(TARGET_COLLECTION);

  // Check if we're in resume mode
  const isResumeMode = process.argv.includes('--resume');
  let existingTemplateIds: Set<string> = new Set();
  
  if (isResumeMode) {
    console.log("Running in RESUME mode - will skip templates that already exist");
    // Get list of templates already in the target collection
    const existingTemplates = await target.find({}, { projection: { templateId: 1 } }).toArray();
    existingTemplateIds = new Set(existingTemplates.map(t => t.templateId));
    console.log(`Found ${existingTemplateIds.size} existing templates that will be skipped`);
  }

  // Read the list of hot apps
  const hotApps = readHotAppList(APP_LIST_PATH);
  console.log(`Loaded ${hotApps.length} hot apps from CSV`);
  
  if (hotApps.length === 0) {
    console.error("No hot apps found in CSV file. Exiting.");
    await client.close();
    process.exit(1);
  }

  // Track templates by app to limit to 5 per app
  const templatesByApp: Record<string, WithId<Document>[]> = {};
  
  // Initialize the dictionary with empty arrays for each app
  for (const app of hotApps) {
    templatesByApp[app] = [];
  }

  let totalTemplatesFound = 0;
  
  // Process each hot app separately to get top 5 by step count
  for (const hotApp of hotApps) {
    console.log(`Finding templates for hot app: ${hotApp}`);
    
    try {
      // Query for templates containing this specific app
      const appQuery = {
        $or: [
          { "steps.app_name": { $regex: hotApp, $options: 'i' } },
          { "steps.app_slug": { $regex: hotApp.replace(/\s+/g, ''), $options: 'i' } },
          { "app_names": { $regex: hotApp, $options: 'i' } },
          { "primary_app_name": { $regex: hotApp, $options: 'i' } }
        ]
      };
      
      // Find templates and sort by step_count (descending) to get the ones with most steps
      const appTemplates = await source.find(appQuery)
        .sort({ step_count: -1 })
        .limit(5)  // Only take top 5 with most steps
        .toArray();
      
      console.log(`Found ${appTemplates.length} templates for app "${hotApp}"`);
      totalTemplatesFound += appTemplates.length;
      
      // Store the templates
      templatesByApp[hotApp] = appTemplates;
    } catch (error: any) {
      console.error(`Error finding templates for app "${hotApp}": ${error.message}`);
      templatesByApp[hotApp] = []; // Empty array to avoid undefined errors later
    }
  }

  console.log(`Total templates to migrate: ${totalTemplatesFound}`);
  
  let inserted = 0;
  let skipped = 0;
  
  // Now process all the selected templates
  for (const hotApp of Object.keys(templatesByApp)) {
    const templates = templatesByApp[hotApp];
    
    if (templates.length === 0) {
      console.log(`No templates found for app "${hotApp}"`);
      continue;
    }
    
    console.log(`\nProcessing ${templates.length} templates for app "${hotApp}":`);
    
    for (const doc of templates) {
      // Skip if already migrated and in resume mode
      if (isResumeMode && existingTemplateIds.has(doc.template_id)) {
        console.log(`Template ${doc.template_id}: ${doc.title} - SKIPPED (already exists)`);
        skipped++;
        continue;
      }
      
      // Find all matching hot apps for this template
      const matchedApps = new Set<string>();
      
      // Check in steps
      if (doc.steps && Array.isArray(doc.steps)) {
        for (const step of doc.steps) {
          const appName = (step.app_name || '').toLowerCase();
          const appSlug = (step.app_slug || '').toLowerCase();
          
          for (const app of hotApps) {
            if (appName.includes(app) || appSlug.includes(app.replace(/\s+/g, ''))) {
              matchedApps.add(app);
            }
          }
        }
      }
      
      // Check in app_names
      if (doc.app_names && Array.isArray(doc.app_names)) {
        for (const appName of doc.app_names) {
          const name = (appName || '').toLowerCase();
          for (const app of hotApps) {
            if (name.includes(app)) {
              matchedApps.add(app);
            }
          }
        }
      }
      
      // Check primary_app_name
      if (doc.primary_app_name) {
        const primaryAppName = doc.primary_app_name.toLowerCase();
        for (const app of hotApps) {
          if (primaryAppName.includes(app)) {
            matchedApps.add(app);
          }
        }
      }

      console.log(`Template ${doc.template_id}: ${doc.title} (${doc.step_count} steps)`);
      console.log(`  Matched apps: ${Array.from(matchedApps).join(', ')}`);
      
      try {
        const transformed = await transform(doc);
        
        // Upsert by templateId to avoid duplicates if script re-runs
        await target.updateOne(
          { templateId: transformed.templateId },
          { $set: transformed },
          { upsert: true }
        );
        
        inserted += 1;
        console.log(`  Migrated: ${inserted}/${totalTemplatesFound}`);
        
        // Immediately enrich with flow nodes
        console.log(`  Enriching with React Flow nodes/edges...`);
        
        try {
          // Use the imported enrichment function
          const enrichResult = await enrichTemplateWithFlow(
            client,
            TARGET_DB,
            TARGET_COLLECTION,
            transformed.templateId
          );
          
          if (enrichResult) {
            console.log(`  Template enriched with ${enrichResult.nodes.length} nodes and ${enrichResult.edges.length} edges`);
          } else {
            console.log(`  Failed to enrich template`);
          }
        } catch (enrichError: any) {
          console.error(`  Error enriching template: ${enrichError.message}`);
        }
        
        // Generate and store the embedding
        if (openai) {
          console.log(`  Generating vector embedding...`);
          
          try {
            // Use the imported embedding function
            const embeddingVector = await embedTemplate(
              client,
              TARGET_DB,
              TARGET_COLLECTION,
              transformed.templateId,
              openai
            );
            
            if (embeddingVector) {
              console.log(`  Vector embedding generated and stored`);
            } else {
              console.log(`  Failed to generate embedding`);
            }
          } catch (embedError: any) {
            console.error(`  Error generating embedding: ${embedError.message}`);
          }
        } else {
          console.log(`  Skipping embedding generation (OpenAI client not configured)`);
        }
      } catch (templateError: any) {
        console.error(`  Error processing template ${doc.template_id}: ${templateError.message}`);
      }
    }
  }

  console.log(`\nMigration complete. Upserted ${inserted} templates.`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} templates that were already migrated.`);
  }
  await client.close();
}

/* ------------------------------------------------------------------ */
async function run() {
  await migrateHotTemplates();
  
  console.log("");
  console.log("Migration completed successfully!");
  console.log("");
  console.log("Next step:");
  console.log("Run 'createVectorIndex.ts' if you haven't created the vector index yet");
  console.log("   > npx ts-node backend/createVectorIndex.ts");
  console.log("   > npm run create:vectorIndex");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
}); 