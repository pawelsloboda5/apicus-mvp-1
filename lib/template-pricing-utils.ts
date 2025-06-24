import { AppPricingData, Scenario, TemplateResponse, AutomationTemplate } from '@/lib/types';
import { db } from '@/lib/db';

/**
 * Calculate total app costs for a template based on its appPricingMap and usage patterns
 */
export function calculateTemplateTotalCost(
  appPricingMap: Record<string, AppPricingData>,
  runsPerMonth: number = 250
): {
  totalMonthlyCost: number;
  appCosts: Array<{
    appId: string;
    appName: string;
    monthlyCost: number;
    hasFreeTier: boolean;
    currency: string;
  }>;
  freeAppsCount: number;
  paidAppsCount: number;
} {
  const appCosts: Array<{
    appId: string;
    appName: string;
    monthlyCost: number;
    hasFreeTier: boolean;
    currency: string;
  }> = [];
  
  let totalMonthlyCost = 0;
  let freeAppsCount = 0;
  let paidAppsCount = 0;

  Object.entries(appPricingMap).forEach(([, pricing]) => {
    const monthlyCost = pricing.hasFreeTier && runsPerMonth <= 1000 
      ? 0 // Assume free tier covers up to 1000 operations
      : pricing.lowestMonthlyPrice;
    
    appCosts.push({
      appId: pricing.appId,
      appName: pricing.appName,
      monthlyCost,
      hasFreeTier: pricing.hasFreeTier,
      currency: pricing.currency,
    });

    totalMonthlyCost += monthlyCost;
    
    if (monthlyCost === 0) {
      freeAppsCount++;
    } else {
      paidAppsCount++;
    }
  });

  return {
    totalMonthlyCost,
    appCosts,
    freeAppsCount,
    paidAppsCount,
  };
}

/**
 * Cache template pricing data in a scenario
 */
export async function cacheTemplatePricingInScenario(
  scenarioId: number,
  templateId: string
): Promise<void> {
  try {
    // Fetch pricing data from API
    const response = await fetch(`/api/templates/${templateId}/pricing`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch pricing data for template ${templateId}`);
      return;
    }

    const pricingData = await response.json();
    
    // Update scenario with pricing data
    await db.scenarios.update(scenarioId, {
      templatePricingData: pricingData.appPricingMap,
      updatedAt: Date.now(),
    });
    
  } catch (error) {
    console.error('Error caching template pricing data:', error);
  }
}

/**
 * Get cached pricing data from a scenario or fetch it if not available
 */
export async function getScenarioTemplatePricing(
  scenario: Scenario
): Promise<Record<string, AppPricingData> | null> {
  // Return cached data if available
  if (scenario.templatePricingData && Object.keys(scenario.templatePricingData).length > 0) {
    return scenario.templatePricingData as Record<string, AppPricingData>;
  }

  // If no cached data and we have a template ID, try to fetch and cache it
  if (scenario.originalTemplateId && scenario.id) {
    await cacheTemplatePricingInScenario(scenario.id, scenario.originalTemplateId);
    
    // Fetch updated scenario to get the cached data
    const updatedScenario = await db.scenarios.get(scenario.id);
    return updatedScenario?.templatePricingData as Record<string, AppPricingData> || null;
  }

  return null;
}

/**
 * Extract app pricing information from template nodes
 */
export function extractAppPricingFromTemplate(
  template: TemplateResponse | AutomationTemplate
): {
  appIds: string[];
  appNames: string[];
  pricingData: Record<string, AppPricingData>;
} {
  const appIds = template.appIds || [];
  const appNames = template.appNames || [];
  const pricingData = template.appPricingMap || {};

  return {
    appIds,
    appNames,
    pricingData,
  };
}

/**
 * Compare pricing across different apps in a template
 */
export function compareAppPricing(
  appPricingMap: Record<string, AppPricingData>
): {
  cheapestApp: AppPricingData | null;
  mostExpensiveApp: AppPricingData | null;
  freeApps: AppPricingData[];
  aiEnabledApps: AppPricingData[];
  averagePrice: number;
} {
  const apps = Object.values(appPricingMap);
  
  if (apps.length === 0) {
    return {
      cheapestApp: null,
      mostExpensiveApp: null,
      freeApps: [],
      aiEnabledApps: [],
      averagePrice: 0,
    };
  }

  const cheapestApp = apps.reduce((cheapest, app) => 
    app.lowestMonthlyPrice < cheapest.lowestMonthlyPrice ? app : cheapest
  );

  const mostExpensiveApp = apps.reduce((expensive, app) => 
    app.highestMonthlyPrice > expensive.highestMonthlyPrice ? app : expensive
  );

  const freeApps = apps.filter(app => app.hasFreeTier);
  const aiEnabledApps = apps.filter(app => app.hasAIFeatures);
  
  const averagePrice = apps.reduce((sum, app) => sum + app.lowestMonthlyPrice, 0) / apps.length;

  return {
    cheapestApp,
    mostExpensiveApp,
    freeApps,
    aiEnabledApps,
    averagePrice,
  };
}

/**
 * Generate pricing insights for a template
 */
export function generateTemplatePricingInsights(
  appPricingMap: Record<string, AppPricingData>,
  runsPerMonth: number = 250
): {
  insights: string[];
  costBreakdown: ReturnType<typeof calculateTemplateTotalCost>;
  comparison: ReturnType<typeof compareAppPricing>;
} {
  const costBreakdown = calculateTemplateTotalCost(appPricingMap, runsPerMonth);
  const comparison = compareAppPricing(appPricingMap);
  
  const insights: string[] = [];

  // Free tier insights
  if (costBreakdown.freeAppsCount > 0) {
    insights.push(`${costBreakdown.freeAppsCount} out of ${Object.keys(appPricingMap).length} apps offer free tiers`);
  }

  // Cost insights
  if (costBreakdown.totalMonthlyCost === 0) {
    insights.push('This workflow can run entirely on free tiers');
  } else if (costBreakdown.totalMonthlyCost < 50) {
    insights.push('Very cost-effective workflow with minimal monthly fees');
  } else if (costBreakdown.totalMonthlyCost > 200) {
    insights.push('Higher cost workflow - consider optimizing app usage');
  }

  // AI features
  if (comparison.aiEnabledApps.length > 0) {
    insights.push(`${comparison.aiEnabledApps.length} apps include AI features`);
  }

  // Usage-based pricing
  const usageBasedApps = Object.values(appPricingMap).filter(app => app.hasUsageBasedPricing);
  if (usageBasedApps.length > 0) {
    insights.push(`${usageBasedApps.length} apps use usage-based pricing - costs may scale with volume`);
  }

  return {
    insights,
    costBreakdown,
    comparison,
  };
} 