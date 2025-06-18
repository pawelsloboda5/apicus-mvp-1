"use client";

import { Suspense } from 'react';
import { BuildPageContent } from './components/BuildPageContent';

// Loading component for Suspense
function BuildPageLoading() {
  return (
    <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-6 text-lg text-gray-600">Loading Canvas...</p>
        <p className="mt-2 text-sm text-gray-500">Setting up your workflow builder</p>
      </div>
    </div>
  );
}

// Main page component
export default function BuildPage() {
  return (
    <Suspense fallback={<BuildPageLoading />}>
      <BuildPageContent />
    </Suspense>
  );
}