# Backend Fix Progress & Planning

## Fixed Issues ✅

1. **MongoDB ObjectId Conversion Issue** - ✅ FIXED
   - Removed incorrect ObjectId conversion for templateId
   - Using string-based IDs throughout the system
   - Templates now load correctly without MongoDB driver errors

2. **Template API Endpoint** - ✅ FIXED
   - Created `/api/templates/[templateId]/route.ts`
   - Properly handles async params in Next.js 15
   - Returns template data from MongoDB

3. **Email Generation API Fixes** - ✅ FIXED
   - Fixed generate-email-section endpoint payload validation
   - Added proper error handling and logging
   - Ensured roiData structure matches API expectations

4. **React Flow Missing Key Props Warning** - ✅ FIXED
   - **Issue**: Templates from MongoDB used `reactFlowId` instead of `id` for nodes/edges
   - **Symptoms**: React warning "Each child in a list should have a unique key prop"
   - **Root Cause**: Backend enrichment script created nodes with `reactFlowId` field
   - **Solution**: 
     - Created transformation utilities `transformTemplateNodes` and `transformTemplateEdges` in `lib/flow-utils.ts`
     - These functions map `reactFlowId` → `id` and ensure unique IDs using nanoid
     - Applied transformation when loading templates in `BuildPageContent.tsx`
   - **Result**: Templates now load without React key warnings

5. **React Flow Warning** - Fixed by memoizing `enhancedNodeTypes` with proper dependencies

6. **Removed Zoom Controls** - Removed `<Controls />` component, using mouse wheel zoom only

7. **Template Loading** - Fixed API response field mapping (nodes/edges vs nodesSnapshot/edgesSnapshot)

8. **Type Safety** - Replaced multiple `any` types with proper TypeScript interfaces

9. **Default Template** - Added default marketing workflow for new users

## Current Issues 🔧

### 1. Backend Template Search
- **Issue**: Templates not loading properly from MongoDB
- **Root Cause**: Template API returns `nodes` and `edges` but frontend was looking for `nodesSnapshot` and `edgesSnapshot`
- **Status**: FIXED ✅
- **Fix**: Updated BuildPageContent.tsx to handle both field names

### 2. ROI Metrics Display
- **Issue**: ROI calculations exist but aren't displayed in UI
- **Data Available**: 
  - Time saved (hours)
  - Platform costs
  - Net ROI
  - ROI ratio
  - Payback period
- **Next Steps**: Add ROI metrics panel to the build page

### 3. Quick Email Node Creation
- **Issue**: No easy way to add email preview nodes
- **Solution**: Add button or keyboard shortcut to quickly create email nodes

### 4. Email Generation API 400 Error
- **Issue**: `/api/openai/generate-email-section` returns 400 error
- **Root Cause**: Empty string being sent as `textToRewrite` when generating new content
- **Next Steps**: 
  - Fix payload when no existing content
  - Ensure all required parameters are sent
  - Add better error messages

### 5. Type Safety Issues
- **Issue**: Multiple uses of `any` type throughout codebase
- **Found in**:
  - Email generation hooks (node arrays) - FIXED ✅
  - Scenario manager (template data, error handling) - FIXED ✅
  - Flow canvas (email preview props)
  - Backend scripts (document processing)
- **Fixes Applied**:
  - Created proper node type interface for email context extraction
  - Added TemplateData interface for scenario creation
  - Replaced all error: any with proper Error type checking
- **Remaining**: Flow canvas props and backend scripts

### 6. Pricing Data Integration
- **Collection**: `apicus-apps-prices`
- **MongoDB Schema** (Non-null fields only):
  ```typescript
  interface AppPricing {
    _id: ObjectId;
    app_id: string;
    app_name: string;
    app_slug: string;
    pricing_url: string;
    source_url: string;
    all_pricing_urls: string[];
    price_model_type: string[]; // e.g., ["subscription", "free_tier", "usage_based"]
    has_free_tier: boolean;
    has_free_trial: boolean;
    currency: string; // e.g., "USD"
    is_pricing_public: boolean;
    pricing_page_accessible: boolean;
    pricing_notes: string;
    pricing_tiers: Array<{
      tier_name: string;
      tier_description: string;
      monthly_price: number | null; // Sometimes null for enterprise tiers
      annual_price: number | null; // Sometimes null for enterprise tiers
      features: string[];
      limits: {
        users: number | "unlimited";
        custom_limits?: Array<{
          name: string;
          value: number;
        }>;
      };
    }>;
    usage_based_pricing?: Array<{
      metric_name: string;
      unit: string;
      base_price: number;
    }>;
    ai_specific_pricing: {
      has_token_based_pricing: boolean;
      has_inference_pricing: boolean;
      has_fine_tuning_pricing: boolean;
      has_training_pricing: boolean;
      ai_addon_available: boolean;
    };
    promotional_offers: Array<{
      offer_name: string;
      offer_description: string;
      offer_url: string;
    }>;
    additional_fees: any[];
    extraction_timestamp: string;
    schema_validated: boolean;
    confidence_score: number;
    extraction_error: boolean;
    json_repaired: boolean;
    original_app_metadata: {
      app_id: string;
      name: string;
      slug: string;
      description: string;
      logo_url: string;
      categories: string[];
      category_slugs: string[];
      has_actions: boolean;
      has_triggers: boolean;
      action_count: number;
      trigger_count: number;
    };
  }
  ```
