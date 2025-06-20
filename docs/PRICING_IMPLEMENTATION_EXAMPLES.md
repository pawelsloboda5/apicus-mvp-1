# Pricing Data Implementation Examples

## 1. Enhanced Node Properties Panel with Pricing

### NodePropertiesPanel.tsx Updates

```typescript
// Add to NodePropertiesPanel component
import { useTemplatePricing } from '@/lib/hooks/useTemplatePricing';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

// Inside component
const { pricingData } = useTemplatePricing(currentScenario?.originalTemplateId);
const appPricing = nodeData?.appId ? pricingData?.[nodeData.appId] : null;

// New pricing section in the panel
{appPricing && (
  <div className="space-y-3">
    <h3 className="text-base font-semibold flex items-center gap-2">
      <DollarSign className="h-4 w-4" />
      App Pricing Details
    </h3>
    
    {/* Pricing Badge */}
    <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
      {appPricing.logoUrl && (
        <img src={appPricing.logoUrl} alt={appPricing.appName} className="h-8 w-8 rounded" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{appPricing.appName}</span>
          {appPricing.hasFreeTier && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Free Tier Available
            </Badge>
          )}
          {appPricing.hasAIFeatures && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              AI Features
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          ${appPricing.lowestMonthlyPrice} - ${appPricing.highestMonthlyPrice}/mo
        </div>
      </div>
    </div>
    
    {/* Cost Calculator */}
    <div className="p-3 border rounded-lg space-y-2">
      <div className="text-sm font-medium">Cost at Current Volume</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">Runs/month:</div>
        <div className="font-medium">{runsPerMonth}</div>
        
        <div className="text-muted-foreground">Estimated cost:</div>
        <div className="font-medium text-green-600">
          {calculateAppCost(appPricing, runsPerMonth)}
        </div>
        
        {appPricing.hasUsageBasedPricing && (
          <>
            <div className="text-muted-foreground">Pricing model:</div>
            <div className="font-medium text-amber-600">Usage-based</div>
          </>
        )}
      </div>
      
      {/* Free tier warning */}
      {appPricing.hasFreeTier && isApproachingFreeTierLimit(appPricing, runsPerMonth) && (
        <Alert className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching the free tier limit. Consider batching operations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  </div>
)}
```

## 2. StatsBar with Total App Costs

### StatsBar.tsx Enhancement

```typescript
// Add new calculation
const calculateTotalAppCosts = () => {
  if (!nodes || !pricingData) return 0;
  
  const uniqueApps = new Set<string>();
  nodes.forEach(node => {
    if (node.data?.appId) {
      uniqueApps.add(node.data.appId);
    }
  });
  
  let totalCost = 0;
  uniqueApps.forEach(appId => {
    const pricing = pricingData[appId];
    if (pricing) {
      totalCost += estimateMonthlyAppCost(pricing, runsPerMonth);
    }
  });
  
  return totalCost;
};

// Add to stats display
<StatItem
  label="App Costs"
  value={calculateTotalAppCosts()}
  isCurrency={true}
  color={calculateTotalAppCosts() === 0 ? "text-green-600" : "text-amber-600"}
  icon={DollarSign}
/>

// Enhanced ROI display
<div className="text-sm text-muted-foreground">
  Saving ${calculateToolSavings()}/mo vs manual tools
</div>
```

## 3. Email Generation with Pricing Context

### Email Generation API Enhancement

```typescript
// In handleGenerateEmailOnCanvas function
const workflowAppCosts = calculateWorkflowAppCosts(nodes, pricingData, runsPerMonth);
const toolSavings = estimateToolSavings(nodes, pricingData);

const comprehensivePayload = {
  // ... existing payload
  
  // New pricing context
  pricingContext: {
    totalAppCosts: workflowAppCosts.total,
    appBreakdown: workflowAppCosts.breakdown,
    freeAppsUsed: workflowAppCosts.freeApps,
    paidAppsUsed: workflowAppCosts.paidApps,
    potentialSavings: toolSavings,
    costOptimizations: generateCostOptimizations(nodes, pricingData),
  },
  
  // Enhanced email context
  emailContext: {
    ...emailContext,
    budgetRange: formData.budgetRange || 'medium', // New field
    companySize: formData.companySize || '10-50',  // New field
  }
};
```

