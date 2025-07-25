# Toolbox UI Redesign Plan

## Current Issues
1. **Scenario Management**: Delete/duplicate/create actions exist but are hidden or not intuitive
2. **Template Discovery**: No way to search for new templates within the Toolbox
3. **Layout Problems**: My Scenarios section expands infinitely, hiding Generated Emails
4. **No Fixed Heights**: Sections don't have predictable sizes, leading to poor UX

## Proposed Fixed Layout System

### Desktop Layout (300-500px width)
```
┌─────────────────────────────┐
│ Header (5% - ~40px)         │
│ [Canvas|Analytics] [Search] │
├─────────────────────────────┤
│ Email Context (25% - ~200px)│
│ ┌─────────┐ ┌─────────┐    │
│ │ Persona │ │Industry│ ... │
│ └─────────┘ └─────────┘    │
│ [↓ Show 4 more]             │
├─────────────────────────────┤
│ Basic Nodes (10% - ~80px)   │
│ [Trigger] [Action] [Decision]│
├─────────────────────────────┤
│ My Scenarios (35% - ~280px) │
│ ┌─────────────────────────┐ │
│ │ + New  Import  Search   │ │
│ ├─────────────────────────┤ │
│ │ • Scenario 1      [⋯]   │ │
│ │ • Scenario 2      [⋯]   │ │
│ │ [Scrollable area]       │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Generated Emails (20% ~160px)│
│ • Email 1                   │
│ • Email 2                   │
│ [Scrollable area]           │
├─────────────────────────────┤
│ Quick Actions (5% - ~40px)  │
│ [New Template] [Import]     │
└─────────────────────────────┘
```

### Key Design Decisions

#### 1. Fixed Height Sections
- Use CSS Grid or Flexbox with specific height allocations
- Each section has `overflow-y: auto` for internal scrolling
- Prevents any section from pushing others out of view

#### 2. Scenario Management Improvements
- **Action Bar**: Always visible at top of My Scenarios section
  - "+ New Scenario" button
  - "Import Workflow" button  
  - "Search Templates" button
- **Inline Actions**: Hover to reveal on each scenario
  - Duplicate icon
  - Edit/Rename icon
  - Delete icon
- **Bulk Actions**: Select multiple scenarios for batch operations

#### 3. Template Discovery
- Add "Search Templates" button in action bar
- Opens modal/drawer with:
  - Search input
  - Recent searches
  - Category filters
  - Results grid
- One-click to create new scenario from template

#### 4. Visual Hierarchy
- **Section Headers**: Smaller, more compact (14px font)
- **Content**: Appropriate sizing for each section
- **Spacing**: Consistent 16px padding, 8px gaps
- **Borders**: Subtle dividers between sections

#### 5. Mobile Adaptations
- Bottom sheet maintains similar section ratios
- Swipeable tabs for Email Context vs Basic Nodes
- Floating action button for quick scenario creation

### Implementation Details

#### Section Heights (assuming 800px total height)
```typescript
const sectionHeights = {
  header: '5%',      // 40px - Tabs and search
  emailContext: '25%', // 200px - Email context nodes
  basicNodes: '10%',   // 80px - Basic workflow nodes
  scenarios: '35%',    // 280px - Scenario list
  emails: '20%',       // 160px - Generated emails
  actions: '5%'        // 40px - Quick action buttons
}
```

#### Scenario Item Actions
```typescript
interface ScenarioActions {
  primary: {
    onClick: () => void; // Load scenario
  };
  secondary: [
    { icon: 'copy', label: 'Duplicate', onClick: () => void },
    { icon: 'edit', label: 'Rename', onClick: () => void },
    { icon: 'trash', label: 'Delete', onClick: () => void }
  ];
}
```

#### Template Search Modal
```typescript
interface TemplateSearchModal {
  searchInput: string;
  filters: {
    platform: 'all' | 'zapier' | 'make' | 'n8n';
    category: string[];
    sortBy: 'relevance' | 'recent' | 'popular';
  };
  results: Template[];
  onSelect: (template: Template) => void;
}
```