- **Key Fields for Display**:
  - `app_name` - Display name of the app
  - `has_free_tier` - Show free tier badge
  - `pricing_tiers` - Extract tier names, prices, and key limits
  - `usage_based_pricing` - Show usage metrics and costs
  - `currency` - For price formatting
  - `promotional_offers` - Display active promotions
  - `original_app_metadata.logo_url` - App icon
  - `original_app_metadata.description` - App tooltip
- **Implementation**: Background fetch after template load

## UI/UX Revamp Features 🎨

### 7. Email Template Auto-Positioning
- **Feature**: Automatically position email template nodes above workflow nodes
- **Implementation**:
  - Calculate center of all workflow nodes (trigger, action, decision)
  - Position email node 150px above topmost node
  - Center align horizontally
- **Status**: Planning phase
- **UI Doc**: `/docs/email-node-ui-revamp-plan.md`

### 8. Email Context Node Chaining
- **Feature**: Allow email context nodes to form linked lists per section
- **Visual States**:
  - Unconnected: Both handles visible, pulsing glow
  - First connection: Hide connected handle, glow unconnected side
  - Chained: Context nodes connect to each other
- **Implementation**:
  - Modify connection validation for context-to-context
  - Add visual indicators for chain-ready nodes
  - Implement snapping for aligned chains
- **Status**: Design phase

### 9. Smart Node Alignment & Snapping
- **Feature**: Auto-align email context nodes when connecting
- **Specifications**:
  - 120px horizontal spacing between chained nodes
  - Snap to same Y position
  - 20px proximity threshold
- **Visual Polish**:
  - Animated edge flow for email connections
  - Glow effects on connectable sides
  - Handle transitions on connect/disconnect
- **Status**: To be implemented

### 10. Email Generation Status Indicator
- **Feature**: Show email status icon in scenario title bar
- **States**:
  - ⚡ Ready to generate (no email node)
  - 🔄 Generating (animated spinner)
  - ✅ Email present
  - 🔗 Context connected
- **Quick Actions**:
  - Generate Email button in StatsBar
  - Add Context floating button
  - Auto-arrange layout button
- **Status**: To be implemented

### 11. MongoDB Pricing Data Integration
- **Feature**: Enrich nodes with pricing information
- **Visual Elements**:
  - Pricing tier badges on nodes
  - Limit indicators in properties panel
  - Color coding by tier (free/paid/enterprise)
- **Data Flow**:
  - Fetch pricing on template load
  - Cache in node data
  - Display in tooltips and panels
- **Status**: MongoDB connection ready, UI pending

## Planned Changes 📋

### Phase 1: Fix Core Backend (Priority)
1. Debug template search API
2. Ensure MongoDB connection is stable
3. Fix data flow from server to client

### Phase 2: UI Improvements
1. Add ROI metrics display panel
2. Create quick email node generation
3. Improve canvas interaction

### Phase 3: Pricing Integration
1. Add new API endpoint for pricing data
2. Background fetch pricing for apps in workflow
3. Display pricing in node properties or separate panel

## Architecture Notes

### Data Flow
```
User Search → API → MongoDB Vector Search → Templates → Frontend → Canvas
                 ↓
            Pricing Collection (background)
```

### React 19 & Next.js 15 Optimizations
- Use `useMemo` for expensive calculations
- Leverage server components for initial data fetch
- Use `startTransition` for non-urgent updates
- Implement streaming for large template results

## Testing Checklist
- [ ] Template search returns results
- [ ] Templates load into canvas properly
- [ ] ROI metrics calculate correctly
- [ ] ROI display updates with node changes
- [ ] Email nodes can be created quickly
- [ ] Pricing data loads in background
- [ ] No console errors or warnings 