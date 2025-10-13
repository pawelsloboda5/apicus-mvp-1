/**
 * Validated Input Component
 * 
 * Enhanced input with real-time validation, visual feedback,
 * and accessibility features for ROI configuration.
 */

"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ValidatedInputProps {
  // Basic props
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  
  // Validation
  validation?: ValidationRule;
  
  // Input config
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  
  // Help & tooltip
  helpText?: string;
  tooltip?: string;
  
  // Display options
  showRealisticRange?: boolean;
  showLiveValidation?: boolean;
  
  // Styling
  className?: string;
  
  // Accessibility
  required?: boolean;
  'aria-describedby'?: string;
}

export function ValidatedInput({
  id,
  label,
  value,
  onChange,
  validation,
  min,
  max,
  step = 1,
  unit,
  helpText,
  tooltip,
  showRealisticRange = true,
  showLiveValidation = true,
  className,
  required = false,
  'aria-describedby': ariaDescribedBy,
}: ValidatedInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasBlurred, setHasBlurred] = React.useState(false);

  // Validate current value
  const validationResult = React.useMemo((): ValidationResult => {
    if (!validation || !showLiveValidation) {
      return { valid: true, severity: null };
    }

    // Error: Below minimum
    if (validation.min !== undefined && value < validation.min) {
      return {
        valid: false,
        severity: 'error',
        message: validation.message || `Must be at least ${validation.min}`,
      };
    }

    // Error: Above maximum
    if (validation.max !== undefined && value > validation.max) {
      return {
        valid: false,
        severity: 'error',
        message: validation.message || `Must be at most ${validation.max}`,
      };
    }

    // Warning: Outside realistic range
    if (showRealisticRange && validation.realistic) {
      if (value < validation.realistic.min || value > validation.realistic.max) {
        return {
          valid: true,
          severity: 'warning',
          message: validation.realistic.message || 
            `Typical range: ${validation.realistic.min}-${validation.realistic.max}`,
        };
      }
    }

    // Warning: Custom threshold
    if (validation.warning) {
      const meetsCondition = validation.warning.condition === 'above'
        ? value > validation.warning.threshold
        : value < validation.warning.threshold;
      
      if (meetsCondition) {
        return {
          valid: true,
          severity: 'warning',
          message: validation.warning.message,
        };
      }
    }

    // Success: Valid value
    return {
      valid: true,
      severity: hasBlurred ? 'success' : null,
      message: hasBlurred ? 'Valid value' : undefined,
    };
  }, [value, validation, showLiveValidation, showRealisticRange, hasBlurred]);

  // Get status icon
  const StatusIcon = React.useMemo(() => {
    switch (validationResult.severity) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return Info;
      case 'success':
        return CheckCircle;
      default:
        return null;
    }
  }, [validationResult.severity]);

  // Generate IDs for accessibility
  const helpId = `${id}-help`;
  const validationId = `${id}-validation`;
  const realisticRangeId = `${id}-realistic`;

  const describedByIds = [
    helpText && helpId,
    validationResult.message && validationId,
    showRealisticRange && validation?.realistic && realisticRangeId,
    ariaDescribedBy,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label with tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label 
            htmlFor={id}
            className="text-sm font-medium"
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
          
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Help for ${label}`}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Current value badge */}
        <Badge 
          variant={
            validationResult.severity === 'error' ? 'destructive' :
            validationResult.severity === 'warning' ? 'outline' :
            'secondary'
          }
          className="text-sm font-bold px-2 py-1"
        >
          {value.toLocaleString()}{unit && ` ${unit}`}
        </Badge>
      </div>

      {/* Input field with validation styling */}
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setHasBlurred(true);
          }}
          className={cn(
            "h-11 pr-10 transition-all",
            validationResult.severity === 'error' && 
              "border-destructive focus-visible:ring-destructive",
            validationResult.severity === 'warning' && 
              "border-warning focus-visible:ring-warning",
            validationResult.severity === 'success' && 
              "border-success focus-visible:ring-success"
          )}
          aria-invalid={validationResult.severity === 'error'}
          aria-describedby={describedByIds || undefined}
          aria-required={required}
        />

        {/* Status icon */}
        {StatusIcon && showLiveValidation && !isFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <StatusIcon 
              className={cn(
                "h-5 w-5",
                validationResult.severity === 'error' && "text-destructive",
                validationResult.severity === 'warning' && "text-warning",
                validationResult.severity === 'success' && "text-success"
              )}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && (
        <p 
          id={helpId}
          className="text-xs text-muted-foreground"
        >
          {helpText}
        </p>
      )}

      {/* Realistic range indicator */}
      {showRealisticRange && validation?.realistic && (
        <div 
          id={realisticRangeId}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Info className="h-3 w-3" />
          <span>
            Typical range: {validation.realistic.min.toLocaleString()} - {validation.realistic.max.toLocaleString()}
            {unit && ` ${unit}`}
          </span>
        </div>
      )}

      {/* Validation message */}
      {validationResult.message && showLiveValidation && !isFocused && (
        <div
          id={validationId}
          role={validationResult.severity === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            "flex items-start gap-2 p-3 rounded-md text-sm",
            validationResult.severity === 'error' && 
              "bg-destructive/10 border border-destructive/30 text-destructive",
            validationResult.severity === 'warning' && 
              "bg-warning/10 border border-warning/30 text-warning-foreground",
            validationResult.severity === 'success' && 
              "bg-success/10 border border-success/30 text-success-foreground"
          )}
        >
          {StatusIcon && <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" />}
          <p className="flex-1">{validationResult.message}</p>
        </div>
      )}

      {/* Live screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {!isFocused && validationResult.message && (
          `${label}: ${validationResult.message}`
        )}
      </div>
    </div>
  );
}

// Predefined validation rules for common ROI inputs
export const roiValidationRules = {
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
      condition: 'above' as const,
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
      condition: 'above' as const,
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
      condition: 'above' as const,
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
      condition: 'above' as const,
      message: 'Very high conversion rate - ensure accuracy',
    },
  },
} as const;
