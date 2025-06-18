"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmailContextNode {
  id: string;
  type: string;
  label: string;
  value: string | string[];
}

interface EmailContextSelectorProps {
  emailContextNodes: EmailContextNode[];
  selectedContextNodes: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
}

const nodeTypeColors: Record<string, string> = {
  persona: 'text-purple-600 dark:text-purple-400',
  industry: 'text-blue-600 dark:text-blue-400',
  painpoint: 'text-red-600 dark:text-red-400',
  metric: 'text-green-600 dark:text-green-400',
  urgency: 'text-orange-600 dark:text-orange-400',
  socialproof: 'text-cyan-600 dark:text-cyan-400',
  objection: 'text-amber-600 dark:text-amber-400',
  value: 'text-emerald-600 dark:text-emerald-400',
};

export function EmailContextSelector({
  emailContextNodes,
  selectedContextNodes,
  onSelectionChange,
}: EmailContextSelectorProps) {
  if (!emailContextNodes || emailContextNodes.length === 0) {
    return null;
  }

  const handleNodeToggle = (nodeId: string, checked: boolean) => {
    const newSelection = new Set(selectedContextNodes);
    if (checked) {
      newSelection.add(nodeId);
    } else {
      newSelection.delete(nodeId);
    }
    onSelectionChange(newSelection);
  };

  const toggleAll = () => {
    if (selectedContextNodes.size === emailContextNodes.length) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all
      const allNodeIds = new Set(emailContextNodes.map(n => n.id));
      onSelectionChange(allNodeIds);
    }
  };

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Email Context to Include
          </Label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>{selectedContextNodes.size} selected</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Select which context elements to use when generating email content
        </p>

        <div className="flex justify-end mb-2">
          <button
            onClick={toggleAll}
            className="text-xs text-primary hover:underline"
          >
            {selectedContextNodes.size === emailContextNodes.length 
              ? 'Deselect All' 
              : 'Select All'}
          </button>
        </div>
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
          {emailContextNodes.map((node) => {
            const isSelected = selectedContextNodes.has(node.id);
            const displayValue = Array.isArray(node.value) 
              ? node.value.join(', ') 
              : node.value;
            
            return (
              <label
                key={node.id}
                className="flex items-start space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleNodeToggle(node.id, !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium capitalize",
                      nodeTypeColors[node.type] || 'text-foreground'
                    )}>
                      {node.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {node.label}
                    </span>
                  </div>
                  {displayValue && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayValue}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 