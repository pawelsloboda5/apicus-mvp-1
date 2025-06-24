# API Routes Overview (Apicus MVP)

> Last updated: 2025-06-23  
> **Status**: ✅ All Routes Tested with Postman
> **Type Safety**: ✅ Strong (See analysis below)

All routes live under `/api/` and return JSON. Times are UTC and all monetary values default to USD unless specified.

---

## 🔧 Debug & Health

| Route | Method | Description | Runtime | Status |
|-------|--------|-------------|---------|--------|
| `/api/debug` | `GET` | Environment health check and configuration validation | Node.js | ✅ Tested |

### Debug Response ✅ **Tested**
```typescript
interface DebugResponse {
  timestamp: string; // ISO 8601 timestamp
  environment: {
    hasAzureKey: boolean;
    hasAzureEndpoint: boolean;
    hasMongoUri: boolean;
    azureKeyLength: number;
    azureEndpoint: string;
    mongoDbName: string;
    embeddingDeployment: string;
    apiVersion: string;
    allEnvVars: number;
    nodeEnv: string;
  };
}
```

---

## 📄 Templates

| Route | Method | Description | Runtime | Status |
|-------|--------|-------------|---------|--------|
| `/api/templates/search?q=YOUR_QUERY` | `GET` | Vector similarity search over `apicus-templates` collection. Returns up to 6 best-fit templates. | Node.js | ✅ Tested |
| `/api/templates/[templateId]` | `GET` | Fetch a single template by its UUID `templateId`. Excludes embedding by default. | Node.js | ✅ Tested |
| `/api/templates/[templateId]/pricing` | `GET` | Fetch only the pricing data (`appPricingMap`) for a specific template. | Node.js | ✅ Tested |

### Template Pricing Response ✅ **Tested**

**Query**: `GET /api/templates/805517c3-86d0-4883-9daa-f17a6ac75e8f/pricing`

```typescript
interface TemplatePricingResponse {
  templateId: string;
  appPricingMap: Record<string, AppPricingData>;
  totalApps: number;
  pricingEnrichedAt?: string;
}
```

**Example Response:**
```json
{
  "templateId": "805517c3-86d0-4883-9daa-f17a6ac75e8f",
  "appPricingMap": {
    "abe4f70e-a659-47c4-8cc8-98ddd1527e1f": {
      "appId": "iterable",
      "appName": "Iterable",
      "appSlug": "iterable",
      "hasFreeTier": false,
      "hasFreeTrial": false,
      "currency": "USD",
      "lowestMonthlyPrice": null,
      "highestMonthlyPrice": null,
      "tierCount": 0,
      "hasUsageBasedPricing": false,
      "hasAIFeatures": false,
      "priceModelType": ["quote_based"],
      "isPricingPublic": false
    }
  },
  "totalApps": 1,
  "pricingEnrichedAt": "2025-06-18T23:57:51.086Z"
}
```

---

## 🤖 OpenAI

| Route | Method | Description | Runtime | Status |
|-------|--------|-------------|---------|--------|
| `/api/openai` | `POST` | Generic passthrough to Azure OpenAI chat-completions | Edge | ⏳ TODO |
| `/api/openai/generate-full-email` | `POST` | Generates multi-section email with ROI context | Edge | ✅ Tested |
| `/api/openai/generate-email-section` | `POST` | Regenerates single email section | Edge | ✅ Tested |

---

## 📥 Workflows

| Route | Method | Description | Runtime | Status |
|-------|--------|-------------|---------|--------|
| `/api/workflows/import` | `POST` | Import automation workflows from Make.com (n8n and Zapier coming soon) | Node.js | 🆕 New |

### Import Workflow 🆕 **New**

**Request (FormData):**
```typescript
// File upload
const formData = new FormData();
formData.append('file', file); // File object

// Headers
'X-Enrich-Pricing': 'true' // Optional: enrich with pricing data
```

