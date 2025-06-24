import { ImportedWorkflow } from '@/lib/import/types';
import { Node } from '@xyflow/react';
import clientPromise from '@/lib/mongo';
import { Db } from 'mongodb';

/**
 * Convert app name to slug format for MongoDB lookup
 * Examples:
 * - "Google Sheets" -> "google-sheets"
 * - "Claude AI" -> "claude-ai"
 * - "HTTP" -> "http"
 */
function appNameToSlug(appName: string): string {
  return appName
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric characters except dashes
}

// Interfaces for MongoDB pricing document structure
interface PricingTier {
  tier_name: string;
  tier_description?: string;
  monthly_price: number | null;
  annual_price: number | null;
  annual_discount_percentage?: number | null;
  setup_fee?: number | null;
  features: string[];
  limits?: {
    users?: string;
    storage?: string;
    operations?: string;
    api_calls?: string | null;
    integrations?: string | number;
    custom_limits?: Record<string, unknown> | null;
  };
}

interface UsageBasedPricing {
  pricing_model: string;
  unit_of_measurement: string;
  price_per_unit: number;
  included_units?: number;
  overage_price?: number;
  billing_cycle?: string;
}

interface PromotionalOffer {
  offer_type: string;
  discount_percentage?: number;
  discount_amount?: number;
  valid_until?: string;
  conditions?: string[];
}

interface AdditionalFee {
  fee_type: string;
  amount: number;
  currency: string;
  description?: string;
  applies_to?: string[];
}

// Interface matching MongoDB document structure
interface AppPricingData {
  app_id: string;
  app_name: string;
  app_slug: string;
  pricing_url?: string;
  source_url?: string;
  price_model_type: string[];
  has_free_tier: boolean;
  has_free_trial: boolean;
  free_trial_period_days?: number;
  currency: string;
  is_pricing_public: boolean;
  pricing_page_accessible?: boolean;
  pricing_notes?: string;
  pricing_tiers?: PricingTier[];
  usage_based_pricing?: UsageBasedPricing[];
  ai_specific_pricing?: {
    has_token_based_pricing?: boolean;
    input_token_price?: number | null;
    output_token_price?: number | null;
    models_pricing?: Record<string, { input: number; output: number }> | null;
    has_inference_pricing?: boolean;
    has_fine_tuning_pricing?: boolean;
    has_training_pricing?: boolean;
    ai_addon_available?: boolean;
  };
  promotional_offers?: PromotionalOffer[];
  additional_fees?: AdditionalFee[];
  extraction_timestamp?: string;
  schema_validated?: boolean;
  confidence_score?: number;
  extraction_error?: boolean;
  json_repaired?: boolean;
  original_app_metadata?: {
    app_id?: string;
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    categories?: string[];
    category_slugs?: string[];
    has_actions?: boolean;
    has_triggers?: boolean;
    action_count?: number;
    trigger_count?: number;
  };
}

// Simplified interface for client-side usage
interface SimplifiedAppPricingData {
  appId: string;
  appName: string;
  appSlug: string;
  hasFreeTier: boolean;
  hasFreeTrial: boolean;
  currency: string;
  lowestMonthlyPrice: number | null;
  highestMonthlyPrice: number | null;
  tierCount: number;
  hasUsageBasedPricing: boolean;
  hasAIFeatures: boolean;
  priceModelType: string[];
  isPricingPublic: boolean;
  logoUrl?: string;
  description?: string;
  limits?: Record<string, unknown>;
  tiers?: Array<{
    name: string;
    monthlyPrice: number;
    annualPrice?: number;
    features: string[];
  }>;
}

// Interface for workflow nodes with proper typing
interface WorkflowNode extends Node {
  data: {
    appName?: string;
    [key: string]: unknown;
  };
}

/**
 * Enrich imported workflow with pricing data from MongoDB
 */
