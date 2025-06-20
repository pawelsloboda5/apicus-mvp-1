"use client";

import React from "react";

export default function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center" data-loading="canvas">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="ml-4 text-lg">Loading automation canvas...</p>
    </div>
  );
} 