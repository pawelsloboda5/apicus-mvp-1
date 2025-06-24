"use client";

import React from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { cn } from "@/lib/utils";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTrue = data?.isTrue === true;
  const isFalse = data?.isFalse === true;
  const isEmailContext = data?.isEmailContext === true;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        strokeWidth: isEmailContext ? 3 : 2,
        opacity: isEmailContext ? 0.9 : 0.8,
        strokeDasharray: isEmailContext ? "none" : "none",
      }}
      className={cn(
        "transition-all duration-200",
        "!stroke-muted-foreground/60 hover:!stroke-muted-foreground",
        isTrue && "!stroke-green-500 dark:!stroke-green-400 hover:!stroke-green-600 dark:hover:!stroke-green-300",
        isFalse && "!stroke-red-500 dark:!stroke-red-400 hover:!stroke-red-600 dark:hover:!stroke-red-300",
        isEmailContext && "!stroke-primary dark:!stroke-primary hover:!stroke-primary/80 animate-pulse"
      )}
    />
  );
} 