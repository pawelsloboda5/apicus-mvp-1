"use client";

import React from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import ResponsiveChart from './ResponsiveChart';
import { colors } from './colors';
import { NodeType } from '@/lib/types';

export interface FlowNode {
  id: string;
  name: string;
  nodeType: NodeType;
  value: number;
  position: number; // 0-based position in flow
}

export interface FlowTimeData {
  nodes: FlowNode[];
  totalTime: number;
}

interface FlowTimeChartProps {
  data: FlowTimeData;
  animate?: boolean;
  onNodeClick?: (nodeId: string) => void;
  highlightedNodeId?: string;
}

const nodeTypeColors = {
  trigger: colors.trigger,
  action: colors.action,
  decision: colors.decision,
  group: colors.group,
  // Email context nodes
  persona: colors.neutral,
  industry: colors.neutral,
  painpoint: colors.neutral,
  metric: colors.neutral,
  urgency: colors.neutral,
  socialproof: colors.neutral,
  objection: colors.neutral,
  value: colors.neutral,
};

export function FlowTimeChart({ 
  data, 
  animate = true,
  onNodeClick,
  highlightedNodeId 
}: FlowTimeChartProps) {
  const margin = { top: 20, right: 20, bottom: 60, left: 120 };

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No workflow data available</p>
      </div>
    );
  }

  return (
    <ResponsiveChart>
      {({ width, height }) => {
        const xMax = width - margin.left - margin.right;
        const yMax = height - margin.top - margin.bottom;

        // Scales
        const xScale = scaleLinear({
          domain: [0, Math.max(data.totalTime, 1)],
          range: [0, xMax],
        });

        const yScale = scaleBand({
          domain: data.nodes.map(n => n.name),
          range: [0, yMax],
          padding: 0.2,
        });

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              {/* Bars */}
              {data.nodes.map((node) => {
                const barY = yScale(node.name) || 0;
                const barHeight = yScale.bandwidth();
                const barWidth = xScale(node.value);
                const isHighlighted = highlightedNodeId === node.id;
                const nodeColor = nodeTypeColors[node.nodeType] || colors.neutral;

                return (
                  <Group key={node.id}>
                    {/* Bar */}
                    <rect
                      x={0}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill={nodeColor}
                      fillOpacity={isHighlighted ? 1 : 0.8}
                      stroke={isHighlighted ? colors.accent : 'transparent'}
                      strokeWidth={isHighlighted ? 2 : 0}
                      rx={4}
                      className={animate ? "transition-all duration-300 cursor-pointer" : "cursor-pointer"}
                      onClick={() => onNodeClick?.(node.id)}
                    />
                    
                    {/* Value label */}
                    <text
                      x={barWidth + 5}
                      y={barY + barHeight / 2}
                      dy="0.35em"
                      fontSize={12}
                      fill={colors.text}
                      fontWeight={600}
                    >
                      {node.value.toFixed(1)} min
                    </text>

                    {/* Percentage label */}
                    <text
                      x={barWidth + 5}
                      y={barY + barHeight / 2 + 14}
                      fontSize={10}
                      fill={colors.muted}
                    >
                      ({((node.value / data.totalTime) * 100).toFixed(0)}%)
                    </text>
                  </Group>
                );
              })}

              {/* Axes */}
              <AxisBottom
                top={yMax}
                scale={xScale}
                tickFormat={(value) => `${value} min`}
                tickLabelProps={() => ({
                  fill: colors.text,
                  fontSize: 11,
                  textAnchor: 'middle',
                })}
              />
              <AxisLeft
                scale={yScale}
                tickLabelProps={() => ({
                  fill: colors.text,
                  fontSize: 11,
                  textAnchor: 'end',
                  dx: '-0.25em',
                })}
              />
            </Group>
          </svg>
        );
      }}
    </ResponsiveChart>
  );
} 