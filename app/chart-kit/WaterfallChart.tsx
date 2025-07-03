"use client";

import React from 'react';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear } from '@visx/scale';
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import ResponsiveChart from './ResponsiveChart';
import { colors } from './colors';

export interface WaterfallDataPoint {
  label: string;
  value: number;
  start: number;
  end: number;
  category: 'value' | 'cost' | 'total';
  color?: string;
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  animate?: boolean;
}



const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  border: '1px solid hsl(var(--border))',
  padding: '8px 12px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
};

type TooltipData = WaterfallDataPoint;

export const WaterfallChartBase = withTooltip<WaterfallChartProps, TooltipData>(
  ({
    data,
    animate = true,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  }: WaterfallChartProps & WithTooltipProvidedProps<TooltipData>) => {
    const margin = { top: 20, right: 20, bottom: 60, left: 80 };

    return (
      <ResponsiveChart>
        {({ width, height }) => {
          const xMax = width - margin.left - margin.right;
          const yMax = height - margin.top - margin.bottom;

          const xScale = scaleBand<string>({
            domain: data.map(d => d.label),
            padding: 0.2,
            range: [0, xMax],
          });

          const maxValue = Math.max(...data.map(d => Math.max(d.end, d.start)));
          const minValue = Math.min(...data.map(d => Math.min(d.end, d.start)));
          
          const yScale = scaleLinear<number>({
            domain: [Math.min(0, minValue), maxValue],
            range: [yMax, 0],
            nice: true,
          });

          const getCategoryColor = (category: 'value' | 'cost' | 'total') => {
            switch (category) {
              case 'value':
                return colors.value;
              case 'cost':
                return colors.cost;
              case 'total':
                return colors.accent;
              default:
                return colors.neutral;
            }
          };

          return (
            <svg width={width} height={height}>
              <Group left={margin.left} top={margin.top}>
                {/* Bars */}
                {data.map((d, i) => {
                  const barHeight = Math.abs(yScale(d.end) - yScale(d.start));
                  const barY = Math.min(yScale(d.start), yScale(d.end));
                  const barX = xScale(d.label) || 0;
                  const barWidth = xScale.bandwidth();
                  const isPositive = d.value >= 0;

                  return (
                    <Group key={`bar-${i}`}>
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={d.color || getCategoryColor(d.category)}
                        fillOpacity={0.8}
                        rx={4}
                        className={animate ? "transition-all duration-500" : ""}
                        onMouseLeave={() => hideTooltip()}
                        onMouseMove={(event) => {
                          const eventSvgCoords = { x: event.clientX, y: event.clientY };
                          showTooltip({
                            tooltipData: d,
                            tooltipTop: eventSvgCoords.y,
                            tooltipLeft: eventSvgCoords.x,
                          });
                        }}
                      />
                      
                      {/* Connecting lines */}
                      {i < data.length - 1 && (
                        <line
                          x1={barX + barWidth}
                          y1={yScale(d.end)}
                          x2={xScale(data[i + 1].label) || 0}
                          y2={yScale(data[i + 1].start)}
                          stroke={colors.neutral}
                          strokeWidth={1}
                          strokeDasharray="3,3"
                          opacity={0.5}
                        />
                      )}
                      
                      {/* Value labels */}
                      <text
                        x={barX + barWidth / 2}
                        y={barY + (isPositive ? -5 : barHeight + 15)}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize={12}
                        fontWeight={600}
                      >
                        ${Math.abs(d.value).toLocaleString()}
                      </text>
                    </Group>
                  );
                })}

                {/* Zero line */}
                <line
                  x1={0}
                  x2={xMax}
                  y1={yScale(0)}
                  y2={yScale(0)}
                  stroke={colors.neutral}
                  strokeWidth={2}
                />

                {/* X axis */}
                <AxisBottom
                  top={yMax}
                  scale={xScale}
                  tickLabelProps={() => ({
                    fill: colors.text,
                    fontSize: 11,
                    textAnchor: 'middle',
                    dy: '0.25em',
                  })}
                />

                {/* Y axis */}
                <AxisLeft
                  scale={yScale}
                  tickFormat={(value) => `$${value}`}
                  tickLabelProps={() => ({
                    fill: colors.text,
                    fontSize: 11,
                    textAnchor: 'end',
                    dx: '-0.25em',
                    dy: '0.25em',
                  })}
                />
              </Group>

              {tooltipOpen && tooltipData && (
                <Tooltip
                  top={tooltipTop}
                  left={tooltipLeft}
                  style={tooltipStyles}
                >
                  <div>
                    <strong>{tooltipData.label}</strong>
                  </div>
                  <div>
                    Value: ${Math.abs(tooltipData.value).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
                    {tooltipData.value >= 0 ? 'Positive impact' : 'Cost'}
                  </div>
                </Tooltip>
              )}
            </svg>
          );
        }}
      </ResponsiveChart>
    );
  }
);

export function WaterfallChart(props: WaterfallChartProps) {
  return <WaterfallChartBase {...props} />;
} 