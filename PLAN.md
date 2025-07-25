# Logo URL Integration Plan

## Overview
Add `logoUrl` support from MongoDB app documents throughout the Apicus MVP application to enhance visual appeal and app recognition.

## Implementation Details Based on Requirements

### Visual Design Decisions
- **Logo Size**: 24x24px for nodes, 32x32px for reports
- **Display**: Logos appear alongside existing type icons (PlayCircle, Sparkles, etc.)
- **Fallback**: Use existing icon system with variations (filter, search, etc.)
- **Style**: Glass-like borders with rounded theme consistency
- **Performance**: Lazy loading with React 19 features and local caching

## Phase 1: Data Layer Updates

### 1.1 Update Type Definitions
- [x] Add `logoUrl?: string` to `AppPricingData` interface in `/lib/types.ts`
- [x] Add `logoUrl?: string` to `NodeData` interface 
- [ ] Update any other relevant type definitions

### 1.2 Verify MongoDB Data
- [x] Check that apps collection documents contain `logoUrl` field (in original_app_metadata.logo_url)
- [x] Ensure pricing enrichment preserves `logoUrl` when processing data

### 1.3 Update API Routes
- [ ] Ensure `/api/templates/search` returns `logoUrl` in app data
- [ ] Update pricing endpoint to include `logoUrl`
- [ ] Verify workflow import preserves `logoUrl`

## Phase 2: Component Updates

### 2.1 PixelNode Component
- [x] Add logo display capability to PixelNode alongside type icons
- [x] Implement 24x24px logo with glass-like border
- [x] Add fallback icons for different operation types (filter, search, etc.)
- [x] Ensure logos are properly sized and styled with lazy loading

### 2.2 ROI Report Node
- [x] Display app logos in the "Applications Used" section (unique apps only)
- [x] Show logos instead of text when logoUrl is available
- [x] Use 32x32px size for report context

### 2.3 Email Generation Components
- [ ] Add logos to email HTML output (affects deliverability positively)
- [ ] Include logos in generated email templates
- [ ] Ensure proper sizing and fallback for email context

### 2.4 Node Properties Panels
- [x] Add second tab to NodePropertiesPanel for app tier control
- [x] Show app logo in properties panel header
- [x] Add pricing tier selector for each app
- [x] Include basic analytics for app usage

## Phase 3: Workflow Import

### 3.1 Import Processing
- [ ] Ensure Make.com import preserves app logos
- [ ] Map logo URLs during enrichment process
- [ ] Handle missing logos gracefully

### 3.2 Node Factory
- [ ] Update node factory to include logoUrl in node data
- [ ] Pass logoUrl when creating nodes from templates

## Phase 4: UI Enhancements

### 4.1 Visual Consistency
- [ ] Implement glass-like borders for logo containers
- [ ] Maintain rounded corners (8px radius)
- [ ] Add subtle shadow/glow effects
- [ ] Ensure proper contrast in light/dark modes

### 4.2 Performance
- [ ] Implement lazy loading using React 19's Suspense
- [ ] Cache logos locally using browser cache
- [ ] Handle failed logo loads gracefully with icon fallback
- [ ] Use Next.js Image component where applicable

## Phase 5: Testing & Polish

### 5.1 Testing
- [ ] Test with various logo formats (PNG, SVG, JPG)
- [ ] Verify fallback behavior
- [ ] Test performance with many logos
- [ ] Test email deliverability with logos

### 5.2 Documentation
- [ ] Update component documentation
- [ ] Add logoUrl to API documentation
- [ ] Create visual examples

## Implementation Order
1. Start with type definitions
2. Update PixelNode component with logos and glass borders
3. Add NodePropertiesPanel second tab for tier control
4. Update ROI Report Node unique apps section
5. Add logos to email HTML generation
6. Implement performance optimizations
7. Test and polish

## Questions to Address
1. Should we cache logos locally or always fetch from URLs?
2. What's the preferred fallback icon for missing logos?
3. Should logos be shown in email HTML output?
4. Any specific logo size requirements for different contexts? 