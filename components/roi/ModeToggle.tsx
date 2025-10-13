/**
 * Mode Toggle Component
 * 
 * Switches between Quick Setup and Advanced modes for ROI configuration.
 * Provides clear visual feedback of current mode.
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export type ROIMode = 'quick' | 'advanced';

interface ModeToggleProps {
  mode: ROIMode;
  onChange: (mode: ROIMode) => void;
  className?: string;
}

export function ModeToggle({ mode, onChange, className }: ModeToggleProps) {
  return (
    <div 
      className={cn("flex gap-1 p-1 bg-muted rounded-lg", className)}
      role="tablist"
      aria-label="ROI Configuration Mode"
    >
      <button
        role="tab"
        aria-selected={mode === 'quick'}
        aria-controls="quick-setup-panel"
        onClick={() => onChange('quick')}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
          mode === 'quick'
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
        )}
      >
        Quick Setup
      </button>
      <button
        role="tab"
        aria-selected={mode === 'advanced'}
        aria-controls="advanced-settings-panel"
        onClick={() => onChange('advanced')}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
          mode === 'advanced'
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
        )}
      >
        Advanced
      </button>
    </div>
  );
}
