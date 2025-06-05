"use client";

import React from 'react';
import { LinePath, AreaClosed } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { extent, max } from 'd3-array';
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import ResponsiveChart from './ResponsiveChart';
import { colors } from './colors';

interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

interface TrendChartProps {
  data: DataPoint[];
  showArea?: boolean;
  animate?: boolean;
  color?: string;
}

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '4px',
};

type TooltipData = DataPoint;

// Accessors
const getDate = (d: DataPoint) => d.date;
const getValue = (d: DataPoint) => d.value;
const bisectDate = bisector<DataPoint, Date>(getDate).left;

export const TrendChartBase = withTooltip<TrendChartProps, TooltipData>(
  ({
    data,
    showArea = true,
    animate = true,
    color = colors.accent,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  }: TrendChartProps & WithTooltipProvidedProps<TooltipData>) => {
    const margin = { top: 20, right: 20, bottom: 60, left: 80 };

    return (
      <ResponsiveChart>
        {({ width, height }) => {
          const xMax = width - margin.left - margin.right;
          const yMax = height - margin.top - margin.bottom;

          // Scales
          const dateScale = scaleTime({
            range: [0, xMax],
            domain: extent(data, getDate) as [Date, Date],
          });

          const valueScale = scaleLinear({
            range: [yMax, 0],
            domain: [0, max(data, getValue) || 0],
            nice: true,
          });

          // Handle tooltip
          const handleTooltip = (
            event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
          ) => {
            const { x } = localPoint(event) || { x: 0 };
            const x0 = dateScale.invert(x - margin.left);
            const index = bisectDate(data, x0, 1);
            const d0 = data[index - 1];
            const d1 = data[index];
            let d = d0;
            if (d1 && getDate(d1)) {
              d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
            }
            showTooltip({
              tooltipData: d,
              tooltipLeft: x,
              tooltipTop: valueScale(getValue(d)) + margin.top,
            });
          };

          return (
            <svg width={width} height={height}>
              <Group left={margin.left} top={margin.top}>
                {/* Grid */}
                <GridRows
                  scale={valueScale}
                  width={xMax}
                  strokeDasharray="3,3"
                  stroke={colors.neutral}
                  opacity={0.3}
                />
                <GridColumns
                  scale={dateScale}
                  height={yMax}
                  strokeDasharray="3,3"
                  stroke={colors.neutral}
                  opacity={0.3}
                />

                {/* Area */}
                {showArea && (
                  <AreaClosed<DataPoint>
                    data={data}
                    x={(d) => dateScale(getDate(d)) ?? 0}
                    y={(d) => valueScale(getValue(d)) ?? 0}
                    yScale={valueScale}
                    strokeWidth={0}
                    fill={color}
                    fillOpacity={0.1}
                    curve={curveMonotoneX}
                    className={animate ? "transition-all duration-500" : ""}
                  />
                )}

                {/* Line */}
                <LinePath<DataPoint>
                  data={data}
                  x={(d) => dateScale(getDate(d)) ?? 0}
                  y={(d) => valueScale(getValue(d)) ?? 0}
                  stroke={color}
                  strokeWidth={2}
                  curve={curveMonotoneX}
                  className={animate ? "transition-all duration-500" : ""}
                />

                {/* Dots */}
                {data.map((d, i) => (
                  <circle
                    key={`dot-${i}`}
                    cx={dateScale(getDate(d))}
                    cy={valueScale(getValue(d))}
                    r={4}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="white"
                    strokeWidth={2}
                    className={animate ? "transition-all duration-300" : ""}
                  />
                ))}

                {/* Axes */}
                <AxisBottom
                  top={yMax}
                  scale={dateScale}
                  numTicks={width > 520 ? 10 : 5}
                  tickLabelProps={() => ({
                    fill: colors.text,
                    fontSize: 11,
                    textAnchor: 'middle',
                  })}
                />
                <AxisLeft
                  scale={valueScale}
                  tickFormat={(value) => `$${value}`}
                  tickLabelProps={() => ({
                    fill: colors.text,
                    fontSize: 11,
                    textAnchor: 'end',
                    dx: '-0.25em',
                    dy: '0.25em',
                  })}
                />

                {/* Tooltip trigger */}
                <rect
                  width={xMax}
                  height={yMax}
                  fill="transparent"
                  onTouchStart={handleTooltip}
                  onTouchMove={handleTooltip}
                  onMouseMove={handleTooltip}
                  onMouseLeave={() => hideTooltip()}
                />

                {/* Tooltip indicator line */}
                {tooltipData && (
                  <g>
                    <line
                      x1={dateScale(getDate(tooltipData))}
                      x2={dateScale(getDate(tooltipData))}
                      y1={0}
                      y2={yMax}
                      stroke={colors.neutral}
                      strokeWidth={1}
                      strokeDasharray="3,3"
                      pointerEvents="none"
                    />
                    <circle
                      cx={dateScale(getDate(tooltipData))}
                      cy={valueScale(getValue(tooltipData))}
                      r={6}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      pointerEvents="none"
                    />
                  </g>
                )}
              </Group>

              {tooltipOpen && tooltipData && (
                <Tooltip
                  top={tooltipTop}
                  left={tooltipLeft}
                  style={tooltipStyles}
                >
                  <div>
                    <strong>{tooltipData.date.toLocaleDateString()}</strong>
                  </div>
                  <div>
                    ROI: ${tooltipData.value.toLocaleString()}
                  </div>
                  {tooltipData.label && (
                    <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
                      {tooltipData.label}
                    </div>
                  )}
                </Tooltip>
              )}
            </svg>
          );
        }}
      </ResponsiveChart>
    );
  }
);

export function TrendChart(props: TrendChartProps) {
  return <TrendChartBase {...props} />;
} 