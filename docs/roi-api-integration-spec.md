# ROI API Integration Specification

**Version:** 1.0.0  
**Date:** January 2025  
**API Endpoint:** `/api/openai/generate-roi-fields`

## 🎯 API Overview

This specification defines the OpenAI-powered API for generating intelligent, task-specific ROI factors based on automation context.

## 🔐 Authentication & Configuration

### Environment Variables
```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com
AZURE_4_1_DEPLOYMENT=gpt-4.1
AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Rate Limiting
ROI_FIELDS_RATE_LIMIT=10 # requests per minute
ROI_FIELDS_CACHE_TTL=3600 # seconds
```

### Headers
```typescript
{
  'Content-Type': 'application/json',
  'X-Session-ID': string, // For rate limiting
  'X-Scenario-ID': string // For caching
}
```

## 📥 Request Specification

### Endpoint
```
POST /api/openai/generate-roi-fields
```

### Request Body Schema
```typescript
interface GenerateROIFieldsRequest {
  // Required Context
  taskType: 'general' | 'admin' | 'customer_support' | 'sales' | 
           'marketing' | 'compliance' | 'operations' | 'finance' | 'lead_gen';
  automationName: string;
  platform: 'zapier' | 'make' | 'n8n';
  
  // Current Metrics
  runsPerMonth: number;
  minutesPerRun: number;
  hourlyRate: number;
  taskMultiplier: number;
  currentNetROI?: number;
  
  // Workflow Analysis
  workflowSteps: Array<{
    appId: string;
    appName: string;
    action: string;
    typeOf: string;
    logoUrl?: string;
    index: number;
  }>;
  
  // Optional Context
  industry?: string;
  companySize?: 'small' | 'medium' | 'large' | 'enterprise';
  automationMaturity?: 'beginner' | 'intermediate' | 'advanced';
  
  // Generation Options
  options?: {
    useIndustryBenchmarks?: boolean;
    includeAdvancedFactors?: boolean;
    confidenceLevel?: 'conservative' | 'moderate' | 'aggressive';
    locale?: string; // For currency/unit formatting
  };
}
```

### Example Request
```json
{
  "taskType": "sales",
  "automationName": "Lead Qualification Pipeline",
  "platform": "zapier",
  "runsPerMonth": 500,
  "minutesPerRun": 5,
  "hourlyRate": 45,
  "taskMultiplier": 1.5,
  "currentNetROI": 3500,
  "workflowSteps": [
    {
      "appId": "hubspot",
      "appName": "HubSpot",
      "action": "Create Contact",
      "typeOf": "create",
      "index": 0
    },
    {
      "appId": "clearbit",
      "appName": "Clearbit",
      "action": "Enrich Person",
      "typeOf": "enrich",
      "index": 1
    },
    {
      "appId": "slack",
      "appName": "Slack",
      "action": "Send Message",
      "typeOf": "notify",
      "index": 2
    }
  ],
  "industry": "SaaS",
  "companySize": "medium",
  "automationMaturity": "intermediate",
  "options": {
    "useIndustryBenchmarks": true,
    "confidenceLevel": "moderate"
  }
}
```

## 📤 Response Specification

### Success Response Schema
```typescript
interface GenerateROIFieldsResponse {
  success: boolean;
  data: {
    positiveFactors: PositiveFactor[];
    negativeFactors: NegativeFactor[];
    metadata: GenerationMetadata;
  };
  cached?: boolean;
  generatedAt: string;
}

interface PositiveFactor {
  id: string; // Unique identifier
  category: 'time' | 'revenue' | 'quality' | 'scale';
  label: string;
  description: string;
  unit: 'percentage' | 'currency' | 'number' | 'hours' | 'score';
  
  // Values
  defaultValue: number;
  suggestedValue: number; // AI-optimized suggestion
  minValue: number;
  maxValue: number;
  step: number; // For slider increment
  
  // Impact Calculation
  impactType: 'multiplicative' | 'additive' | 'compound';
  baseMetric: 'time' | 'revenue' | 'risk';
  impactFormula: string; // Human-readable formula
  estimatedMonthlyImpact: number; // In dollars
  
  // Metadata
  confidence: number; // 0-100
  source: 'ai' | 'benchmark' | 'historical' | 'default';
  reasoning?: string; // Why this factor was chosen
  industryBenchmark?: number;
  
  // UI Hints
  icon?: string; // Icon name for UI
  color?: string; // Suggested color
  priority: 'high' | 'medium' | 'low';
  helpText?: string; // Extended tooltip
}

interface NegativeFactor {
  id: string;
  category: 'cost' | 'risk' | 'maintenance' | 'overhead';
  label: string;
  description: string;
  unit: 'percentage' | 'currency' | 'number' | 'hours';
  
  // Values
  defaultValue: number;
  suggestedValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  
  // Impact Calculation
  impactType: 'additive' | 'multiplicative' | 'recurring';
  baseMetric: 'cost' | 'time' | 'revenue';
  impactFormula: string;
  estimatedMonthlyImpact: number; // Negative value
  
  // Metadata
  confidence: number;
  source: 'ai' | 'benchmark' | 'historical' | 'default';
  reasoning?: string;
  mitigationStrategy?: string; // How to minimize this factor
  
  // UI Hints
  icon?: string;
  severity: 'critical' | 'major' | 'minor';
  canBeEliminated?: boolean;
  alternativeSolutions?: string[];
}

interface GenerationMetadata {
  model: string;
  temperature: number;
  tokensUsed: number;
  generationTime: number; // milliseconds
  confidenceScore: number; // Overall confidence 0-100
  dataSources: string[]; // What informed the generation
  warnings?: string[]; // Any caveats or limitations
  suggestions?: string[]; // Additional optimization ideas
}
```

