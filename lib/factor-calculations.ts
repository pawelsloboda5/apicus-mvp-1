/**
 * Factor impact calculation utilities
 * Processes task-specific factors and calculates their impact on ROI
 */

import type { 
  PositiveFactor, 
  NegativeFactor 
} from '@/app/api/openai/generate-roi-fields/types';

export interface FactorImpacts {
  positiveTimeImpact: number;
  positiveRevenueImpact: number;
  positiveQualityImpact: number;
  totalPositiveImpact: number;
  
  negativeCostImpact: number;
  negativeRiskImpact: number;
  negativeOverheadImpact: number;
  totalNegativeImpact: number;
  
  netFactorImpact: number;
  timeBoostMultiplier: number;
  revenueBoostMultiplier: number;
}

/**
 * Calculate the monetary impact of all factors
 * @param positiveFactors Array of positive factors with their current values
 * @param negativeFactors Array of negative factors with their current values
 * @param factorValues Current values for each factor (keyed by factor ID)
 */
export function calculateFactorImpacts(
  positiveFactors: PositiveFactor[],
  negativeFactors: NegativeFactor[],
  factorValues: Record<string, number>
): FactorImpacts {
  let positiveTimeImpact = 0;
  let positiveRevenueImpact = 0;
  let positiveQualityImpact = 0;
  let timeBoostMultiplier = 1;
  let revenueBoostMultiplier = 1;
  
  // Process positive factors
  positiveFactors.forEach(factor => {
    const currentValue = factorValues[factor.id] ?? factor.defaultValue;
    
    // Use the impact directly as a dollar value, not as a multiplier
    // The currentValue is just a scaling factor for the base impact
    const scaleFactor = Math.min(currentValue / Math.max(1, factor.suggestedValue), 2); // Cap at 2x suggested
    
    // Calculate impact as a dollar amount
    const impact = factor.estimatedMonthlyImpact * scaleFactor;
    
    // Apply impact based on category and type
    switch (factor.category) {
      case 'time':
        if (factor.impactType === 'multiplicative') {
          // Add to time multiplier (cap at reasonable values)
          const boost = Math.min(currentValue / 100, 0.5); // Cap at 50% boost per factor
          timeBoostMultiplier *= (1 + boost);
        } else {
          // Direct time impact
          positiveTimeImpact += impact;
        }
        break;
        
      case 'revenue':
        if (factor.impactType === 'multiplicative') {
          // Add to revenue multiplier (cap at reasonable values)
          const boost = Math.min(currentValue / 100, 0.5); // Cap at 50% boost per factor
          revenueBoostMultiplier *= (1 + boost);
        } else {
          // Direct revenue impact
          positiveRevenueImpact += impact;
        }
        break;
        
      case 'quality':
      case 'scale':
        // Quality improvements typically reduce risk/errors
        positiveQualityImpact += impact;
        break;
        
      default:
        // Generic positive impact
        positiveRevenueImpact += impact;
    }
  });
  
  let negativeCostImpact = 0;
  let negativeRiskImpact = 0;
  let negativeOverheadImpact = 0;
  
  // Process negative factors
  negativeFactors.forEach(factor => {
    const currentValue = factorValues[factor.id] ?? factor.defaultValue;
    
    // Use the impact directly as a dollar value
    const scaleFactor = Math.min(currentValue / Math.max(1, factor.suggestedValue), 2); // Cap at 2x suggested
    
    // Negative factors always subtract value (ensure positive for calculation)
    const impact = Math.abs(factor.estimatedMonthlyImpact) * scaleFactor;
    
    switch (factor.category) {
      case 'cost':
        negativeCostImpact += impact;
        break;
        
      case 'risk':
        negativeRiskImpact += impact;
        break;
        
      case 'maintenance':
      case 'overhead':
        negativeOverheadImpact += impact;
        break;
        
      default:
        // Generic negative impact
        negativeCostImpact += impact;
    }
  });
  
  // Calculate totals
  const totalPositiveImpact = positiveTimeImpact + positiveRevenueImpact + positiveQualityImpact;
  const totalNegativeImpact = negativeCostImpact + negativeRiskImpact + negativeOverheadImpact;
  const netFactorImpact = totalPositiveImpact - totalNegativeImpact;
  
  return {
    positiveTimeImpact,
    positiveRevenueImpact,
    positiveQualityImpact,
    totalPositiveImpact,
    
    negativeCostImpact,
    negativeRiskImpact,
    negativeOverheadImpact,
    totalNegativeImpact,
    
    netFactorImpact,
    timeBoostMultiplier,
    revenueBoostMultiplier,
  };
}

