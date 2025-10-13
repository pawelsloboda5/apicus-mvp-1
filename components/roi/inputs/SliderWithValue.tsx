/**
 * Slider With Value Component
 * 
 * Enhanced slider control with integrated value display and labels.
 * Provides consistent styling and accessibility features.
 */

"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderWithValueProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  helpText?: string;
  tooltip?: string;
  className?: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}

export function SliderWithValue({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  helpText,
  tooltip,
  className,
  disabled = false,
  formatValue,
}: SliderWithValueProps) {
  const displayValue = formatValue ? formatValue(value) : value.toLocaleString();

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label and value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
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

        <Badge variant="secondary" className="text-base font-bold px-3">
          {displayValue}{unit && ` ${unit}`}
        </Badge>
      </div>

      {/* Slider */}
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
        aria-label={label}
      />

      {/* Range labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toLocaleString()}{unit && ` ${unit}`}</span>
        <span>{max.toLocaleString()}{unit && ` ${unit}`}</span>
      </div>

      {/* Help text */}
      {helpText && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
}