### Example Success Response
```json
{
  "success": true,
  "data": {
    "positiveFactors": [
      {
        "id": "pf_deal_velocity",
        "category": "revenue",
        "label": "Deal Velocity Increase",
        "description": "Percentage faster deal closure due to automated follow-ups and lead scoring",
        "unit": "percentage",
        "defaultValue": 25,
        "suggestedValue": 32,
        "minValue": 0,
        "maxValue": 50,
        "step": 1,
        "impactType": "multiplicative",
        "baseMetric": "revenue",
        "impactFormula": "baseRevenue × (1 + value/100)",
        "estimatedMonthlyImpact": 4800,
        "confidence": 85,
        "source": "ai",
        "reasoning": "HubSpot + Clearbit combination typically accelerates B2B sales cycles by 25-35%",
        "industryBenchmark": 28,
        "icon": "TrendingUp",
        "color": "green",
        "priority": "high",
        "helpText": "Measures how much faster deals move through your pipeline with automation"
      },
      {
        "id": "pf_lead_quality",
        "category": "revenue",
        "label": "Lead Quality Score",
        "description": "Improvement in lead quality through Clearbit enrichment",
        "unit": "score",
        "defaultValue": 7,
        "suggestedValue": 8,
        "minValue": 1,
        "maxValue": 10,
        "step": 0.5,
        "impactType": "additive",
        "baseMetric": "revenue",
        "impactFormula": "value × $1000 per point",
        "estimatedMonthlyImpact": 8000,
        "confidence": 90,
        "source": "benchmark",
        "reasoning": "Clearbit data enrichment typically improves lead scoring accuracy by 30-40%",
        "industryBenchmark": 7.5,
        "icon": "Target",
        "color": "blue",
        "priority": "high",
        "helpText": "Higher quality leads convert at better rates and have higher lifetime value"
      }
    ],
    "negativeFactors": [
      {
        "id": "nf_crm_costs",
        "category": "cost",
        "label": "CRM & Tool Costs",
        "description": "Monthly subscription for HubSpot and Clearbit",
        "unit": "currency",
        "defaultValue": 450,
        "suggestedValue": 450,
        "minValue": 200,
        "maxValue": 2000,
        "step": 50,
        "impactType": "additive",
        "baseMetric": "cost",
        "impactFormula": "directCost + value",
        "estimatedMonthlyImpact": -450,
        "confidence": 95,
        "source": "benchmark",
        "reasoning": "HubSpot Professional (~$450/mo) + Clearbit Enrichment (~$100/mo)",
        "mitigationStrategy": "Consider annual billing for 20% discount",
        "icon": "DollarSign",
        "severity": "major",
        "canBeEliminated": false,
        "alternativeSolutions": ["Use free tier with limitations", "Try alternative tools"]
      },
      {
        "id": "nf_training_time",
        "category": "overhead",
        "label": "Sales Team Training",
        "description": "Hours needed to train team on new automation",
        "unit": "hours",
        "defaultValue": 8,
        "suggestedValue": 6,
        "minValue": 0,
        "maxValue": 30,
        "step": 1,
        "impactType": "additive",
        "baseMetric": "cost",
        "impactFormula": "value × hourlyRate × 1.5",
        "estimatedMonthlyImpact": -540,
        "confidence": 75,
        "source": "ai",
        "reasoning": "Medium complexity workflow requires 6-10 hours initial training",
        "mitigationStrategy": "Create video tutorials and documentation",
        "icon": "GraduationCap",
        "severity": "minor",
        "canBeEliminated": false,
        "alternativeSolutions": ["Phased rollout", "Train champions first"]
      }
    ],
    "metadata": {
      "model": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "tokensUsed": 2456,
      "generationTime": 3200,
      "confidenceScore": 82,
      "dataSources": [
        "Industry benchmarks for SaaS",
        "HubSpot + Clearbit integration patterns",
        "Medium company automation metrics"
      ],
      "warnings": [
        "CRM costs may vary based on number of contacts",
        "Training time assumes moderate technical proficiency"
      ],
      "suggestions": [
        "Consider adding lead routing automation for additional 15% efficiency",
        "Implement progressive profiling to improve data quality over time"
      ]
    }
  },
  "cached": false,
  "generatedAt": "2025-01-07T10:30:00Z"
}
```