/**
 * Apply factor impacts to base ROI values
 * @param baseValues Base ROI calculation values
 * @param factorImpacts Calculated factor impacts
 * @returns Enhanced ROI values with factors applied
 */
export function applyFactorImpacts(
  baseValues: {
    timeValue: number;
    riskValue: number;
    revenueValue: number;
    platformCost: number;
    appCosts: number;
  },
  factorImpacts: FactorImpacts | null
): {
  enhancedTimeValue: number;
  enhancedRiskValue: number;
  enhancedRevenueValue: number;
  enhancedTotalValue: number;
  enhancedTotalCost: number;
  enhancedNetROI: number;
  factorBoost: number;
} {
  if (!factorImpacts) {
    // No factors, return base values
    return {
      enhancedTimeValue: baseValues.timeValue,
      enhancedRiskValue: baseValues.riskValue,
      enhancedRevenueValue: baseValues.revenueValue,
      enhancedTotalValue: baseValues.timeValue + baseValues.riskValue + baseValues.revenueValue,
      enhancedTotalCost: baseValues.platformCost + baseValues.appCosts,
      enhancedNetROI: (baseValues.timeValue + baseValues.riskValue + baseValues.revenueValue) - (baseValues.platformCost + baseValues.appCosts),
      factorBoost: 0,
    };
  }
  
  // Apply multipliers and add direct impacts
  const enhancedTimeValue = (baseValues.timeValue * factorImpacts.timeBoostMultiplier) + factorImpacts.positiveTimeImpact;
  const enhancedRiskValue = baseValues.riskValue + factorImpacts.positiveQualityImpact; // Quality reduces risk
  const enhancedRevenueValue = (baseValues.revenueValue * factorImpacts.revenueBoostMultiplier) + factorImpacts.positiveRevenueImpact;
  
  // Add negative impacts to costs
  const enhancedTotalCost = baseValues.platformCost + baseValues.appCosts + factorImpacts.totalNegativeImpact;
  
  // Calculate totals
  const enhancedTotalValue = enhancedTimeValue + enhancedRiskValue + enhancedRevenueValue;
  const enhancedNetROI = enhancedTotalValue - enhancedTotalCost;
  
  // Calculate how much the factors boosted ROI
  const baseNetROI = (baseValues.timeValue + baseValues.riskValue + baseValues.revenueValue) - (baseValues.platformCost + baseValues.appCosts);
  const factorBoost = enhancedNetROI - baseNetROI;
  
  return {
    enhancedTimeValue,
    enhancedRiskValue,
    enhancedRevenueValue,
    enhancedTotalValue,
    enhancedTotalCost,
    enhancedNetROI,
    factorBoost,
  };
}

/**
 * Calculate the total monthly impact of factors in dollars
 * @param positiveFactors Array of positive factors
 * @param negativeFactors Array of negative factors  
 * @param factorValues Current values for each factor
 * @returns Total monthly impact in dollars
 */
export function calculateTotalFactorImpact(
  positiveFactors: PositiveFactor[],
  negativeFactors: NegativeFactor[],
  factorValues: Record<string, number>
): number {
  let totalImpact = 0;
  
  // Sum positive impacts
  positiveFactors.forEach(factor => {
    const currentValue = factorValues[factor.id] ?? factor.defaultValue;
    const ratio = currentValue / Math.max(1, factor.suggestedValue);
    totalImpact += factor.estimatedMonthlyImpact * ratio;
  });
  
  // Subtract negative impacts
  negativeFactors.forEach(factor => {
    const currentValue = factorValues[factor.id] ?? factor.defaultValue;
    const ratio = currentValue / Math.max(1, factor.suggestedValue);
    totalImpact += factor.estimatedMonthlyImpact * ratio; // estimatedMonthlyImpact is already negative
  });
  
  return totalImpact;
}
