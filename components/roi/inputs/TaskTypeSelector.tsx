/**
 * Task Type Selector Component
 * 
 * Dropdown selector for automation task types with descriptions and multipliers.
 * Auto-fills benchmark values when task type changes.
 */

"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TaskTypeOption {
  value: string;
  label: string;
  description: string;
  multiplier: number;
}

interface TaskTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: TaskTypeOption[];
  className?: string;
  disabled?: boolean;
  showMultiplier?: boolean;
  tooltip?: string;
}

export function TaskTypeSelector({
  value,
  onChange,
  options,
  className,
  disabled = false,
  showMultiplier = true,
  tooltip,
}: TaskTypeSelectorProps) {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="task-type" className="text-sm font-medium">
            Task Type
          </Label>
          
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Help for Task Type"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {showMultiplier && selectedOption && (
          <Badge variant="outline" className="text-sm">
            {selectedOption.multiplier}× value
          </Badge>
        )}
      </div>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="task-type" className="h-11">
          <SelectValue placeholder="Select a task type" />
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-sm">
          {options.map(option => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="py-3 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {showMultiplier && (
                  <Badge variant="outline" className="ml-auto shrink-0">
                    {option.multiplier}×
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedOption && (
        <p className="text-xs text-muted-foreground">
          This task type is {
            selectedOption.multiplier >= 2 ? 'highly valuable' :
            selectedOption.multiplier >= 1.5 ? 'valuable' :
            'standard'
          } for business impact
        </p>
      )}
    </div>
  );
}