### Error Response Schema
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 502 | OpenAI service unavailable |
| `GENERATION_FAILED` | 500 | Failed to generate factors |
| `UNAUTHORIZED` | 401 | Invalid API key |
| `INSUFFICIENT_CONTEXT` | 422 | Not enough data to generate |

## 🧠 AI Prompt Engineering

### System Prompt Template
```typescript
const systemPrompt = `You are an expert ROI analyst specializing in ${taskType} automation.

Your role:
1. Generate specific, measurable ROI factors based on the workflow context
2. Use industry benchmarks for ${industry || 'general'} sector
3. Consider ${companySize} company dynamics
4. Account for ${automationMaturity} automation maturity level
5. Provide realistic, achievable default values

Guidelines:
- Be specific to the apps and actions in the workflow
- Use conservative estimates for ${options.confidenceLevel} confidence
- Include clear reasoning for each factor
- Suggest values that improve on current ROI of $${currentNetROI}/month
- Consider the scale of ${runsPerMonth} runs per month

Output exactly 6 positive and 4 negative factors in the specified JSON format.`;
```

### User Prompt Template
```typescript
const userPrompt = `Analyze this ${taskType} automation workflow:

Automation: "${automationName}"
Platform: ${platform}
Current Performance:
- Runs: ${runsPerMonth}/month
- Time Saved: ${minutesPerRun} min/run
- Hourly Rate: $${hourlyRate}
- Current ROI: $${currentNetROI}/month

Workflow Steps:
${workflowSteps.map(s => `${s.index + 1}. ${s.appName}: ${s.action} (${s.typeOf})`).join('\n')}

Generate ROI factors that:
1. Are specific to these apps and actions
2. Reflect realistic improvements and costs
3. Can be measured and tracked
4. Account for ${industry} industry standards
5. Consider ${companySize} company scale

Provide default values based on typical performance for this type of automation.`;
```

## 🔄 Caching Strategy

### Cache Key Generation
```typescript
function generateCacheKey(request: GenerateROIFieldsRequest): string {
  const key = {
    taskType: request.taskType,
    platform: request.platform,
    apps: request.workflowSteps.map(s => s.appId).sort().join(','),
    industry: request.industry,
    companySize: request.companySize,
    maturity: request.automationMaturity
  };
  return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex');
}
```

### Cache Rules
- TTL: 1 hour for identical configurations
- Invalidation: On significant metric changes (>20%)
- Storage: Redis or in-memory cache
- Bypass: Add `?fresh=true` to force regeneration

## 🚦 Rate Limiting

### Limits
- **Per Session:** 10 requests per minute
- **Per Scenario:** 5 regenerations per hour
- **Global:** 1000 requests per hour

### Rate Limit Response Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704628800
```

## 🧪 Testing Endpoints

### Health Check
```
GET /api/openai/generate-roi-fields/health
```

### Test Generation (Development Only)
```
POST /api/openai/generate-roi-fields/test
```
Returns mock data for UI development without consuming API credits.

## 📊 Monitoring & Analytics

### Metrics to Track
- Generation success rate
- Average generation time
- Token usage per request
- Cache hit rate
- Most common task types
- Factor acceptance rate (user keeps vs modifies)

### Logging
```typescript
logger.info('ROI_FIELDS_GENERATED', {
  scenarioId,
  taskType,
  platform,
  tokensUsed,
  generationTime,
  cacheHit,
  factorCount: {
    positive: positiveFactors.length,
    negative: negativeFactors.length
  },
  totalImpact: estimatedTotalImpact
});
```

## 🔒 Security Considerations

### Input Validation
- Sanitize automation names (max 100 chars)
- Validate numeric ranges
- Escape special characters
- Limit workflow steps to 20

### Output Sanitization
- Remove any PII from responses
- Validate formula strings
- Ensure numeric values are within bounds
- Strip unnecessary metadata in production

## 📚 Implementation Notes

### Dependencies
```json
{
  "@azure/openai": "^1.0.0",
  "zod": "^3.22.0",
  "redis": "^4.6.0",
  "rate-limiter-flexible": "^3.0.0"
}
```

### Environment-Specific Behavior
- **Development:** Relaxed rate limits, verbose logging
- **Staging:** Full functionality, test API keys
- **Production:** Strict limits, optimized caching

## 🎯 Performance Targets

- Response time: < 4 seconds (p95)
- Cache hit rate: > 60%
- Generation success: > 95%
- Token efficiency: < 3000 per request