export async function enrichWithPricingData(
  workflow: ImportedWorkflow
): Promise<ImportedWorkflow> {
  try {
    // Extract unique app names and convert to slugs
    const appNamesSet = new Set<string>();
    const appSlugMap = new Map<string, string>(); // Map app name to slug
    
    workflow.nodes.forEach((node: WorkflowNode) => {
      if (node.data.appName && node.data.appName !== 'Unknown') {
        appNamesSet.add(node.data.appName);
        appSlugMap.set(node.data.appName, appNameToSlug(node.data.appName));
      }
    });
    
    if (appNamesSet.size === 0) {
      // No apps to enrich
      return workflow;
    }
    
    // Get all unique slugs
    const pricingSlugs = Array.from(new Set(appSlugMap.values()));
    
    console.log('Looking up pricing for slugs:', pricingSlugs);
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db: Db = client.db('apicus');
    const pricingCollection = db.collection<AppPricingData>('apicus-apps-prices');
    
    // Fetch pricing data for matching apps
    const pricingDocs = await pricingCollection
      .find({ app_slug: { $in: pricingSlugs } })
      .toArray();
    
    console.log(`Found ${pricingDocs.length} pricing documents out of ${pricingSlugs.length} apps`);
    
    if (pricingDocs.length === 0) {
      // No pricing data found
      return workflow;
    }
    
    // Create pricing map with simplified structure
    const appPricingMap: Record<string, SimplifiedAppPricingData> = {};
    
    pricingDocs.forEach(doc => {
      // Use the MongoDB _id as the app ID
      const appId = doc._id?.toString() || doc.app_id;
      
      // Calculate lowest and highest monthly prices from tiers
      let lowestMonthlyPrice: number | null = null;
      let highestMonthlyPrice: number | null = null;
      
      if (doc.pricing_tiers && doc.pricing_tiers.length > 0) {
        const monthlyPrices = doc.pricing_tiers
          .map(tier => tier.monthly_price)
          .filter(price => price !== null && price !== undefined) as number[];
        
        if (monthlyPrices.length > 0) {
          lowestMonthlyPrice = Math.min(...monthlyPrices);
          highestMonthlyPrice = Math.max(...monthlyPrices);
        }
      }
      
      appPricingMap[appId] = {
        appId: appId,
        appName: doc.app_name || doc.app_slug,
        appSlug: doc.app_slug,
        hasFreeTier: doc.has_free_tier || false,
        hasFreeTrial: doc.has_free_trial || false,
        currency: doc.currency || 'USD',
        lowestMonthlyPrice,
        highestMonthlyPrice,
        tierCount: doc.pricing_tiers?.length || 0,
        hasUsageBasedPricing: (doc.usage_based_pricing && doc.usage_based_pricing.length > 0) || false,
        hasAIFeatures: doc.ai_specific_pricing?.ai_addon_available || false,
        priceModelType: doc.price_model_type || [],
        isPricingPublic: doc.is_pricing_public !== false,
        logoUrl: doc.original_app_metadata?.logo_url,
        description: doc.original_app_metadata?.description,
        limits: doc.pricing_tiers?.[0]?.limits,
        tiers: doc.pricing_tiers?.map(tier => ({
          name: tier.tier_name,
          monthlyPrice: tier.monthly_price || 0,
          annualPrice: tier.annual_price || undefined,
          features: tier.features || []
        })),
      };
    });
    
    // Add pricing data to workflow metadata
    return {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        pricingData: appPricingMap,
        pricingEnrichedAt: new Date().toISOString(),
      },
    };
    
  } catch (error) {
    console.error('Error enriching pricing data:', error);
    // Return workflow without pricing data on error
    return workflow;
  }
}

/**
 * Calculate estimated monthly cost based on pricing data
 */
export function calculateEstimatedCost(
  workflow: ImportedWorkflow,
  runsPerMonth: number = 100
): {
  minCost: number;
  maxCost: number;
  breakdown: Array<{ app: string; minCost: number; maxCost: number }>;
} {
  const breakdown: Array<{ app: string; minCost: number; maxCost: number }> = [];
  let totalMinCost = 0;
  let totalMaxCost = 0;
  
  // Check if we have pricing data
  const pricingData = workflow.metadata.pricingData as Record<string, SimplifiedAppPricingData> | undefined;
  if (!pricingData) {
    return { minCost: 0, maxCost: 0, breakdown: [] };
  }
  
  // Count app usage in workflow
  const appUsage = new Map<string, number>();
  workflow.nodes.forEach((node: WorkflowNode) => {
    const appName = node.data.appName;
    if (appName && appName !== 'Unknown') {
      appUsage.set(appName, (appUsage.get(appName) || 0) + 1);
    }
  });
  
  // Calculate costs for each app
  Object.values(pricingData).forEach((pricing: SimplifiedAppPricingData) => {
    const appName = pricing.appName;
    const usage = appUsage.get(appName) || 0;
    
    if (usage === 0) return;
    
    // Simple cost estimation (this could be much more sophisticated)
    let minCost = 0;
    let maxCost = 0;
    
    if (pricing.hasFreeTier) {
      // Assume free tier might cover basic usage
      minCost = 0;
    } else if (pricing.lowestMonthlyPrice !== null) {
      minCost = pricing.lowestMonthlyPrice;
    }
    
    if (pricing.highestMonthlyPrice !== null) {
      maxCost = pricing.highestMonthlyPrice;
    } else if (pricing.lowestMonthlyPrice !== null) {
      // Estimate max as 5x the minimum if not specified
      maxCost = pricing.lowestMonthlyPrice * 5;
    }
    
    // Adjust for usage-based pricing
    if (pricing.hasUsageBasedPricing) {
      // Scale costs based on runs per month
      const scaleFactor = Math.min(runsPerMonth / 1000, 1); // Cap at 1000 runs
      minCost *= scaleFactor;
      maxCost *= scaleFactor;
    }
    
    breakdown.push({ app: appName, minCost, maxCost });
    totalMinCost += minCost;
    totalMaxCost += maxCost;
  });
  
  return {
    minCost: Math.round(totalMinCost * 100) / 100,
    maxCost: Math.round(totalMaxCost * 100) / 100,
    breakdown,
  };
} 