**Request (JSON):**
```typescript
{
  data: MakeBlueprint // The Make.com JSON export
}
```

**Response:**
```typescript
interface ImportResponse {
  success: boolean;
  workflow?: ImportedWorkflow; // Parsed and normalized workflow
  template?: AlternativeTemplate; // Ready-to-use Apicus template
  stats?: {
    nodeCount: number;
    edgeCount: number;
    estimatedMinutes: number;
    detectedApps: string[]; // e.g., ["HTTP", "OpenAI", "Claude AI"]
  };
  error?: string;
  warnings?: string[]; // e.g., "5 modules may not be fully supported"
}
```

**Example:**
```typescript
// Import Make.com workflow
const formData = new FormData();
formData.append('file', makeWorkflowFile);

const response = await fetch('/api/workflows/import', {
  method: 'POST',
  headers: {
    'X-Enrich-Pricing': 'true'
  },
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log('Imported', result.stats.nodeCount, 'nodes');
  console.log('Apps used:', result.stats.detectedApps);
  // Use result.workflow or result.template
}
```

---

### Generate Full Email ✅ **Tested**

**Request Body:**
```typescript
interface GenerateFullEmailRequest {
  scenarioName: string;
  platform: "zapier" | "make" | "n8n";
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  netROI: number;
  roiRatio: number;
  paybackPeriod: string;
  lengthOption: "concise" | "standard" | "detailed";
  toneOption: string;
  enabledSections: {
    subject?: boolean;
    hook?: boolean;
    cta?: boolean;
    offer?: boolean;
    ps?: boolean;
    testimonial?: boolean;
    urgency?: boolean;
  };
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
}
```

**Response:**
```typescript
interface GenerateFullEmailResponse {
  subjectLine?: string;
  hookText?: string;
  ctaText?: string;
  offerText?: string;
  psText?: string;
  testimonialText?: string;
  urgencyText?: string;
  metadata: {
    lengthOption: string;
    toneOption: string;
    contextFieldsUsed: number;
    workflowStepsIncluded: number;
    emailContextProvided: boolean;
    enabledSections: Record<string, boolean>;
  };
}
```

### Generate Email Section ✅ **Tested**

**Request Body:**
```typescript
interface GenerateEmailSectionRequest {
  roiData: {
    scenarioName: string;
    platform: string;
    netROI: number;
    roiRatio: number;
    // ... other ROI fields
  };
  textToRewrite: string;
  systemPrompt: string;
  section: "subject" | "hook" | "cta" | "offer" | "ps" | "testimonial" | "urgency";
  lengthOption: "concise" | "standard" | "detailed";
  previousSections?: Record<string, string>;
  toneOption?: string;
}
```

**Response:**
```typescript
interface GenerateEmailSectionResponse {
  generatedText: string; // HTML formatted with <strong>, <em> tags
}
```

---

## 🗄️ Database Schema (IndexedDB/Dexie)

### Scenario Table (v8)
```typescript
interface Scenario {
  id?: number; // Autoincrement
  slug: string; // nanoid URL param
  name: string;
  createdAt: number;
  updatedAt: number;
  platform?: "zapier" | "make" | "n8n";
  
  // ROI Configuration
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  taskMultiplier?: number;
  taskType?: string;
  complianceEnabled?: boolean;
  riskLevel?: number;
  riskFrequency?: number;
  errorCost?: number;
  revenueEnabled?: boolean;
  monthlyVolume?: number;
  conversionRate?: number;
  valuePerConversion?: number;
  
  // Canvas State
  nodesSnapshot?: unknown[]; // ⚠️ Could be typed as Node[]
  edgesSnapshot?: unknown[]; // ⚠️ Could be typed as Edge[]
  viewport?: unknown; // ⚠️ Could be typed as Viewport
  
  // Template Linking
  originalTemplateId?: string;
  searchQuery?: string;
  alternativeTemplatesCache?: unknown[];
  templatePricingData?: Record<string, AppPricingData>;
  
  // Email Generation
  emailFirstName?: string;
  emailYourName?: string;
  emailYourCompany?: string;
  emailYourEmail?: string;
  emailCalendlyLink?: string;
  emailPdfLink?: string;
  emailHookText?: string;
  emailCtaText?: string;
  emailSubjectLine?: string;
  emailOfferText?: string;
  emailPsText?: string;
  emailTestimonialText?: string;
  emailUrgencyText?: string;
}
```

