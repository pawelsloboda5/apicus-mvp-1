/**
 * Task Configuration Section Component
 * 
 * Handles task type selection and task multiplier display.
 * Auto-fills benchmark values when task type changes.
 */

"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { TaskTypeSelector, type TaskTypeOption } from '../inputs/TaskTypeSelector';
import { Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskConfigurationProps {
  taskType: string;
  onTaskTypeChange: (type: string) => void;
  
  taskMultiplier: number;
  
  taskTypeOptions: TaskTypeOption[];
  
  className?: string;
}

export function TaskConfiguration({
  taskType,
  onTaskTypeChange,
  taskMultiplier,
  taskTypeOptions,
  className,
}: TaskConfigurationProps) {
  const selectedTask = taskTypeOptions.find(t => t.value === taskType);

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-base font-semibold">Task Configuration</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Task Type Selection */}
        <Card className="p-4">
          <TaskTypeSelector
            value={taskType}
            onChange={onTaskTypeChange}
            options={taskTypeOptions}
            showMultiplier
            tooltip="Select the type of task this automation performs. Each task type has different value multipliers based on business impact."
          />
          
          {selectedTask && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>{selectedTask.label}</strong> tasks typically have {
                    selectedTask.multiplier >= 2 ? 'high' :
                    selectedTask.multiplier >= 1.5 ? 'elevated' :
                    'standard'
                  } business value
                </p>
              </div>
            </div>
          )}
        </Card>
        
        {/* Task Value Multiplier Display */}
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Task Value Multiplier</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress 
                  value={taskMultiplier * 33.33} 
                  className="flex-1 h-2 bg-muted [&>div]:bg-primary" 
                />
                <span className="text-sm font-bold text-primary w-8 text-right">
                  {taskMultiplier}×
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Standard</span>
                <span>Important</span>
                <span>Critical</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This multiplier adjusts the ROI calculation based on the strategic importance of the task
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
