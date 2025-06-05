export const colors = {
  bg: 'hsl(0 0% 9%)',        // Matching your dark theme
  fg: 'hsl(0 0% 96%)',       // Light text
  accent: '#38bdf8',         // Tailwind sky-400
  good: '#4ade80',           // ROI positive (green)
  warn: '#fbbf24',           // ROI breakeven (yellow)
  bad: '#f87171',            // ROI negative (red)
  
  // Chart-specific colors
  text: 'hsl(0 0% 96%)',     // Text color for labels
  neutral: '#64748b',        // Neutral/muted color for grid lines
  value: '#4ade80',          // Value/positive contributions (green)
  cost: '#f87171',           // Cost/negative contributions (red)
  
  // Additional chart colors
  primary: '#8b5cf6',        // Purple for primary metrics
  secondary: '#6366f1',      // Indigo for secondary data
  muted: '#64748b',          // Slate for less important elements
  border: '#1e293b',         // Dark border color
  
  // Chart-specific gradients
  gradient: {
    good: ['#4ade80', '#22c55e'],
    warn: ['#fbbf24', '#f59e0b'],
    bad: ['#f87171', '#ef4444'],
    accent: ['#38bdf8', '#0ea5e9'],
  },
} as const; 