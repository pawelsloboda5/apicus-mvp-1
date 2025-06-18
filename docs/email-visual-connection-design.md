# Visual Email Context Connection Design

## Overview

This document outlines the design and implementation details for the Visual Email Context Connection feature, which transforms how users connect email context nodes to email template sections in Apicus.

## Problem Statement

Currently, users must:
1. Add email context nodes to the canvas
2. Click on the email template to open properties panel
3. Manually select/deselect context nodes for each section
4. Click regenerate for each section

This process is tedious and disconnected from the visual nature of the canvas.

## Solution

Enable direct visual connections between email context nodes and email template sections using React Flow's native connection system. This creates an intuitive, visual workflow where users can see exactly which context influences which email section.

## Design Principles

1. **Visual Clarity**: Connections should be immediately obvious
2. **Minimal Friction**: Drag-and-drop connections without modal dialogs
3. **Smart Defaults**: Only show regenerate buttons when needed
4. **Progressive Disclosure**: Hide complexity until needed
5. **Consistent Patterns**: Reuse existing React Flow patterns

## Technical Architecture

### 1. Node Handle Updates

#### PixelNode Changes
```typescript
// Current: Handles on top/bottom
<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} />

// New: Handles on left/right
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
```

#### Email Context Node Enhancements
- Add `isConnectedToEmail` state
- Visual indicator (glow/badge) when connected
- Color coding based on target section

### 2. EmailTemplate Section Handles

#### Main Sections (Subject, Hook, CTA, Offer)
```typescript
interface SectionHandleProps {
  sectionId: string;
  sectionHeight: number;
  connectedNodes: string[];
}

// Position calculation for centered handles
const getHandlePosition = (sectionHeight: number) => ({
  left: { x: 0, y: sectionHeight / 2 },
  right: { x: '100%', y: sectionHeight / 2 }
});
```

#### Optional Sections (PS, Testimonial, Urgency)
- Smaller handle size (8px vs 12px)
- Positioned at top of section due to limited height
- Different color to indicate optional nature

### 3. Connection System

#### Data Structure
```typescript
interface EmailSectionConnections {
  subject: {
    connectedNodeIds: string[];
    lastGeneratedWith: string[];
    hasChanges: boolean;
  };
  hook: { /* same structure */ };
  cta: { /* same structure */ };
  offer: { /* same structure */ };
  ps?: { /* same structure */ };
  testimonial?: { /* same structure */ };
  urgency?: { /* same structure */ };
}
```

#### Connection Validation
```typescript
const isValidEmailConnection = (connection: Connection) => {
  const source = nodes.find(n => n.id === connection.source);
  const target = nodes.find(n => n.id === connection.target);
  
  // Email context nodes can connect to email template sections
  if (source?.data.isEmailContext && target?.type === 'emailPreview') {
    return true;
  }
  
  // Prevent other connections
  return false;
};
```

### 4. Regenerate Button System

#### Dynamic Button Node
```typescript
interface RegenerateButtonNode {
  id: string;
  type: 'regenerateButton';
  position: { x: number; y: number };
  data: {
    targetSection: string;
    connectedNodes: string[];
    onClick: () => void;
  };
}
```

#### Positioning Algorithm
```typescript
const calculateRegenerateButtonPosition = (
  emailNode: Node,
  sectionId: string,
  connectedNodes: Node[]
) => {
  // Find leftmost connected node
  const leftmostNode = connectedNodes.reduce((min, node) => 
    node.position.x < min.position.x ? node : min
  );
  
  // Position 10px to the left
  return {
    x: leftmostNode.position.x - 60, // Button width + spacing
    y: leftmostNode.position.y + (leftmostNode.height || 40) / 2
  };
};
```

## User Experience Flow

### Connecting Context to Sections

1. **Drag Connection**: User drags from email context node's right handle
2. **Visual Feedback**: Valid target sections highlight with pulsing border
3. **Drop Connection**: User drops on section handle
4. **Immediate Update**: 
   - Connection line appears
   - Section shows connected indicator
   - Regenerate button fades in

### Regenerating Content

1. **Change Detection**: System detects connection changes
2. **Button Appearance**: Regenerate button smoothly animates in
3. **Click to Generate**: User clicks regenerate
4. **Loading State**: Button shows spinner, section shows loading
5. **Content Update**: New content fades in, button fades out

### Managing Connections

1. **View Connections**: Hover over section to highlight all connections
2. **Remove Connection**: Click connection line and press Delete
3. **Bulk Operations**: Select multiple context nodes and connect at once

## Visual Design

