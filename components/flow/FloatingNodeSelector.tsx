"use client";

import React from "react";
import { Play, Zap, GitBranch } from "lucide-react";
import { NodeType } from "@/lib/types";

interface FloatingNodeSelectorProps {
  selectedType: NodeType;
  onTypeChange: (type: NodeType) => void;
  cursorPosition: { x: number; y: number };
  isVisible: boolean;
}

const nodeTypeConfig = {
  trigger: {
    icon: Play,
    label: "Trigger",
  },
  action: {
    icon: Zap,
    label: "Action", 
  },
  decision: {
    icon: GitBranch,
    label: "Decision",
  },
} as const;

type SelectableNodeType = keyof typeof nodeTypeConfig;

export function FloatingNodeSelector({
  selectedType,
  cursorPosition,
  isVisible,
}: FloatingNodeSelectorProps) {
  if (!isVisible) return null;

  // Only show if it's a selectable type (not 'group')
  if (!(selectedType in nodeTypeConfig)) return null;

  const config = nodeTypeConfig[selectedType as SelectableNodeType];
  const Icon = config.icon;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: cursorPosition.x + 8, // 8px to the right of cursor
        top: cursorPosition.y + 8,  // 8px below cursor
        transform: "translate3d(0, 0, 0)", // Use GPU acceleration
      }}
    >
      {/* Small blur cloud underneath */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm rounded-full scale-150 -z-10" />
      
      {/* Minimal icon with dark lines */}
      <div className="flex items-center justify-center w-6 h-6 rounded-sm border border-foreground/30 bg-background/20">
        <Icon className="w-4 h-4 text-foreground/70" />
      </div>
    </div>
  );
} 