### Other Tables
- **nodes**: Flow nodes (id, scenarioId, reactFlowId, type)
- **edges**: Flow edges (id, scenarioId, reactFlowId)
- **metrics**: ROI snapshots (id, scenarioId, timestamp, metrics, trigger)

---

## 🔒 Type Safety Analysis

### ✅ **Strengths**
1. **Comprehensive Type Definitions**
   - Well-structured interfaces in `lib/types.ts` and `lib/types/index.ts`
   - Proper separation of concerns
   - Good use of TypeScript discriminated unions for node types

2. **Database Type Safety**
   - Dexie schema properly typed with 8 migration versions
   - Type-safe table operations with generics
   - Proper client-side only checks

3. **API Response Types**
   - All API responses have corresponding TypeScript interfaces
   - Consistent error response format

4. **React Hooks Type Safety**
   - All hooks properly typed with interfaces
   - Good use of generics where appropriate
   - Proper React 19 patterns (use, cache)

### ⚠️ **Areas for Improvement**

1. **Replace `unknown` Types**
   ```typescript
   // Current
   nodesSnapshot?: unknown[];
   edgesSnapshot?: unknown[];
   viewport?: unknown;
   
   // Should be
   nodesSnapshot?: Node[];
   edgesSnapshot?: Edge[];
   viewport?: Viewport;
   ```

2. **Replace `any` Types**
   ```typescript
   // Found in AppPricingData
   custom_limits?: Record<string, unknown> | null; // ✅ Good
   additionalFees: any[]; // ⚠️ Should be typed
   ```

3. **Missing Pricing Data**
   - Not a type safety issue but data quality
   - Only 1 of 3 apps has pricing in the tested template
   - Affects ROI calculation accuracy

### 📋 **Type Safety Checklist**
- ✅ All API routes have TypeScript interfaces
- ✅ Database schema is fully typed
- ✅ React hooks use proper TypeScript
- ✅ Error handling is consistent
- ⚠️ Some `unknown` and `any` types remain
- ⚠️ Incomplete pricing data enrichment

---

## 🚨 Known Issues & Limitations

### 1. **Incomplete Pricing Enrichment** (Data Quality)
- **Issue**: Not all apps have pricing data in `appPricingMap`
- **Example**: Template uses 3 apps but only 1 has pricing
- **Impact**: ROI calculations may underestimate platform costs
- **Solution**: Enrich more apps in `apicus-apps-prices` collection

### 2. **Type Precision**
- **Issue**: Using `unknown` for React Flow types
- **Impact**: Loss of type safety in canvas operations
- **Solution**: Import and use specific React Flow types

### 3. **Search Limitations**
- **Vector Search**: 6 results maximum
- **Embedding Size**: 1536 dimensions (excluded from responses)
- **Fallback**: Cosmos DB → Atlas MongoDB

---

## 🎯 Recommendations

1. **Immediate Actions**
   - Replace all `unknown` with proper React Flow types
   - Type all `any` occurrences with specific interfaces
   - Add missing app pricing data to MongoDB

2. **Future Improvements**
   - Add request/response validation middleware
   - Implement API versioning
   - Add rate limiting
   - Create OpenAPI/Swagger documentation

3. **Testing**
   - Add integration tests for all routes
   - Test error scenarios
   - Validate TypeScript compilation in CI/CD
