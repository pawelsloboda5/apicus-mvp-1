"use client";

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { withTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import { NodeType } from '@/lib/types';
import ResponsiveChart from './ResponsiveChart';
import { colors } from './colors';

// Import the proper sankey types and functions
import { sankey as d3Sankey, sankeyLinkHorizontal, SankeyLink as D3SankeyLink, SankeyNode as D3SankeyNode } from 'd3-sankey';

export interface SankeyNode {
  id: string;
  name: string;
  nodeType: NodeType;
  value: number;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyChartProps {
  data: SankeyData;
  animate?: boolean;
  onNodeClick?: (nodeId: string) => void;
  highlightedNodeId?: string;
}

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '4px',
};

type TooltipData = {
  name: string;
  value: number;
  type: 'node' | 'link';
  source?: string;
  target?: string;
};

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

export const SankeyChartBase = withTooltip<SankeyChartProps, TooltipData>(
  ({
    data,
    animate = true,
    onNodeClick,
    highlightedNodeId,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  }: SankeyChartProps & WithTooltipProvidedProps<TooltipData>) => {
    const margin = { top: 10, right: 140, bottom: 10, left: 10 };

    const colorScale = scaleOrdinal({
      domain: Object.keys(nodeTypeColors),
      range: Object.values(nodeTypeColors),
    });

    // Validate data before rendering
    if (!data || !data.nodes || data.nodes.length === 0) {
      return (
        <ResponsiveChart>
          {() => (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No data available for visualization</p>
            </div>
          )}
        </ResponsiveChart>
      );
    }

    return (
      <ResponsiveChart>
        {({ width, height }) => {
          const xMax = width - margin.left - margin.right;
          const yMax = height - margin.top - margin.bottom;

          // Create the sankey generator
          const sankeyGenerator = useMemo(
            () =>
              d3Sankey<SankeyNode, SankeyLink>()
                .nodeId((d) => d.id)
                .nodeWidth(15)
                .nodePadding(10)
                .extent([[0, 0], [xMax, yMax]]),
            [xMax, yMax]
          );

          // Generate the sankey layout
          const { nodes: sankeyNodes, links: sankeyLinks } = useMemo(() => {
            const graph = {
              nodes: data.nodes.map(d => ({ ...d })),
              links: data.links.map(d => ({ ...d }))
            };
            return sankeyGenerator(graph);
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [data, sankeyGenerator]);

          // Create path generator
          const linkPath = sankeyLinkHorizontal();

          return (
            <svg width={width} height={height}>
              <Group left={margin.left} top={margin.top}>
                {/* Links */}
                {sankeyLinks.map((link, i) => {
                  const linkSourceNode = link.source as D3SankeyNode<SankeyNode, SankeyLink>;
                  const linkTargetNode = link.target as D3SankeyNode<SankeyNode, SankeyLink>;
                  const path = linkPath(link as D3SankeyLink<SankeyNode, SankeyLink>);
                  
                  return (
                    <path
                      key={`link-${i}`}
                      d={path || ''}
                      stroke={colors.neutral}
                      strokeWidth={Math.max(1, (link as D3SankeyLink<SankeyNode, SankeyLink>).width || 1)}
                      strokeOpacity={0.3}
                      fill="none"
                      className={animate ? "transition-all duration-300" : ""}
                      onMouseMove={(event) => {
                        showTooltip({
                          tooltipData: {
                            name: `${linkSourceNode.name || 'Unknown'} → ${linkTargetNode.name || 'Unknown'}`,
                            value: link.value || 0,
                            type: 'link',
                            source: linkSourceNode.name,
                            target: linkTargetNode.name,
                          },
                          tooltipTop: event.clientY,
                          tooltipLeft: event.clientX,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                    />
                  );
                })}

                {/* Nodes */}
                {sankeyNodes.map((node, i) => {
                  const sankeyNode = node as D3SankeyNode<SankeyNode, SankeyLink>;
                  const isHighlighted = highlightedNodeId === sankeyNode.id;
                  const nodeColor = sankeyNode.color || colorScale(sankeyNode.nodeType);
                  
                  return (
                    <Group key={`node-${i}`}>
                      <rect
                        x={sankeyNode.x0 || 0}
                        y={sankeyNode.y0 || 0}
                        width={(sankeyNode.x1 || 0) - (sankeyNode.x0 || 0)}
                        height={(sankeyNode.y1 || 0) - (sankeyNode.y0 || 0)}
                        fill={nodeColor}
                        fillOpacity={isHighlighted ? 1 : 0.8}
                        stroke={isHighlighted ? colors.accent : 'transparent'}
                        strokeWidth={isHighlighted ? 2 : 0}
                        rx={4}
                        className={animate ? "transition-all duration-300 cursor-pointer" : "cursor-pointer"}
                        onClick={() => onNodeClick?.(sankeyNode.id)}
                        onMouseMove={(event) => {
                          showTooltip({
                            tooltipData: {
                              name: sankeyNode.name,
                              value: sankeyNode.value,
                              type: 'node',
                            },
                            tooltipTop: event.clientY,
                            tooltipLeft: event.clientX,
                          });
                        }}
                        onMouseLeave={hideTooltip}
                      />
                      
                      {/* Node labels */}
                      <text
                        x={(sankeyNode.x1 || 0) + 6}
                        y={((sankeyNode.y0 || 0) + (sankeyNode.y1 || 0)) / 2}
                        dy="0.35em"
                        fontSize={11}
                        fill={colors.text}
                        className="select-none"
                      >
                        {sankeyNode.name}
                      </text>
                      
                      {/* Time value */}
                      <text
                        x={(sankeyNode.x1 || 0) + 6}
                        y={((sankeyNode.y0 || 0) + (sankeyNode.y1 || 0)) / 2 + 14}
                        fontSize={10}
                        fill={colors.muted}
                        className="select-none"
                      >
                        {sankeyNode.value?.toFixed(1) || '0'} min
                      </text>
                    </Group>
                  );
                })}
              </Group>

              {tooltipOpen && tooltipData && (
                <TooltipWithBounds
                  top={tooltipTop}
                  left={tooltipLeft}
                  style={tooltipStyles}
                >
                  <div>
                    <strong>{tooltipData.name}</strong>
                  </div>
                  <div>
                    Time: {tooltipData.value.toFixed(1)} minutes
                  </div>
                  {tooltipData.type === 'link' && (
                    <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
                      Flow from {tooltipData.source} to {tooltipData.target}
                    </div>
                  )}
                </TooltipWithBounds>
              )}
            </svg>
          );
        }}
      </ResponsiveChart>
    );
  }
);

export function SankeyChart(props: SankeyChartProps) {
  return <SankeyChartBase {...props} />;
} 