### Benefits
1. **Predictable Layout**: Users always know where to find each section
2. **No Hidden Content**: All sections remain visible with internal scrolling
3. **Better Discoverability**: Actions are more prominent and accessible
4. **Improved Workflow**: Can search templates without leaving the builder
5. **Scalability**: Works well with many scenarios and emails

### Migration Path
1. Add height constraints to existing sections
2. Implement internal ScrollArea components
3. Add action bar to My Scenarios section
4. Create template search modal
5. Update mobile bottom sheet with same proportions

### Accessibility Improvements
- Keyboard navigation between sections
- Clear focus indicators
- Screen reader announcements for actions
- Proper ARIA labels for all interactive elements

## Next Steps
1. Review and approve this plan
2. Implement CSS Grid layout with fixed heights
3. Add action bars and inline actions
4. Create template search functionality
5. Test on various screen sizes
6. Gather user feedback and iterate

## Specific Solutions to User Concerns

### 1. "No way to delete or duplicate scenarios"
**Current State**: Delete exists but hidden in hover state
**Solution**: 
- Always-visible action menu (⋯) on each scenario item
- Click reveals dropdown with: Duplicate, Rename, Delete
- Keyboard shortcuts: Ctrl+D (duplicate), F2 (rename), Del (delete)
- Bulk selection mode with checkboxes for multiple operations

### 2. "No way of retrieving a new template"
**Current State**: Must go back to homepage
**Solution**:
- Prominent "Search Templates" button in My Scenarios action bar
- Opens modal with:
  - Search bar with autocomplete
  - Recent/popular templates carousel
  - Filter by platform/category/apps
  - Preview before creating
- "Import from URL" option for direct template links

### 3. "My Scenarios section keeps getting longer"
**Current State**: Expands infinitely, pushes other sections down
**Solution**:
- Fixed 35% height allocation (e.g., 280px of 800px)
- Internal ScrollArea component
- Visual indicator when scrollable (shadow/fade)
- Scenario count badge in header
- Search/filter within scenarios for long lists

### 4. "Everything should always fit"
**Current State**: Variable heights cause layout shift
**Solution**:
- CSS Grid with explicit rows:
  ```css
  display: grid;
  grid-template-rows: 5% 25% 10% 35% 20% 5%;
  height: 100vh;
  overflow: hidden;
  ```
- Each section has `overflow-y: auto`
- Resizable dividers between sections (optional)
- Collapsible sections with memory of user preference

## Visual Mockup Comparison

### Before (Current Issues):
```
┌─────────────────┐
│ Email Context   │ ← Variable height
│ ...expanding... │
├─────────────────┤
│ Basic Nodes     │
├─────────────────┤
│ My Scenarios    │ ← Keeps growing
│ • Scenario 1    │
│ • Scenario 2    │
│ • Scenario 3    │
│ • Scenario 4    │
│ • Scenario 5    │
│ • ...more...    │ ← Pushes emails out
├─────────────────┤
│ Emails (hidden) │ ← Can't see!
└─────────────────┘
```

### After (Fixed Layout):
```
┌─────────────────┐
│ Tabs + Search   │ 5%
├─────────────────┤
│ Email Context   │ 25% (scrollable)
├─────────────────┤
│ Basic Nodes     │ 10%
├─────────────────┤
│ My Scenarios ▼  │ 35% (scrollable)
│ [+ New][Import] │
│ • Scenario 1 ⋯  │
│ • Scenario 2 ⋯  │
│ ↓ scroll area ↓ │
├─────────────────┤
│ Emails ▼        │ 20% (scrollable)
│ • Email 1       │
│ ↓ scroll area ↓ │
├─────────────────┤
│ [Quick Actions] │ 5%
└─────────────────┘
``` 