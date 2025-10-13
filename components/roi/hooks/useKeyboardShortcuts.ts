/**
 * Keyboard Shortcuts Hook
 * 
 * Manages keyboard shortcuts for the ROI Settings Panel.
 * Provides consistent keyboard navigation across the component.
 */

import { useEffect } from 'react';

export interface KeyboardHandlers {
  onGenerateFactors?: () => void;
  onGenerateReport?: () => void;
  onClose?: () => void;
  onQuickMode?: () => void;
}

export const KEYBOARD_SHORTCUTS = {
  'cmd+g': 'Generate AI Factors',
  'ctrl+g': 'Generate AI Factors',
  'cmd+r': 'Generate Report',
  'ctrl+r': 'Generate Report',
  'cmd+k': 'Quick Setup',
  'ctrl+k': 'Quick Setup',
  'esc': 'Close Panel',
  'escape': 'Close Panel',
} as const;

/**
 * Hook to manage keyboard shortcuts for ROI Settings Panel
 */
export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMod = e.metaKey || e.ctrlKey;
      
      // Cmd/Ctrl + G: Generate AI Factors
      if (isMod && key === 'g') {
        e.preventDefault();
        handlers.onGenerateFactors?.();
        return;
      }
      
      // Cmd/Ctrl + R: Generate Report
      if (isMod && key === 'r') {
        e.preventDefault();
        handlers.onGenerateReport?.();
        return;
      }
      
      // Cmd/Ctrl + K: Quick Setup mode
      if (isMod && key === 'k') {
        e.preventDefault();
        handlers.onQuickMode?.();
        return;
      }
      
      // Escape: Close panel
      if (key === 'escape') {
        e.preventDefault();
        handlers.onClose?.();
        return;
      }
    };

    // Only attach if panel is open (handlers will be defined)
    if (Object.keys(handlers).length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handlers]);
}
