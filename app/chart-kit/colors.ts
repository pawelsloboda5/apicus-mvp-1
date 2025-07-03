export const colors = {
  // Theme-aware colors using CSS variables
  bg: 'hsl(var(--background))',
  fg: 'hsl(var(--foreground))',
  border: 'hsl(var(--border))',
  muted: 'hsl(var(--muted))',
  neutral: 'hsl(var(--muted-foreground))',
  text: 'hsl(var(--foreground))',
  
  // Chart colors using Apicus palette (keeping brand colors consistent)
  accent: '#F15533', // apicus-orange (primary brand color)
  good: '#22c55e',   // Keep green for positive (universally understood)
  warn: '#f59e0b',   // Keep amber for warning (universally understood)
  bad: '#ef4444',    // Keep red for negative (universally understood)
  value: '#22c55e',  // Green for positive value
  cost: '#ef4444',   // Red for costs
  
  // Node type colors using Apicus palette
  trigger: '#37036A', // apicus-deep purple
  action: '#F15533',  // apicus-orange
  decision: '#F4775B', // apicus-orange 400
  group: '#79569B',   // apicus-deep purple 300
  
  // Additional colors from Apicus palette
  primary: '#F15533',   // apicus-orange
  secondary: '#37036A', // apicus-deep purple
  
  // Chart-specific gradients (can be defined later if needed)
  gradients: {},
}; 