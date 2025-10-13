/**
 * Platform Comparison Component
 * 
 * Displays cost comparison across Zapier, Make, and n8n platforms.
 * Shows pricing tiers, unit costs, and visual comparison bars.
 */

"use client";

import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { pricing } from '@/app/api/data/pricing';
import type { PlatformType } from '@/lib/types';

interface PlatformComparisonProps {
  runsPerMonth: number;
  stepsPerRun?: number;
  currentPlatform: PlatformType;
}

export function PlatformComparison({ 
  runsPerMonth, 
  stepsPerRun = 5, 
  currentPlatform 
}: PlatformComparisonProps) {
  const platformData = useMemo(() => {
    const platforms = ['zapier', 'make', 'n8n'] as const;
    
    return platforms.map(platform => {
      const platformPricing = pricing[platform];
      const unitsPerMonth = platform === 'n8n' ? runsPerMonth : runsPerMonth * stepsPerRun;
      
      // Find the cheapest suitable tier
      let selectedTier = platformPricing.tiers[0];
      let totalCost = 0;
      
      for (const tier of platformPricing.tiers) {
        if (tier.quota === 0 || tier.quota >= unitsPerMonth) {
          selectedTier = tier;
          const result = platformPricing.cost(tier.name, unitsPerMonth);
          totalCost = result.cost;
          break;
        }
      }
      
      // Calculate unit cost
      const unitCost = unitsPerMonth > 0 ? totalCost / unitsPerMonth : 0;
      
      return {
        name: platformPricing.platform,
        tier: selectedTier.name,
        totalCost,
        unitCost,
        units: unitsPerMonth,
        unitType: platformPricing.unit,
        color: platform === 'zapier' ? '#FF4A00' : platform === 'make' ? '#6C2BD9' : '#EA4B71',
        isActive: platform === currentPlatform
      };
    });
  }, [runsPerMonth, stepsPerRun, currentPlatform]);

  const maxCost = Math.max(...platformData.map(p => p.totalCost));

  return (
    <div className="grid grid-cols-3 gap-3">
      {platformData.map((platform) => (
        <div 
          key={platform.name}
          className={cn(
            "relative p-4 rounded-lg border transition-all",
            platform.isActive 
              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span 
                className="font-semibold capitalize text-sm" 
                style={{ color: platform.color }}
              >
                {platform.name}
              </span>
              {platform.isActive && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">${platform.totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {platform.tier}
              </div>
              <div className="text-xs text-muted-foreground">
                {platform.units.toLocaleString()} {platform.unitType}s
              </div>
              <div className="text-xs text-muted-foreground">
                ${platform.unitCost.toFixed(4)}/{platform.unitType}
              </div>
            </div>
            
            <Progress 
              value={(platform.totalCost / maxCost) * 100} 
              className="h-2 bg-muted"
              style={{ 
                // @ts-expect-error CSS custom properties are not recognized by TypeScript but are valid CSS
                '--tw-bg-opacity': '1'
              }}
            >
              <div 
                className="h-full transition-all rounded-full"
                style={{ 
                  width: `${(platform.totalCost / maxCost) * 100}%`,
                  backgroundColor: platform.color
                }}
              />
            </Progress>
          </div>
        </div>
      ))}
    </div>
  );
}
