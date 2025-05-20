"use client";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Sparkles, GitBranch, PlayCircle } from "lucide-react";
import * as React from "react";
import type { JSX } from "react";

// Map node variants to colours & icons – strictly typed keys
const variantStyles = {
  trigger: {
    bg: "bg-secondary/80",
    icon: <PlayCircle className="h-4 w-4" /> as JSX.Element,
  },
  action: {
    bg: "bg-muted",
    icon: <Sparkles className="h-4 w-4" /> as JSX.Element,
  },
  decision: {
    bg: "bg-primary/20",
    icon: <GitBranch className="h-4 w-4" /> as JSX.Element,
  },
} satisfies Record<
  "trigger" | "action" | "decision",
  { bg: string; icon: JSX.Element }
>;

export function PixelNode({ data, selected, type }: NodeProps) {
  const variant = variantStyles[(type as keyof typeof variantStyles) ?? "action"];
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
      <span className="truncate">{data?.label ?? "Node"}</span>
      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="!bg-ring" />
      <Handle type="source" position={Position.Right} className="!bg-ring" />
      {type === "decision" && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="alt"
            className="!bg-ring"
          />
        </>
      )}
    </div>
  );
} 