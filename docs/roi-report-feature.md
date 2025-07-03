# ROI Report Feature Documentation

## Overview

The ROI Report feature provides automation consultants with a powerful tool to generate professional, data-driven ROI analysis reports for their clients. This feature follows the same pattern as the email generation system but focuses on presenting automation value propositions through compelling visualizations and metrics.

## Components

### 1. `useROIGeneration` Hook
Located at: `app/build/hooks/useROIGeneration.ts`

A custom React hook that manages the state and logic for ROI report generation.

**Key Features:**
- Calculates all ROI metrics (time value, risk value, revenue value, platform costs)
- Generates full reports with business impact descriptions
- Updates individual report sections
- Exports reports in multiple formats
- Manages loading states and error handling

**Usage Example:**
```typescript
const {
  currentReport,
  isGenerating,
  generateFullReport,
  updateReport,
  formattedROI,
  formattedPayback,
  hoursSaved
} = useROIGeneration({
  onReportGenerated: (report) => {
    console.log('Report generated:', report);
  }
});
```

### 2. `ROIReportNode` Component
Located at: `components/flow/ROIReportNode.tsx`

A visual node component for the React Flow canvas that displays the ROI report.

**Key Features:**
- 400px wide card with multiple sections
- Platform-specific color schemes (Zapier, Make, n8n)
- Key metrics summary (Net ROI, Platform Cost, Runs/Month)
- Workflow steps visualization
- Revenue breakdown with visual bars
- Performance metrics (Payback Period, Break-even, Confidence)
- Business impact section with key benefits
- Optional platform comparison
- Export functionality

**Props:**
```typescript
interface ROIReportNodeData {
  nodeTitle?: string;
  reportTitle?: string;
  clientName?: string;
  projectName?: string;
  platform?: 'zapier' | 'make' | 'n8n';
  runsPerMonth?: number;
  minutesPerRun?: number;
  hourlyRate?: number;
  // ... other metrics
  onGenerateReport?: () => Promise<void>;
  onRegenerateSection?: (section: string) => Promise<void>;
}
```

### 3. `ROINodePropertiesPanel` Component
Located at: `components/flow/ROINodePropertiesPanel.tsx`

A properties panel that slides in from the right for customizing ROI reports.

**Tabs:**
1. **Basic Info**: Report title, client name, project name, platform selection
2. **Metrics**: Core metrics configuration (runs/month, minutes/run, hourly rate)
3. **Advanced**: Risk & compliance settings, revenue uplift configuration
4. **Visual**: Color scheme selection, display options, business impact text

**Key Features:**
- Real-time updates to the node as properties change
- Task type selection with automatic multipliers
- Platform cost calculations
- Risk and revenue uplift toggles
- Customizable visual themes

## Integration Guide

### Adding to the Flow Canvas

1. Register the ROI Report node type in your node factory:
```typescript
// In lib/flow/node-factory.ts
case 'roiReport':
  return {
    id,
    type: 'roiReport',
    position,
    data: {
      nodeTitle: 'ROI Report',
      reportTitle: 'Automation ROI Analysis',
      platform: 'zapier',
      runsPerMonth: 250,
      minutesPerRun: 3,
      hourlyRate: 40,
      // ... other defaults
    }
  };
```

2. Add the node component to your flow renderer:
```typescript
// In your flow component
const nodeTypes = {
  // ... other node types
  roiReport: ROIReportNode,
};
```

3. Add the properties panel:
```typescript
{selectedNode?.type === 'roiReport' && (
  <ROINodePropertiesPanel
    selectedNode={selectedNode}
    onClose={() => setSelectedNode(null)}
    onUpdateNodeData={updateNodeData}
    onGenerateReport={handleGenerateReport}
    onRegenerateSection={handleRegenerateSection}
    isGenerating={isGenerating}
  />
)}
```

### Generating Reports

```typescript
const handleGenerateReport = async (nodeId: string) => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  const contextData = {
    taskType: 'sales',
    industry: 'SaaS',
    companySize: 'SMB',
    currentChallenges: ['manual lead processing', 'slow response times'],
    automationGoals: ['increase conversion', 'reduce response time']
  };

  const params = {
    platform: node.data.platform || 'zapier',
    taskType: 'sales',
    taskMultiplier: 1.5,
    includeRiskAnalysis: node.data.complianceEnabled,
    includeRevenueUplift: node.data.revenueEnabled
  };

  const report = await generateFullReport(contextData, params);
  
  // Update node with generated report
  updateNodeData(nodeId, report);
};
```

## Customization Options

### Color Schemes
- **Zapier**: Orange theme (#FF4A00)
- **Make**: Purple theme (#6C2BD9)
- **n8n**: Pink theme (#EA4B71)
- **Custom**: Blue theme (#3B82F6)

### Task Types & Multipliers
- General Automation: 1.0x
- Administrative: 0.8x
- Customer Support: 1.2x
- Sales Enablement: 1.5x
- Marketing: 1.3x
- Compliance/Legal: 2.0x
- Operations: 1.1x
- Finance: 1.8x
- Lead Generation: 1.6x

### Export Formats
- **PDF**: Professional report format
- **JSON**: Raw data for integrations
- **HTML**: Web-ready format with styling

## Best Practices

1. **Accurate Metrics**: Ensure runs per month and minutes saved are realistic
2. **Task Type Selection**: Choose the appropriate task type for accurate value multipliers
3. **Platform Selection**: Match the actual platform being used for accurate cost calculations
4. **Business Impact**: Customize the business impact text to resonate with the specific client
5. **Visual Consistency**: Use platform-matching color schemes for brand alignment

## Example Workflow

1. Drag an ROI Report node onto the canvas
2. Connect it to relevant workflow nodes
3. Open the properties panel
4. Configure basic info (client, project details)
5. Set accurate metrics based on the automation
6. Enable risk/revenue calculations if applicable
7. Choose visual preferences
8. Click "Generate ROI Report"
9. Review and customize the business impact
10. Export in the desired format

## API Integration

The ROI report can be generated programmatically:

```typescript
const roiData = {
  scenarioName: 'Email Automation Workflow',
  platform: 'zapier',
  netROI: 5000,
  roiRatio: 10,
  paybackPeriod: '2 weeks',
  runsPerMonth: 250,
  // ... other metrics
};

// Use with email generation
const emailSection = await generateEmailSection(
  'cta',
  contextData,
  customPrompt,
  roiData // Pass ROI metrics for context
);
``` 