### Enhanced Email Templates

```typescript
// New email hook examples
const pricingAwareHooks = {
  cost_focused: `I noticed your team uses ${paidAppsCount} paid tools costing ~$${currentToolCost}/mo. 
    Our automation achieves the same results using ${freeAppsCount} free tiers, 
    cutting your tool costs by ${savingsPercentage}% while saving ${hoursPerMonth} hours.`,
    
  free_tier_optimization: `Here's something interesting: ${appName} has a generous free tier 
    that handles up to ${freeLimit} operations/month. Your current volume of ${currentVolume} 
    fits perfectly, meaning $0 in app costs.`,
    
  competitive_savings: `While competitors charge $${competitorCost}/mo for similar automation, 
    our approach uses ${platform} ($${platformCost}/mo) + carefully selected free tools, 
    saving you $${monthlySavings} from day one.`,
};
```

## 4. Visual Pricing Indicators on Nodes

### PixelNode.tsx Enhancement

```typescript
// Add pricing indicator to nodes
const PricingIndicator = ({ appId, pricingData, runsPerMonth }) => {
  const pricing = pricingData?.[appId];
  if (!pricing) return null;
  
  const monthlyNodeCost = estimateNodeMonthlyCost(pricing, runsPerMonth);
  const isFreeTier = pricing.hasFreeTier && monthlyNodeCost === 0;
  
  return (
    <div className={cn(
      "absolute -bottom-2 left-1/2 transform -translate-x-1/2",
      "px-2 py-0.5 rounded-full text-xs font-medium",
      "ring-2 ring-white dark:ring-gray-900",
      isFreeTier 
        ? "bg-green-500 text-white" 
        : monthlyNodeCost > 20 
        ? "bg-red-500 text-white"
        : "bg-amber-500 text-white"
    )}>
      {isFreeTier ? "Free" : `$${monthlyNodeCost}/mo`}
    </div>
  );
};

// Add to node render
{nodeData.appId && (
  <PricingIndicator 
    appId={nodeData.appId} 
    pricingData={pricingData} 
    runsPerMonth={runsPerMonth} 
  />
)}
```

## 5. Analytics Dashboard Cost Metrics

### AnalyticsDashboard.tsx Enhancement

```typescript
// New cost efficiency chart
const CostEfficiencyChart = ({ scenario, nodes, pricingData }) => {
  const data = useMemo(() => {
    const appCosts = calculateDetailedAppCosts(nodes, pricingData, scenario.runsPerMonth);
    
    return {
      labels: appCosts.map(app => app.name),
      datasets: [{
        label: 'Monthly Cost',
        data: appCosts.map(app => app.monthlyCost),
        backgroundColor: appCosts.map(app => 
          app.isFreeTier ? 'rgba(34, 197, 94, 0.8)' : 'rgba(245, 158, 11, 0.8)'
        ),
      }]
    };
  }, [nodes, pricingData, scenario]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>App Cost Breakdown</CardTitle>
        <CardDescription>
          Total: ${data.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(2)}/mo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Bar data={data} options={costChartOptions} />
      </CardContent>
    </Card>
  );
};

// Cost per outcome metric
const CostPerOutcome = ({ scenario, totalAppCosts }) => {
  const costPerRun = (totalAppCosts + platformCost) / scenario.runsPerMonth;
  const costPer100Runs = costPerRun * 100;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="Cost per Run"
        value={`$${costPerRun.toFixed(3)}`}
        trend={costPerRun < industryAverage ? 'positive' : 'negative'}
      />
      <MetricCard
        title="Cost per 100 Runs"
        value={`$${costPer100Runs.toFixed(2)}`}
        subtitle="Industry avg: $12.50"
      />
      <MetricCard
        title="Free Tier Usage"
        value={`${freeAppPercentage}%`}
        subtitle={`${freeAppsCount} of ${totalAppsCount} apps`}
      />
    </div>
  );
};
```

