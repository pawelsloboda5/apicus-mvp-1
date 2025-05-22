"use client";

import React from "react";
import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";
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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTrue = data?.isTrue === true;
  const isFalse = data?.isFalse === true;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={style}
      className={cn(
        "!stroke-foreground/50",
        isTrue && "!stroke-green-500 dark:!stroke-green-400",
        isFalse && "!stroke-red-500 dark:!stroke-red-400"
      )}
    />
  );
} 