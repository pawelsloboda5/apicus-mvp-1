"use client";

import { Suspense } from 'react';

// Import the clean, modern BuildPageContent component
import { BuildPageContent } from "@/app/build/components/BuildPageContent";

// Main component with Suspense wrapper
export default function BuildPage() {
  return (
    <div className="h-screen w-full flex flex-col bg-white">
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-lg">Loading automation canvas...</p>
        </div>
      }>
        <BuildPageContent />
      </Suspense>
    </div>
  );
}