import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { createHash } from 'node:crypto';
import { 
  GenerateROIFieldsRequest, 
  GenerateROIFieldsResponse, 
  PositiveFactor, 
  NegativeFactor,
  ErrorResponse 
} from './types';
import { getDefaultFactors } from './defaults';

// Use Node.js runtime instead of Edge for better module resolution
// export const runtime = "edge";

export const runtime = "nodejs";

// Azure OpenAI configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const chatDeploymentName = process.env.AZURE_4_1_DEPLOYMENT || "gpt-4.1";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";

if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
  console.error("Missing Azure OpenAI environment variables for generate-roi-fields:", {
    hasApiKey: !!AZURE_OPENAI_API_KEY,
    hasEndpoint: !!azureEndpoint,
    hasDeployment: !!chatDeploymentName
  });
}

const openai = new OpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  baseURL: `${azureEndpoint}/openai/deployments/${chatDeploymentName}`,
  defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
  defaultQuery: { "api-version": apiVersion },
});

// Simple in-memory cache for development
const factorCache = new Map<string, { data: GenerateROIFieldsResponse['data']; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Clear cache on restart to ensure fresh calculations
factorCache.clear();

function generateCacheKey(request: GenerateROIFieldsRequest): string {
  const key = {
    taskType: request.taskType,
    platform: request.platform,
    apps: request.workflowSteps.map(s => s.appId).sort().join(','),
    industry: request.industry,
    companySize: request.companySize,
    maturity: request.automationMaturity
  };
  
  // Use Node.js crypto for hashing
  return createHash('md5').update(JSON.stringify(key)).digest('hex');
}

function buildSystemPrompt(request: GenerateROIFieldsRequest): string {
  const { taskType, industry, companySize, automationMaturity, options, currentNetROI, runsPerMonth, minutesPerRun, hourlyRate } = request;
  
  // Calculate base values for context
  const monthlyTimeValue = (runsPerMonth * minutesPerRun * hourlyRate) / 60;
  
  return `You are an expert ROI analyst specializing in ${taskType} automation.

Your role:
1. Generate specific, measurable ROI factors based on the workflow context
2. Use industry benchmarks for ${industry || 'general'} sector
3. Consider ${companySize || 'medium'} company dynamics
4. Account for ${automationMaturity || 'intermediate'} automation maturity level
5. Provide realistic, achievable default values

Task Type: ${taskType}
Industry Context: ${industry || 'General Business'}
Company Size: ${companySize || 'medium'} 
Maturity Level: ${automationMaturity || 'intermediate'}

CRITICAL CONTEXT FOR IMPACT CALCULATIONS:
- Current monthly time value: $${Math.round(monthlyTimeValue)}
- Current net ROI: $${Math.round(currentNetROI || 0)}/month
- Runs per month: ${runsPerMonth}
- Minutes saved per run: ${minutesPerRun}
- Hourly rate: $${hourlyRate}

IMPACT CALCULATION RULES:
1. Total positive factor impacts should be 10-50% of current monthly time value
2. Each positive factor impact should be between $${Math.round(monthlyTimeValue * 0.02)} and $${Math.round(monthlyTimeValue * 0.15)}
3. Total negative factor impacts should be 5-25% of positive impacts
4. Each negative factor impact should be between $${Math.round(monthlyTimeValue * 0.01)} and $${Math.round(monthlyTimeValue * 0.08)}
5. Be realistic - factors should enhance ROI, not multiply it by unrealistic amounts

Guidelines:
- Be specific to the apps and actions in the workflow
- Use ${options?.confidenceLevel || 'moderate'} confidence estimates
- Include clear reasoning for each factor
- Base impacts on the scale of ${request.runsPerMonth} runs per month
- Each positive factor should add incremental value through optimization
- Each negative factor should represent real but manageable costs

Output exactly 6 positive and 4 negative factors in the specified JSON format.`;
}

function buildUserPrompt(request: GenerateROIFieldsRequest): string {
  const { 
    taskType, 
    automationName, 
    platform, 
    runsPerMonth, 
    minutesPerRun, 
    hourlyRate, 
    currentNetROI, 
    workflowSteps,
    industry,
    companySize
  } = request;

  return `Analyze this ${taskType} automation workflow:

Automation: "${automationName}"
Platform: ${platform}
Current Performance:
- Runs: ${runsPerMonth}/month
- Time Saved: ${minutesPerRun} min/run
- Hourly Rate: $${hourlyRate}
- Current ROI: $${currentNetROI || 0}/month

Workflow Steps:
${workflowSteps.map(s => `${s.index + 1}. ${s.appName}: ${s.action} (${s.typeOf})`).join('\n')}

Generate ROI factors that:
1. Are specific to these apps and actions
2. Reflect realistic improvements and costs
3. Can be measured and tracked
4. Account for ${industry || 'general'} industry standards
5. Consider ${companySize || 'medium'} company scale

For each factor, provide:
- A clear, specific label
- A description explaining the impact
- defaultValue: Initial percentage value (10-30 for most factors)
- suggestedValue: Optimized percentage value (15-40 for most factors)
- minValue: 0
- maxValue: 50 to 100 (keep reasonable)
- estimatedMonthlyImpact: ACTUAL DOLLAR IMPACT per month (e.g., 150 for $150/month)
  - Positive factors: Between $${Math.round((request.runsPerMonth * request.minutesPerRun * request.hourlyRate) / 60 * 0.02)} and $${Math.round((request.runsPerMonth * request.minutesPerRun * request.hourlyRate) / 60 * 0.15)}
  - Negative factors: Between -$${Math.round((request.runsPerMonth * request.minutesPerRun * request.hourlyRate) / 60 * 0.01)} and -$${Math.round((request.runsPerMonth * request.minutesPerRun * request.hourlyRate) / 60 * 0.08)}
- confidence: 60-90
- unit: "percentage" for most factors

IMPORTANT: estimatedMonthlyImpact must be a realistic dollar amount, not a percentage!

Format the response as a JSON object with 'positiveFactors' and 'negativeFactors' arrays.`;
}

async function generateFactorsWithAI(request: GenerateROIFieldsRequest): Promise<{
  positiveFactors: PositiveFactor[];
  negativeFactors: NegativeFactor[];
  tokensUsed: number;
}> {
  const systemPrompt = buildSystemPrompt(request);
  const userPrompt = buildUserPrompt(request);
  
  const completion = await openai.chat.completions.create({
    model: chatDeploymentName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const response = completion.choices[0]?.message?.content;
  const tokensUsed = completion.usage?.total_tokens || 0;
  
  if (!response) {
    throw new Error('No response from OpenAI');
  }
  
  try {
    const parsed = JSON.parse(response);
    
    console.log('AI Response:', JSON.stringify(parsed, null, 2));
    
    // Validate that the AI provided reasonable values
    const hasValidFactors = parsed.positiveFactors && 
      parsed.positiveFactors.length > 0 && 
      parsed.positiveFactors.some((f: { estimatedMonthlyImpact?: number }) => 
        typeof f.estimatedMonthlyImpact === 'number' && 
        Math.abs(f.estimatedMonthlyImpact) > 0 && 
        Math.abs(f.estimatedMonthlyImpact) < 10000
      );
    
    if (!hasValidFactors) {
      console.warn('AI returned invalid factors, falling back to defaults');
      return getDefaultFactors(request.taskType, request.runsPerMonth, request.hourlyRate);
    }
    
    // Validate and transform the response
    const positiveFactors = (parsed.positiveFactors || []).slice(0, 6).map((f: Partial<PositiveFactor>, i: number) => ({
      id: `pf_${f.id || `factor_${i}`}`,
      category: f.category || 'time',
      label: f.label || `Positive Factor ${i + 1}`,
      description: f.description || '',
      unit: f.unit || 'percentage',
      defaultValue: Math.min(f.defaultValue || 10, 50), // Cap at 50% max
      suggestedValue: Math.min(f.suggestedValue || 15, 50), // Cap at 50% max  
      minValue: f.minValue || 0,
      maxValue: Math.min(f.maxValue || 100, 100), // Cap at 100% max
      step: f.step || 1,
      impactType: 'additive' as const, // Force additive to prevent multiplication explosion
      baseMetric: f.baseMetric || 'time',
      impactFormula: f.impactFormula || 'baseValue × (1 + value/100)',
      estimatedMonthlyImpact: Math.min(Math.abs(f.estimatedMonthlyImpact || 100), 1000), // Cap impact at $1000/mo
      confidence: f.confidence || 70,
      source: 'ai' as const,
      reasoning: f.reasoning || '',
      industryBenchmark: f.industryBenchmark,
      icon: f.icon || 'TrendingUp',
      color: f.color || 'green',
      priority: f.priority || 'medium',
      helpText: f.helpText || f.description,
    })) as PositiveFactor[];
    
    const negativeFactors = (parsed.negativeFactors || []).slice(0, 4).map((f: Partial<NegativeFactor>, i: number) => ({
      id: `nf_${f.id || `factor_${i}`}`,
      category: f.category || 'cost',
      label: f.label || `Negative Factor ${i + 1}`,
      description: f.description || '',
      unit: f.unit || 'currency',
      defaultValue: f.defaultValue || 50,
      suggestedValue: f.suggestedValue || 50,
      minValue: f.minValue || 0,
      maxValue: f.maxValue || 1000,
      step: f.step || 10,
      impactType: f.impactType || 'additive',
      baseMetric: f.baseMetric || 'cost',
      impactFormula: f.impactFormula || 'baseCost + value',
      estimatedMonthlyImpact: -Math.min(Math.abs(f.estimatedMonthlyImpact || 50), 500), // Cap negative impact at $500/mo
      confidence: f.confidence || 70,
      source: 'ai' as const,
      reasoning: f.reasoning || '',
      mitigationStrategy: f.mitigationStrategy || '',
      icon: f.icon || 'AlertTriangle',
      severity: f.severity || 'minor',
      canBeEliminated: f.canBeEliminated || false,
      alternativeSolutions: f.alternativeSolutions || [],
    })) as NegativeFactor[];
    
    return { positiveFactors, negativeFactors, tokensUsed };
    
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    // Fall back to defaults if AI response is malformed
    return getDefaultFactors(request.taskType, request.runsPerMonth, request.hourlyRate);
  }
}

export async function POST(req: Request) {
  if (!AZURE_OPENAI_API_KEY || !azureEndpoint) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'Azure OpenAI environment variables missing'
      },
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }

  try {
    const request = await req.json() as GenerateROIFieldsRequest;
    
    // Validate required fields
    if (!request.taskType || !request.automationName || !request.platform) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: taskType, automationName, or platform'
        },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Check cache first (unless fresh=true in query)
    const url = new URL(req.url);
    const forceFresh = url.searchParams.get('fresh') === 'true';
    const cacheKey = generateCacheKey(request);
    
    if (!forceFresh) {
      const cached = factorCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const response: GenerateROIFieldsResponse = {
          success: true,
          data: cached.data,
          cached: true,
          generatedAt: new Date(cached.timestamp).toISOString()
        };
        return NextResponse.json(response);
      }
    }
    
    // Generate factors with AI
    const startTime = Date.now();
    const { positiveFactors, negativeFactors, tokensUsed } = await generateFactorsWithAI(request);
    const generationTime = Date.now() - startTime;
    
    // Calculate overall confidence based on data quality
    const dataPoints = [
      request.industry ? 10 : 0,
      request.companySize ? 10 : 0,
      request.automationMaturity ? 10 : 0,
      request.workflowSteps.length > 3 ? 20 : 10,
      request.currentNetROI ? 20 : 0,
      30, // Base confidence
    ];
    const confidenceScore = Math.min(dataPoints.reduce((a, b) => a + b, 0), 95);
    
    // Prepare metadata
    const metadata = {
      model: chatDeploymentName,
      temperature: 0.7,
      tokensUsed,
      generationTime,
      confidenceScore,
      dataSources: [
        `Industry benchmarks for ${request.industry || 'general'}`,
        `${request.platform} platform patterns`,
        `${request.companySize || 'medium'} company metrics`,
        'Task-specific ROI factors database'
      ],
      warnings: [] as string[],
      suggestions: [] as string[]
    };
    
    // Add warnings if needed
    if (!request.industry) {
      metadata.warnings.push('No industry specified - using general benchmarks');
    }
    if (request.runsPerMonth < 10) {
      metadata.warnings.push('Low run volume may not justify automation costs');
    }
    
    // Add suggestions
    if (positiveFactors.some(f => f.category === 'revenue')) {
      metadata.suggestions.push('Track actual conversion improvements after implementation');
    }
    if (request.taskType === 'compliance') {
      metadata.suggestions.push('Document error reduction metrics for audit purposes');
    }
    
    // Cache the result
    const responseData = { positiveFactors, negativeFactors, metadata };
    factorCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    for (const [key, value] of factorCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL * 2) {
        factorCache.delete(key);
      }
    }
    
    const response: GenerateROIFieldsResponse = {
      success: true,
      data: responseData,
      cached: false,
      generatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(response);
    
  } catch (error: unknown) {
    console.error('/api/openai/generate-roi-fields error:', error);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to generate ROI factors',
        details: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'generate-roi-fields',
    timestamp: new Date().toISOString(),
    cache: {
      entries: factorCache.size,
      ttl: CACHE_TTL
    }
  });
}
