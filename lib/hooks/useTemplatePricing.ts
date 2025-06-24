import { useState, useEffect, useCallback, use, useMemo, cache } from 'react';
import { TemplatePricingResponse, AppPricingData } from '@/lib/types';

export interface UseTemplatePricingReturn {
  pricingData: Record<string, AppPricingData> | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cache the pricing fetch function using React 19's cache
const fetchTemplatePricing = cache(async (templateId: string): Promise<TemplatePricingResponse> => {
  const response = await fetch(`/api/templates/${templateId}/pricing`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch pricing data`);
  }

  return response.json();
});

// Create a resource function for use with the `use` hook
function createPricingResource(templateId: string) {
  return fetchTemplatePricing(templateId);
}

/**
 * React 19 optimized hook to fetch template pricing data
 * Uses the new `use` hook for better Suspense integration
 */
export function useTemplatePricing(templateId?: string): UseTemplatePricingReturn {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a stable resource using useMemo
  const pricingResource = useMemo(() => {
    if (!templateId) return null;
    setError(null);
    return createPricingResource(templateId);
  }, [templateId]);

  // Use the new React 19 `use` hook for automatic suspense
  const pricingData = useMemo(() => {
    if (!pricingResource) return null;
    
    try {
      const data = use(pricingResource);
      return data.appPricingMap;
    } catch (err) {
      // Handle both promise rejection and thrown errors
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch pricing data');
      }
      return null;
    }
  }, [pricingResource]);

  const refetch = useCallback(() => {
    if (!templateId) return;
    
    setIsLoading(true);
    setError(null);
    
    // Reset loading state after a brief delay
    setTimeout(() => setIsLoading(false), 100);
  }, [templateId]);

  return {
    pricingData,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fallback hook for non-Suspense contexts
 * Uses traditional async patterns for backward compatibility
 */
export function useTemplatePricingLegacy(templateId?: string): UseTemplatePricingReturn {
  const [pricingData, setPricingData] = useState<Record<string, AppPricingData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricingData = useCallback(async () => {
    if (!templateId) {
      setPricingData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTemplatePricing(templateId);
      setPricingData(data.appPricingMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setPricingData(null);
      console.error('Error fetching template pricing data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchPricingData();
  }, [fetchPricingData]);

  const refetch = useCallback(() => {
    fetchPricingData();
  }, [fetchPricingData]);

  return {
    pricingData,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Helper hook to get pricing data for specific apps from a template
 * Optimized for React 19 with Suspense support
 */
export function useAppsPricingData(templateId?: string, appIds?: string[]): UseTemplatePricingReturn & {
  appsPricing: AppPricingData[];
} {
  const { pricingData, isLoading, error, refetch } = useTemplatePricing(templateId);

  const appsPricing = useMemo(() => {
    if (!pricingData || !appIds) return [];
    
    return appIds
      .map(appId => pricingData[appId])
      .filter((pricing): pricing is AppPricingData => pricing !== undefined);
  }, [pricingData, appIds]);

  return {
    pricingData,
    isLoading,
    error,
    refetch,
    appsPricing,
  };
} 