/**
 * ROI Validation Hook
 * 
 * Provides validation logic for ROI input fields with real-time feedback.
 * Returns validation results including severity and helpful messages.
 */

import { useMemo } from 'react';

export interface ValidationRule {
  min?: number;
  max?: number;
  message?: string;
  realistic?: {
    min: number;
    max: number;
    message: string;
  };
  warning?: {
    threshold: number;
    message: string;
    condition: 'above' | 'below';
  };
}

export interface ValidationResult {
  valid: boolean;
  severity: 'error' | 'warning' | 'info' | 'success' | null;
  message?: string;
}

// Predefined validation rules for common ROI inputs
export const roiValidationRules: Record<string, ValidationRule> = {
  runsPerMonth: {
    min: 1,
    max: 50000,
    realistic: {
      min: 10,
      max: 5000,
      message: 'Most workflows run 10-5,000 times per month',
    },
    warning: {
      threshold: 10000,
      condition: 'above',
      message: 'Very high volume - verify this is accurate for stakeholder confidence',
    },
  },
  
  minutesPerRun: {
    min: 0.1,
    max: 120,
    realistic: {
      min: 1,
      max: 30,
      message: 'Most tasks save 1-30 minutes per run',
    },
    warning: {
      threshold: 60,
      condition: 'above',
      message: 'Over 1 hour saved - consider if some time is idle/wait time',
    },
  },
  
  hourlyRate: {
    min: 15,
    max: 200,
    realistic: {
      min: 25,
      max: 100,
      message: 'Typical labor costs: $25-100/hour',
    },
    warning: {
      threshold: 150,
      condition: 'above',
      message: 'Premium rate - ensure stakeholders understand the basis',
    },
  },
  
  errorCost: {
    min: 0,
    max: 100000,
    realistic: {
      min: 50,
      max: 5000,
      message: 'Typical error costs: $50-5,000',
    },
  },
  
  monthlyVolume: {
    min: 0,
    max: 1000000,
    realistic: {
      min: 100,
      max: 50000,
      message: 'Typical monthly volume: 100-50,000',
    },
  },
  
  conversionRate: {
    min: 0,
    max: 100,
    realistic: {
      min: 1,
      max: 20,
      message: 'Typical conversion rates: 1-20%',
    },
    warning: {
      threshold: 30,
      condition: 'above',
      message: 'Very high conversion rate - ensure accuracy',
    },
  },
};

/**
 * Validates a single ROI input value against its rules
 */
export function validateInput(
  fieldName: string,
  value: number,
  showRealistic: boolean = true
): ValidationResult {
  const rules = roiValidationRules[fieldName];
  
  if (!rules) {
    return { valid: true, severity: null };
  }

  // Error: Below minimum
  if (rules.min !== undefined && value < rules.min) {
    return {
      valid: false,
      severity: 'error',
      message: rules.message || `Must be at least ${rules.min}`,
    };
  }

  // Error: Above maximum
  if (rules.max !== undefined && value > rules.max) {
    return {
      valid: false,
      severity: 'error',
      message: rules.message || `Must be at most ${rules.max}`,
    };
  }

  // Warning: Outside realistic range
  if (showRealistic && rules.realistic) {
    if (value < rules.realistic.min || value > rules.realistic.max) {
      return {
        valid: true,
        severity: 'warning',
        message: rules.realistic.message || 
          `Typical range: ${rules.realistic.min}-${rules.realistic.max}`,
      };
    }
  }

  // Warning: Custom threshold
  if (rules.warning) {
    const meetsCondition = rules.warning.condition === 'above'
      ? value > rules.warning.threshold
      : value < rules.warning.threshold;
    
    if (meetsCondition) {
      return {
        valid: true,
        severity: 'warning',
        message: rules.warning.message,
      };
    }
  }

  // Success: Valid value
  return {
    valid: true,
    severity: 'success',
    message: undefined,
  };
}

/**
 * Hook for validating ROI inputs with memoization
 */
export function useROIValidation(
  fieldName: string,
  value: number,
  showRealistic: boolean = true
): ValidationResult {
  return useMemo(() => {
    return validateInput(fieldName, value, showRealistic);
  }, [fieldName, value, showRealistic]);
}
