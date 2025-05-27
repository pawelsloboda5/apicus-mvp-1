"use client";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Sparkles, GitBranch, PlayCircle } from "lucide-react";
import * as React from "react";
import type { ReactNode } from "react";

// Map node variants to colours & icons – strictly typed keys
type PixelNodeType = "trigger" | "action" | "decision";

const variantStyles = {
  trigger: {
    bg: "bg-secondary/80",
    icon: <PlayCircle className="h-4 w-4" /> as ReactNode,
  },
  action: {
    bg: "bg-muted",
    icon: <Sparkles className="h-4 w-4" /> as ReactNode,
  },
  decision: {
    bg: "bg-primary/20",
    icon: <GitBranch className="h-4 w-4" /> as ReactNode,
  },
} satisfies Record<PixelNodeType, { bg: string; icon: ReactNode }>;

export function PixelNode({ data, selected, type }: NodeProps) {
  const variant = variantStyles[(type as PixelNodeType) ?? "action"];
  return (
    <div
      className={cn(
        "min-w-[96px] rounded-sm border text-xs font-mono shadow-sm",
        "flex items-center gap-1 px-2 py-1",
        variant.bg,
        selected && "ring-2 ring-ring"
      )}
    >
      {variant.icon}
      <span className="truncate">{(data?.label as string) ?? "Node"}</span>
      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="!bg-ring" />
      
      {type === "decision" ? (
        <>
          {/* True path - right handle */}
          <div className="absolute right-0 top-0 flex items-center justify-end h-full pr-[3px]">
            <span className="text-[9px] text-green-600 dark:text-green-400 mr-1">True</span>
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              className="!bg-green-500 dark:!bg-green-400"
            />
          </div>
          
          {/* False path - bottom handle */}
          <div className="absolute bottom-0 left-0 flex flex-col items-center justify-center w-full pb-[3px]">
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              className="!bg-red-500 dark:!bg-red-400"
            />
            <span className="text-[9px] text-red-600 dark:text-red-400 mt-1">False</span>
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="!bg-ring" />
      )}
    </div>
  );
} 