### Color Scheme
```css
/* Section states */
.email-section {
  --idle: var(--muted);
  --hover: var(--primary-foreground);
  --connected: var(--primary);
  --generating: var(--warning);
}

/* Handle styling */
.email-handle {
  --size: 12px;
  --color: var(--primary);
  --hover-scale: 1.2;
}

/* Connection lines */
.email-connection {
  --stroke: var(--primary);
  --stroke-width: 2px;
  --opacity: 0.8;
}
```

### Animation Timing
```css
/* Smooth transitions */
.regenerate-button {
  transition: opacity 200ms ease-out,
              transform 200ms ease-out;
}

.section-highlight {
  transition: border-color 150ms ease-in-out,
              background-color 150ms ease-in-out;
}
```

## UI/UX Bug Fixes

### Handle Visibility Issues

**Problem**: Connection handles on EmailPreviewNode are too small (12px) and clipped by the email content, making them hard to see and interact with. Additionally, handles are only on the left side.

**Solution Implemented**:
1. **Increased Handle Size**: Changed from 20px to 24px for better visibility
2. **Fixed Handle Positioning**: Handles now extend 12px outside the node bounds (-12px offset)
3. **Added Both Sides**: Handles are present on both left AND right sides as designed
4. **Enhanced Visual Styling**: 
   - Larger shadow for better contrast
   - Stronger hover effects with scale transform
   - Higher z-index (50) to ensure they appear above all content
5. **CSS Overrides**: Added global CSS to override React Flow's default overflow clipping

```css
/* React Flow Email Node Handle Overrides */
.react-flow__node-emailPreview {
  overflow: visible !important;
}

.react-flow__node-emailPreview .react-flow__handle {
  width: 24px !important;
  height: 24px !important;
  border: 3px solid !important;
  z-index: 50 !important;
}

/* Position handles outside node bounds */
.react-flow__node-emailPreview .react-flow__handle-left {
  left: -12px !important;
}

.react-flow__node-emailPreview .react-flow__handle-right {
  right: -12px !important;
}
```

### Regenerate Button Implementation

**Problem**: Regenerate buttons weren't appearing when email context nodes were connected to sections.

**Solution Implemented**:
1. **External Button System**: Created `FloatingRegenerateButtons` component in FlowCanvas
2. **Smart Positioning**: Buttons appear 10px above the leftmost connected email context node
3. **Dynamic Rendering**: Buttons only show for sections with active connections
4. **Visual Design**:
   - Orange background for high visibility
   - Pulse animation to draw attention
   - Clear labeling with section name
5. **Canvas-Level Integration**: Buttons are rendered at the canvas level, not inside the email node

```typescript
// FloatingRegenerateButtons component
const buttonPosition = {
  x: leftmostNode.position.x + 75, // Center of node
  y: leftmostNode.position.y - 10   // 10px above node
};
```

**Results**:
- Handles are now clearly visible and extend beyond node boundaries
- Both left and right handles work for all sections
- Regenerate buttons appear automatically when connections are made
- Visual feedback is clear with pulsing animations
- System works entirely through visual canvas interactions

## Implementation Phases

### Phase 2: Core Features (Week 2)
- Connection tracking system
- Regenerate button logic
- Change detection

### Phase 3: Polish (Week 3)
- Animations and transitions
- Visual feedback systems
- Edge case handling

## Performance Considerations

1. **Connection Rendering**: Use React Flow's built-in edge rendering
2. **Change Detection**: Debounce connection changes (300ms)
3. **Button Updates**: Use React transitions for smooth animations
4. **State Management**: Keep connection state in EmailPreviewNode data

## Accessibility

1. **Keyboard Support**: Tab to handles, Enter to connect
2. **Screen Readers**: Announce connection status changes
3. **Color Contrast**: Ensure handles meet WCAG AA standards
4. **Focus Indicators**: Clear focus rings on interactive elements

## Testing Strategy

1. **Unit Tests**: Connection validation logic
2. **Integration Tests**: Full connection flow
3. **Visual Tests**: Screenshot comparisons
4. **Performance Tests**: Handle 50+ connections smoothly

## Future Enhancements

1. **Connection Presets**: Save common context combinations
2. **Bulk Regeneration**: Regenerate all changed sections at once
3. **Connection Templates**: Pre-defined context patterns
4. **AI Suggestions**: Recommend context based on content

## Success Metrics

1. **Time to Connect**: < 2 seconds per connection
2. **Error Rate**: < 5% invalid connection attempts
3. **User Satisfaction**: 90%+ prefer visual connections
4. **Performance**: No lag with 20+ connections 