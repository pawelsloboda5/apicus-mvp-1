"use client";

import React, { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  skeleton?: 'default' | 'card' | 'list' | 'canvas' | 'panel';
  className?: string;
  errorBoundary?: boolean;
}

// Optimized loading skeletons
const LoadingSkeletons = {
  default: (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
  
  card: (
    <div className="space-y-4 p-6">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  ),
  
  list: (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),
  
  canvas: (
    <div className="flex h-full w-full items-center justify-center bg-muted/20">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    </div>
  ),
  
  panel: (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  ),
};

// Error boundary component
class SuspenseErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Suspense Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <div className="text-sm font-medium text-destructive">
              Something went wrong
            </div>
            <div className="text-xs text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * React 19 optimized Suspense wrapper with enhanced loading states
 * Provides immediate fallback rendering with pre-warming as recommended in React 19
 */
export function SuspenseWrapper({
  children,
  fallback,
  skeleton = 'default',
  className,
  errorBoundary = true,
}: SuspenseWrapperProps) {
  const loadingFallback = fallback || LoadingSkeletons[skeleton];

  const content = (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <SuspenseErrorBoundary>
        <div className={cn("w-full", className)}>
          {content}
        </div>
      </SuspenseErrorBoundary>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {content}
    </div>
  );
}

/**
 * Specialized wrapper for lazy-loaded components
 * Uses React 19's enhanced code-splitting with immediate fallbacks
 */
export function LazySuspenseWrapper({
  children,
  fallback,
  className,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}) {
  return (
    <SuspenseWrapper
      fallback={fallback || LoadingSkeletons.default}
      className={className}
      errorBoundary={true}
    >
      {children}
    </SuspenseWrapper>
  );
}

/**
 * Optimized wrapper for data-fetching components
 * Integrates with React 19's use() hook and enhanced Suspense
 */
export function DataSuspenseWrapper({
  children,
  skeleton = 'card',
  className,
}: {
  children: ReactNode;
  skeleton?: keyof typeof LoadingSkeletons;
  className?: string;
}) {
  return (
    <SuspenseWrapper
      fallback={LoadingSkeletons[skeleton]}
      className={className}
      errorBoundary={true}
    >
      {children}
    </SuspenseWrapper>
  );
} 