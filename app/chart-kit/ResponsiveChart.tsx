"use client";

import { ParentSize } from '@visx/responsive';
import { ReactElement } from 'react';

interface ResponsiveChartProps {
  children: (dimensions: { width: number; height: number }) => ReactElement;
  className?: string;
  debounceTime?: number;
}

export default function ResponsiveChart({ 
  children, 
  className = "",
  debounceTime = 300 
}: ResponsiveChartProps) {
  return (
    <ParentSize 
      className={className} 
      debounceTime={debounceTime}
    >
      {({ width, height }) => {
        // Ensure we have valid dimensions before rendering
        if (width <= 0 || height <= 0) return null;
        
        return children({ width, height });
      }}
    </ParentSize>
  );
} 