# Analytics Dashboard Feature Specification

## Overview
The Analytics Dashboard is a comprehensive data visualization feature for Apicus that provides users with deep insights into their automation ROI, performance metrics, and comparative analysis. The dashboard will be accessible as a separate view within the build interface and uniquely allows users to embed charts directly into their workflow canvas as analytics nodes.

## Core Objectives
1. **Visual ROI Communication**: Help users understand and communicate the value of their automations through compelling visualizations
2. **Performance Analysis**: Identify bottlenecks and optimization opportunities in workflows
3. **Comparative Insights**: Compare scenarios, platforms, and benchmark against industry standards
4. **Canvas Integration**: Revolutionary feature to embed live analytics directly into workflow diagrams

## Technical Architecture

### Navigation Structure
```
/build/[id]
  ├── Canvas (default view)
  ├── Analytics (new view)
  └── Email (existing view)
```

Navigation will be implemented as tabs within the build page header, with smooth transitions and state preservation between views.

### Data Architecture

#### Metrics Storage (Dexie Schema Update)
```typescript
interface MetricSnapshot {
  id?: number;
  scenarioId: number;
  timestamp: Date;
  metrics: {
    netROI: number;
    roiRatio: number;
    timeValue: number;
    riskValue?: number;
    revenueValue?: number;
    platformCost: number;
    runsPerMonth: number;
    minutesPerRun: number;
    // ... other relevant metrics
  };
}

// Update db.ts
metrics: '++id, scenarioId, timestamp'
```

#### Real-time Data Flow
- Canvas changes → Update current metrics → Update dashboard
- Historical snapshots taken on significant changes (save, platform switch, major edits)
- Metrics aggregation for trend analysis
- **Data Retention**: Automatic cleanup of metrics older than 90 days to maintain performance

## Chart Components Specification

### 1. ROI Gauge
**Purpose**: Primary KPI visualization showing ROI multiplier

**Technical Details**:
- Built with `@visx/shape` Arc components
- Animated transitions using React 19's concurrent features
- Color zones: Red (<1x), Yellow (1-2x), Green (>2x)
- Embeddable in both StatsBar and Analytics dashboard

**Props Interface**:
```typescript
interface RoiGaugeProps {
  ratio: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
  onThresholdCross?: (threshold: number) => void;
}
```

### 2. ROI Breakdown Waterfall
**Purpose**: Visualize component contributions to total ROI

**Technical Details**:
- Uses `@visx/xychart` for declarative chart API
- Supports drill-down into each component
- Animated bar transitions
- Export to PNG/SVG functionality

**Data Structure**:
```typescript
interface WaterfallDataPoint {
  label: string;
  value: number;
  category: 'value' | 'cost' | 'total';
  breakdown?: WaterfallDataPoint[];
}
```

### 3. Node Time Sankey
**Purpose**: Visualize time flow through automation steps

**Technical Details**:
- Direct mapping from React Flow nodes/edges
- Link thickness represents time proportion
- Interactive - clicking highlights path
- Syncs with canvas selection

**Integration Points**:
- Reads directly from canvas nodes/edges state
- Updates when workflow changes
- Highlights corresponding canvas nodes on hover

### 4. Scenario Comparison
**Purpose**: Compare multiple automation scenarios

**Features**:
- Sparklines in scenario list (Toolbox integration)
- Full comparison dashboard with multiple metrics
- Scenario switching without losing context
- Export comparison reports

### 5. Benchmark Radar
**Purpose**: Compare user inputs against industry benchmarks

**Data Sources**:
- Static benchmarks in `lib/benchmarks.ts`
- Future: Dynamic benchmarks from aggregated user data
- Customizable benchmark sets by industry

### 6. AI-Powered Insights
**Purpose**: Provide intelligent interpretations of chart patterns and ROI metrics

**Features**:
- GPT-4 analysis of ROI trends
- Automated recommendations for optimization
- Natural language explanations of complex metrics
- Context-aware insights based on workflow structure

**Implementation**:
```typescript
interface ChartInsight {
  chartType: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
}
```

## Chart-to-Canvas Integration

### Analytics Node Type
New node type that embeds a live chart into the workflow canvas.

```typescript
interface AnalyticsNode extends Node {
  type: 'analytics';
  data: {
    chartType: ChartType;
    chartConfig: ChartConfig;
    lastSnapshot?: any; // For thumbnail rendering
    isInteractive: boolean; // Static by default, interactive within canvas
  };
}
```

