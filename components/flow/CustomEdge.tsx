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
        strokeWidth: isEmailContext ? 6 : 2,
        opacity: isEmailContext ? 0.8 : 1,
      }}
      className={cn(
        "!stroke-foreground/50",
        isTrue && "!stroke-green-500 dark:!stroke-green-400",
        isFalse && "!stroke-red-500 dark:!stroke-red-400",
        isEmailContext && "!stroke-purple-500 dark:!stroke-purple-400 animate-pulse"
      )}
    />
  );
} 