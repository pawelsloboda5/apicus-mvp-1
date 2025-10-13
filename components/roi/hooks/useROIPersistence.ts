/**
 * ROI Persistence Hook
 * 
 * Manages persistence of ROI configuration to scenarios/database.
 * Provides debounced updates to avoid excessive writes.
 */

import { useCallback, useRef, useEffect } from 'react';
import type { Scenario } from '@/lib/db';

export interface ROIPersistenceOptions {
  debounceMs?: number;
  onPersist?: (partial: Partial<Scenario>) => void;
}

/**
 * Hook to manage debounced persistence of ROI configuration
 */
export function useROIPersistence(options: ROIPersistenceOptions = {}) {
  const { debounceMs = 300, onPersist } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<Scenario>>({});

  // Persist immediately on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (Object.keys(pendingUpdatesRef.current).length > 0 && onPersist) {
          onPersist(pendingUpdatesRef.current);
        }
      }
    };
  }, [onPersist]);

  /**
   * Queue an update to be persisted after debounce delay
   */
  const queueUpdate = useCallback((partial: Partial<Scenario>) => {
    // Merge with pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...partial,
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (onPersist && Object.keys(pendingUpdatesRef.current).length > 0) {
        onPersist(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      }
      timeoutRef.current = null;
    }, debounceMs);
  }, [debounceMs, onPersist]);

  /**
   * Flush pending updates immediately
   */
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (onPersist && Object.keys(pendingUpdatesRef.current).length > 0) {
      onPersist(pendingUpdatesRef.current);
      pendingUpdatesRef.current = {};
    }
  }, [onPersist]);

  return {
    queueUpdate,
    flush,
  };
}