## 6. Smart Cost Optimization Suggestions

### New Component: CostOptimizer.tsx

```typescript
export const CostOptimizer = ({ nodes, pricingData, currentVolume }) => {
  const optimizations = useMemo(() => {
    const suggestions = [];
    
    // Check for expensive apps with free alternatives
    nodes.forEach(node => {
      if (node.data?.appId) {
        const pricing = pricingData[node.data.appId];
        const alternatives = findCheaperAlternatives(node.data.appId, pricingData);
        
        if (alternatives.length > 0 && pricing?.lowestMonthlyPrice > 0) {
          suggestions.push({
            type: 'alternative',
            priority: 'high',
            savings: calculateSavings(pricing, alternatives[0]),
            message: `Replace ${pricing.appName} with ${alternatives[0].appName}`,
            details: `Save $${calculateSavings(pricing, alternatives[0])}/mo`,
          });
        }
      }
    });
    
    // Check for underutilized paid tiers
    const utilization = calculateTierUtilization(nodes, pricingData, currentVolume);
    utilization.forEach(app => {
      if (app.utilizationPercentage < 30 && app.monthlyCosd > 0) {
        suggestions.push({
          type: 'downgrade',
          priority: 'medium',
          savings: app.potentialSavings,
          message: `Downgrade ${app.name} tier`,
          details: `Only using ${app.utilizationPercentage}% of current tier`,
        });
      }
    });
    
    return suggestions.sort((a, b) => b.savings - a.savings);
  }, [nodes, pricingData, currentVolume]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Optimization Opportunities</CardTitle>
        <CardDescription>
          Potential savings: ${optimizations.reduce((sum, opt) => sum + opt.savings, 0)}/mo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {optimizations.map((opt, idx) => (
            <OptimizationCard key={idx} {...opt} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

## 7. Utility Functions

### lib/pricing-utils.ts

```typescript
export function calculateAppCost(
  pricing: AppPricingData,
  monthlyVolume: number
): string {
  if (pricing.hasFreeTier && monthlyVolume <= estimateFreeTierLimit(pricing)) {
    return "$0 (Free tier)";
  }
  
  // Estimate based on volume and tier structure
  const estimatedTier = estimateTierForVolume(pricing, monthlyVolume);
  return `$${estimatedTier.price}/mo`;
}

export function findCheaperAlternatives(
  appId: string,
  allPricing: Record<string, AppPricingData>
): AppPricingData[] {
  const currentApp = allPricing[appId];
  if (!currentApp) return [];
  
  // Find apps with similar functionality but lower cost
  return Object.values(allPricing)
    .filter(app => 
      app.appId !== appId &&
      app.category === currentApp.category &&
      app.lowestMonthlyPrice < currentApp.lowestMonthlyPrice
    )
    .sort((a, b) => a.lowestMonthlyPrice - b.lowestMonthlyPrice);
}

export function generateCostOptimizations(
  nodes: Node[],
  pricingData: Record<string, AppPricingData>
): string[] {
  const optimizations = [];
  
  // Check for multiple paid apps that could be consolidated
  const paidApps = nodes
    .filter(n => n.data?.appId && !pricingData[n.data.appId]?.hasFreeTier)
    .map(n => pricingData[n.data.appId]);
    
  if (paidApps.length > 2) {
    optimizations.push("Consider consolidating tools to reduce subscription overhead");
  }
  
  // More optimization logic...
  
  return optimizations;
}
```

This implementation provides concrete examples of how to integrate the pricing data throughout your UI for maximum impact on user experience and ROI calculations. 