"use strict";
// migrateTemplates.ts
// ---------------------------------------------
// One-off migration script: reads legacy Zapier-processed
// templates from collection `2apicus-processed-templates`
// (in the same MongoDB cluster) and inserts transformed
// documents into `apicus-db.apicus-templates` using the
// `AutomationTemplate` schema defined in automationTemplateSchema.ts.
// ---------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var dotenv = require("dotenv");
var openai_1 = require("openai");
dotenv.config();
/* ------------------------------------------------------------------ */
// Config
var MONGODB_URI = process.env.MONGODB_URI;
var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI env var");
    process.exit(1);
}
var SOURCE_DB = "apicus-db"; // assuming same DB name for source; adjust if different
var SOURCE_COLLECTION = "apicus-processed-templates";
var TARGET_DB = "apicus-db";
var TARGET_COLLECTION = "apicus-templates";
// Initialise OpenAI client if key present
var openai = OPENAI_API_KEY ? new openai_1.default({ apiKey: OPENAI_API_KEY }) : null;
/* ------------------------------------------------------------------ */
// Helper to derive simple example prompts from a template title.
function createPrompts(title, richDescription, steps) {
    return __awaiter(this, void 0, void 0, function () {
        var base, stepSummary, response, text, arr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!openai) {
                        base = title
                            .replace(/\b(New|Updated|Create|Generate|Send)\b/gi, "")
                            .replace(/\s+/g, " ")
                            .trim();
                        return [2 /*return*/, [
                                title,
                                "Automate ".concat(base.charAt(0).toLowerCase() + base.slice(1)),
                                "I want to ".concat(base.charAt(0).toLowerCase() + base.slice(1)),
                            ]];
                    }
                    stepSummary = steps
                        .map(function (s) { return "".concat(s.label, " (").concat(s.appName, ")"); })
                        .join(" -> ");
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: "gpt-4o-mini", // gpt-4.1 equivalent; adjust if needed
                            temperature: 0.7,
                            messages: [
                                {
                                    role: "system",
                                    content: "You are an automation consultant helping non-technical small-business owners describe their automation needs in plain English. For the given automation template, craft 3 concise natural-language prompts that such a user might type when looking for this automation. Keep them under 15 words each and avoid technical jargon.",
                                },
                                {
                                    role: "user",
                                    content: "TEMPLATE TITLE: ".concat(title, "\nDESCRIPTION: ").concat(richDescription, "\nSTEPS: ").concat(stepSummary),
                                },
                            ],
                            max_tokens: 128,
                            n: 1,
                        })];
                case 1:
                    response = _a.sent();
                    text = response.choices[0].message.content || "";
                    // Try JSON first
                    try {
                        arr = JSON.parse(text.trim());
                        if (Array.isArray(arr))
                            return [2 /*return*/, arr.slice(0, 3).map(String)];
                    }
                    catch (_b) { }
                    // Fallback split by newline or semicolon
                    return [2 /*return*/, text
                            .split(/[\n;]+/)
                            .map(function (l) { return l.trim(); })
                            .filter(Boolean)
                            .slice(0, 3)];
            }
        });
    });
}
// Map legacy doc → AutomationTemplate
function transform(doc) {
    return __awaiter(this, void 0, void 0, function () {
        var steps, now, examplePrompts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    steps = (doc.steps || []).map(function (s) { return ({
                        index: s.index,
                        label: s.label,
                        action: s.action,
                        typeOf: s.type_of,
                        appId: s.app_id,
                        appName: s.app_name,
                        appSlug: s.app_slug,
                    }); });
                    now = new Date();
                    return [4 /*yield*/, createPrompts(doc.title, doc.rich_description || doc.title, steps.map(function (s) { return ({ label: s.label, appName: s.appName }); }))];
                case 1:
                    examplePrompts = _a.sent();
                    return [2 /*return*/, {
                            templateId: doc.template_id,
                            title: doc.title,
                            url: doc.url,
                            editorUrl: doc.editor_url,
                            source: "zapier", // legacy templates all from Zapier
                            richDescription: doc.rich_description || doc.title,
                            exampleUserPrompts: examplePrompts,
                            steps: steps,
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
                        }];
            }
        });
    });
}
/* ------------------------------------------------------------------ */
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var client, source, target, cursor, inserted, doc, transformed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new mongodb_1.MongoClient(MONGODB_URI);
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    console.log("Connected to MongoDB");
                    source = client.db(SOURCE_DB).collection(SOURCE_COLLECTION);
                    target = client.db(TARGET_DB).collection(TARGET_COLLECTION);
                    cursor = source.find().sort({ step_count: -1 }).limit(200);
                    inserted = 0;
                    _a.label = 2;
                case 2: return [4 /*yield*/, cursor.hasNext()];
                case 3:
                    if (!_a.sent()) return [3 /*break*/, 7];
                    return [4 /*yield*/, cursor.next()];
                case 4:
                    doc = _a.sent();
                    if (!doc)
                        return [3 /*break*/, 7];
                    return [4 /*yield*/, transform(doc)];
                case 5:
                    transformed = _a.sent();
                    // Upsert by templateId to avoid duplicates if script re-runs
                    return [4 /*yield*/, target.updateOne({ templateId: transformed.templateId }, { $set: transformed }, { upsert: true })];
                case 6:
                    // Upsert by templateId to avoid duplicates if script re-runs
                    _a.sent();
                    inserted += 1;
                    return [3 /*break*/, 2];
                case 7:
                    console.log("Migration complete. Upserted ".concat(inserted, " templates."));
                    return [4 /*yield*/, client.close()];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run().catch(function (err) {
    console.error(err);
    process.exit(1);
});
