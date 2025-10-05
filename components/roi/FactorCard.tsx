/**
 * FactorCard Component
 * Displays individual ROI factors with interactive controls
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Tooltip removed per design update
import { cn } from '@/lib/utils';
import { RotateCcw, Lock, Unlock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { PositiveFactor, NegativeFactor } from '@/app/api/openai/generate-roi-fields/types';

// Icons removed from cards per design update

interface FactorCardProps {
  factor: PositiveFactor | NegativeFactor;
  value: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  variant?: 'positive' | 'negative';
  disabled?: boolean;
  showImpact?: boolean;
  compact?: boolean;
  locked?: boolean;
  onToggleLock?: () => void;
  enabled?: boolean;
  onEnabledChange?: (checked: boolean) => void;
}

export function FactorCard({
  factor,
  value,
  onChange,
  onReset,
  variant,
  disabled = false,
  showImpact = true,
  compact = false,
  locked = false,
  onToggleLock,
  enabled = true,
  onEnabledChange,
}: FactorCardProps) {
  const isPositive = variant === 'positive' || !('severity' in factor);
  const hasChanged = value !== factor.suggestedValue;
  
  // Format unit symbol
  const getUnitSymbol = (unit: string) => {
    switch (unit) {
      case 'percentage': return '%';
      case 'currency': return '$';
      case 'hours': return 'hrs';
      case 'score': return 'pts';
      case 'number': return '';
      default: return '';
    }
  };
  
  const unitSymbol = getUnitSymbol(factor.unit);
  const isPrefix = factor.unit === 'currency';
  
  // Calculate impact color
  const impactColor = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
  
  // Calculate current impact based on value
  const currentImpact = React.useMemo(() => {
    const ratio = value / factor.suggestedValue;
    return Math.round(factor.estimatedMonthlyImpact * ratio);
  }, [value, factor.suggestedValue, factor.estimatedMonthlyImpact]);
  
  // No priority/severity badges per new UI requirements
  
  if (compact) {
    // Compact view for space-constrained layouts
    return (
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        enabled
          ? (
            isPositive 
              ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
              : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
          )
          : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800",
        (disabled || !enabled) && "opacity-70"
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onEnabledChange && (
            <Checkbox checked={enabled} onCheckedChange={(v) => onEnabledChange(Boolean(v))} />
          )}
          <span className="text-sm font-medium truncate">{factor.label}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled || !enabled}
            min={factor.minValue}
            max={factor.maxValue}
            step={factor.step}
            className="w-20 h-7 text-right text-sm"
          />
          <span className="text-sm text-muted-foreground w-8">
            {isPrefix && unitSymbol}{!isPrefix && unitSymbol}
          </span>
          {showImpact && (
            <span className={cn("text-sm font-medium tabular-nums", impactColor)}>
              {isPositive ? '+' : ''}{currentImpact < 0 ? '' : ''}${Math.abs(currentImpact)}
            </span>
          )}
          {onToggleLock && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleLock}
              className="h-7 w-7"
              aria-label={locked ? 'Unlock factor' : 'Lock factor'}
            >
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Full card view
  return (
    <Card className={cn(
      "p-4 space-y-3 transition-all",
      enabled
        ? (
          isPositive 
            ? "border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10" 
            : "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10"
        )
        : "border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-900",
      (disabled || !enabled) && "opacity-70",
      hasChanged && "ring-2 ring-primary/20"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 flex-1">
          {onEnabledChange && (
            <Checkbox checked={enabled} onCheckedChange={(v) => onEnabledChange(Boolean(v))} className="mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <Label className="font-semibold text-sm">{factor.label}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {factor.description}
            </p>
          </div>
        </div>

        {onToggleLock && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleLock}
              className="h-7 w-7"
              aria-label={locked ? 'Unlock factor' : 'Lock factor'}
            >
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>
      
      {/* Value Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={factor.minValue}
            max={factor.maxValue}
            step={factor.step}
            disabled={disabled || !enabled}
            className={cn(
              "flex-1",
              isPositive && "[&_[role=slider]]:bg-green-600",
              !isPositive && "[&_[role=slider]]:bg-red-600"
            )}
          />
          <div className="flex items-center gap-1">
            {isPrefix && <span className="text-sm text-muted-foreground">{unitSymbol}</span>}
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled || !enabled}
              min={factor.minValue}
              max={factor.maxValue}
              step={factor.step}
              className="w-20 h-8 text-right text-sm"
            />
            {!isPrefix && <span className="text-sm text-muted-foreground w-8">{unitSymbol}</span>}
          </div>
        </div>
        
        {/* Range labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{isPrefix && unitSymbol}{factor.minValue}{!isPrefix && unitSymbol}</span>
          <span className="flex items-center gap-1">
            Default: {isPrefix && unitSymbol}{factor.defaultValue}{!isPrefix && unitSymbol}
            {factor.suggestedValue !== factor.defaultValue && (
              <>
                <span>•</span>
                AI: {isPrefix && unitSymbol}{factor.suggestedValue}{!isPrefix && unitSymbol}
              </>
            )}
          </span>
          <span>{isPrefix && unitSymbol}{factor.maxValue}{!isPrefix && unitSymbol}</span>
        </div>
      </div>
      
      {/* Impact & Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-3">
          {showImpact && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Impact:</span>
              <span className={cn("text-sm font-semibold tabular-nums", impactColor)}>
                {isPositive ? '+' : ''}{currentImpact < 0 ? '' : ''}${Math.abs(currentImpact).toLocaleString()}/mo
              </span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {factor.source === 'ai' ? '✨ AI' : factor.source}
          </Badge>
        </div>
        
        {onReset && hasChanged && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
      
      {/* Additional info for negative factors */}
      {!isPositive && 'mitigationStrategy' in factor && (factor as NegativeFactor).mitigationStrategy && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Mitigation:</span> {(factor as NegativeFactor).mitigationStrategy}
          </p>
        </div>
      )}
    </Card>
  );
}
