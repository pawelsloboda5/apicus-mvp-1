# API Routes Overview (Apicus MVP)

> Last updated: 2025-06-18

All routes live under `/api/` and return JSON. Times are UTC and all monetary values default to USD unless specified.

---

## 1. Templates

| Route | Method | Description |
|-------|--------|-------------|
| `/api/templates/search?q=YOUR_QUERY` | `GET` | Vector similarity search over `apicus-templates` collection. Returns up to 6 best-fit templates. |
| `/api/templates/[templateId]` | `GET` | Fetch a single template by its UUID `templateId`. Projection excludes the large 1 536-dim embedding by default. Add `?includeEmbedding=true` for server-side vector operations. |
| `/api/templates/[templateId]/pricing` | `GET` | Fetch only the pricing data (`appPricingMap`) for a specific template. Optimized for client-side pricing calculations. |

### `Template` Response Shape
```jsonc
{
  "mongoId": "682e893563412e90570c1178", // Mongo _id for internal use
  "templateId": "66454872-…",
  "title": "Capture…ChatGPT",
  "source": "zapier",          // or "make", "n8n", etc.
  "platform": "zapier",        // optional platform hint
  "nodes": [...],               // React-Flow node objects (id/type/position/data)
  "edges": [...],               // React-Flow edges
  "appPricingMap": { "<appId>": { /* pricing fields */ } },
  "pricingEnrichedAt": "2025-06-18T19:03:38.695Z"
  /* other descriptive fields */
}
```

Search returns the same objects inside `templates[]` plus a `searchType` (`cosmos` or `atlas`).

### `TemplatePricing` Response Shape
```jsonc
{
  "templateId": "66454872-…",
  "appPricingMap": {
    "2d5bdf2b-2f17-4079-8b79-f9b13e18899d": {
      "appId": "brevo",
      "appName": "Brevo", 
      "appSlug": "brevo",
      "hasFreeTier": true,
      "hasFreeTrial": false,
      "currency": "USD",
      "lowestMonthlyPrice": 0,
      "highestMonthlyPrice": 16.17,
      "tierCount": 4,
      "hasUsageBasedPricing": true,
      "hasAIFeatures": false,
      "logoUrl": "https://...",
      "description": "Brevo is the leading CRM suite...",
      "limits": { "users": "unlimited", "custom_limits": null }
    }
    // ... more apps
  },
  "totalApps": 3,
  "pricingEnrichedAt": "2025-06-18T19:02:23.653Z"
}
```

---

## 2. Pricing

| Route | Method | Description |
|-------|--------|-------------|
| `/api/pricing/[appId]` | `GET` | Fetch enriched pricing data for a single app (from `apicus-apps-prices`). |

`appId` is the canonical ID stored in template steps. Response includes tier breakdown, usage-based pricing, and `ai_specific_pricing` when available.

---

## 3. OpenAI

| Route | Method | Description |
|-------|--------|-------------|
| `/api/openai` | `POST` | Generic passthrough to Azure OpenAI chat-completions. Send `{ messages }`. |
| `/api/openai/generate-full-email` | `POST` | Generates a multi-section email (subject, hook, CTA, etc.) given ROI + context payload. |
| `/api/openai/generate-email-section` | `POST` | Regenerates a single email section with granular context. |

All OpenAI routes run in **Edge Runtime** and require Azure env vars (`AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, deployment names).

---

## 4. Pricing of AI Models (planned)
`ai_specific_pricing` objects follow this shape:
```ts
interface AISpecificPricing {
  has_token_based_pricing: boolean;
  input_token_price: number | null;   // USD per 1K tokens
  output_token_price: number | null;  // USD per 1K tokens
  models_pricing: Record<string, {
    input: number;  // USD / 1K tokens
    output: number; // USD / 1K tokens
  }> | null;
  has_inference_pricing: boolean;
  has_fine_tuning_pricing: boolean;
  has_training_pricing: boolean;
  ai_addon_available: boolean;
}
```

Future enrichment scripts will inject pricing for GPT-4o, GPT-4 Turbo, Claude 3, etc.

---

### Notes
* All endpoints return `application/json` with `nosniff`, `SAMEORIGIN` security headers.
* Large fields (`embedding`) are omitted unless `?includeEmbedding=true` is supplied.
* Errors follow `{ error: string, detail?: string }` pattern with appropriate HTTP codes. 