### Implementation Flow
1. User clicks "Add to Canvas" on any chart
2. Chart configuration is serialized
3. New analytics node created at canvas center
4. Node shows static chart snapshot by default
5. Click to enable interactive mode within canvas
6. Double-click opens full chart modal

### Node Rendering
```tsx
function AnalyticsNode({ data }: NodeProps) {
  const [isInteractive, setIsInteractive] = useState(false);
  
  return (
    <div className="analytics-node">
      <div className="chart-container" onClick={() => setIsInteractive(!isInteractive)}>
        {isInteractive ? (
          <InteractiveChart type={data.chartType} config={data.chartConfig} />
        ) : (
          <StaticChartSnapshot data={data.lastSnapshot} />
        )}
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
```

## Dashboard Layout System

### Grid-Based Layout
- CSS Grid with defined areas
- Draggable widgets using native HTML5 drag
- Responsive breakpoints:
  - Desktop: 12-column grid
  - Tablet: 8-column grid
  - ~~Mobile: Single column stack~~ (Desktop/Tablet focus only)

### Widget Sizes
- Small (1x1): KPIs, gauges
- Medium (2x1): Bar charts, sparklines
- Large (2x2): Sankey, radar, complex visualizations
- Full-width (4x1): Comparison tables

### Layout Persistence
```typescript
interface DashboardState {
  activeLayout: string;
  layouts: Record<string, DashboardLayout>;
  widgetVisibility: Record<string, boolean>;
}
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Charts load only when visible using React.lazy()
2. **Virtualization**: Off-screen charts unmount
3. **Data Aggregation**: Pre-compute common metrics
4. **Memoization**: Heavy calculations cached
5. **Progressive Enhancement**: Basic view loads first
6. **Suspense Boundaries**: Wrap each chart in Suspense for optimal loading

### Bundle Size Management
- Dynamic imports for each chart type
- Tree-shaking unused visx components
- Separate bundles for dashboard vs canvas

### Data Retention Strategy
- Keep detailed metrics for 30 days
- Aggregate to daily summaries for 30-90 days
- Auto-cleanup process runs weekly
- Monitor IndexedDB size and adjust retention as needed

## Access Control
- **Chart Visibility**: All users have access to all charts and features
- **Data Access**: Users can only see their own scenario data
- **Export Permissions**: All users can export charts and data

## Implementation Phases

### Phase 1: Foundation (Current Sprint)
- Set up visx and chart-kit
- Basic navigation structure
- ROI Gauge component
- Metrics data layer with Dexie update

### Phase 2: Core Charts
- Waterfall chart
- Sankey diagram
- Basic dashboard layout
- Real-time updates

### Phase 3: Integration
- Analytics node type
- Chart embedding
- Scenario comparison
- AI insights integration

### Phase 4: Polish
- Performance optimization
- Export functionality
- Dashboard templates
- User testing

## Design Decisions

### Why visx?
- Lightweight and modular
- React-first architecture
- Excellent React 19 compatibility
- Tree-shakeable components
- TypeScript native

### Why Static Charts with Interactive Option?
- Performance first approach
- Reduces canvas complexity
- User controls when to engage
- Better for presentations
- Preserves canvas performance

### Real-time Updates
- Dashboard: Real-time updates for current view
- Canvas nodes: Static snapshots with manual interactive mode
- Balance between performance and interactivity

## Future Enhancements

### V2 Considerations
1. **White-labeling**: Custom branding for agencies (Nice to have - Phase 5+)
2. **Custom Charts**: User-defined visualizations
3. **API Access**: Embed charts in external tools
4. **Advanced Analytics**: Predictive modeling, what-if scenarios
5. **Real-time Collaboration**: Shared dashboards with live updates (Future release)

### Integration Opportunities
- Export to PowerBI/Tableau
- Slack/Teams notifications
- Scheduled reports
- Public dashboard sharing (with white-labeling)

## Testing Strategy

### Unit Tests
- Chart component rendering
- Data transformation logic
- Layout persistence
- Export functionality
- AI insight generation

### Integration Tests
- Canvas ↔ Dashboard interaction
- Data flow consistency
- Performance benchmarks
- Dexie metrics storage

### User Testing
- Discoverability of features
- Intuitive chart interactions
- Export quality
- AI insight usefulness

## Success Metrics
- Chart load time < 100ms
- 60% of users engage with analytics
- 30% embed charts in canvas
- 90% satisfaction with insights
- Zero performance degradation
- 80% find AI insights valuable

## Security Considerations
- Client-side only analytics
- No sensitive data in snapshots
- Secure export handling
- Privacy-preserving benchmarks
- AI insights respect data privacy 