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
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  Eye,
  Link,
  Settings,
  Wrench,
  AlertCircle,
  GraduationCap,
  CreditCard,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import type { PositiveFactor, NegativeFactor } from '@/app/api/openai/generate-roi-fields/types';

// Icon mapping for factor icons
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  Eye,
  Link,
  Settings,
  Wrench,
  AlertCircle,
  GraduationCap,
  CreditCard,
  Sparkles,
};

interface FactorCardProps {
  factor: PositiveFactor | NegativeFactor;
  value: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  variant?: 'positive' | 'negative';
  disabled?: boolean;
  showImpact?: boolean;
  compact?: boolean;
}

export function FactorCard({
  factor,
  value,
  onChange,
  onReset,
  variant,
  disabled = false,
  showImpact = true,
  compact = false
}: FactorCardProps) {
  const isPositive = variant === 'positive' || !('severity' in factor);
  const Icon = factor.icon ? iconMap[factor.icon] || TrendingUp : TrendingUp;
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
  
  // Priority/Severity badge
  const getBadgeVariant = () => {
    if (isPositive && 'priority' in factor) {
      switch (factor.priority) {
        case 'high': return 'default';
        case 'medium': return 'secondary';
        case 'low': return 'outline';
      }
    }
    if (!isPositive && 'severity' in factor) {
      switch ((factor as NegativeFactor).severity) {
        case 'critical': return 'destructive';
        case 'major': return 'default';
        case 'minor': return 'secondary';
      }
    }
    return 'secondary';
  };
  
  if (compact) {
    // Compact view for space-constrained layouts
    return (
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        isPositive 
          ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
          : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
        disabled && "opacity-50"
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className={cn("h-4 w-4", isPositive ? "text-green-600" : "text-red-600")} />
          <span className="text-sm font-medium truncate">{factor.label}</span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{factor.description}</p>
              {factor.reasoning && (
                <p className="mt-1 text-xs text-muted-foreground">{factor.reasoning}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
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
        </div>
      </div>
    );
  }
  
  // Full card view
  return (
    <Card className={cn(
      "p-4 space-y-3 transition-all",
      isPositive 
        ? "border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10" 
        : "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10",
      disabled && "opacity-50",
      hasChanged && "ring-2 ring-primary/20"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className={cn(
            "p-1.5 rounded-lg",
            isPositive ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
          )}>
            <Icon className={cn("h-4 w-4", isPositive ? "text-green-600" : "text-red-600")} />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="font-semibold text-sm">{factor.label}</Label>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {factor.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Badge variant={getBadgeVariant()} className="text-xs">
            {isPositive && 'priority' in factor && factor.priority}
            {!isPositive && 'severity' in factor && (factor as NegativeFactor).severity}
          </Badge>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Impact Formula:</p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {factor.impactFormula}
                </code>
                {factor.reasoning && (
                  <>
                    <p className="font-medium">Reasoning:</p>
                    <p className="text-xs">{factor.reasoning}</p>
                  </>
                )}
                {'industryBenchmark' in factor && factor.industryBenchmark && (
                  <p className="text-xs">
                    Industry benchmark: {factor.industryBenchmark}{unitSymbol}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Confidence: {factor.confidence}%
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
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
            disabled={disabled}
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
              disabled={disabled}
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
