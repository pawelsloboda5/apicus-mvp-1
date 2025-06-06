"use client";

import { Arc } from '@visx/shape';
import { Group } from '@visx/group';
import { useTransition, animated } from '@react-spring/web';
import { useMemo } from 'react';
import ResponsiveChart from './ResponsiveChart';
import { colors } from './colors';

export interface RoiGaugeProps {
  ratio: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

const sizeConfig = {
  sm: { strokeWidth: 8, fontSize: 16, padding: 4 },
  md: { strokeWidth: 12, fontSize: 22, padding: 8 },
  lg: { strokeWidth: 16, fontSize: 28, padding: 12 },
};

export function RoiGauge({ 
  ratio, 
  size = 'md',
  showLabel = true,
  animate = true,
}: RoiGaugeProps) {
  const config = sizeConfig[size];
  
  // Determine color based on ratio
  const color = useMemo(() => {
    if (ratio >= 2) return colors.good;
    if (ratio >= 1) return colors.warn;
    return colors.bad;
  }, [ratio]);
  
  // Calculate percentage (capped at 5x = 500%)
  const percentage = Math.min(ratio / 5, 1);
  
  // Animation for the arc
  const transitions = useTransition(percentage, {
    from: { value: 0 },
    enter: { value: percentage },
    update: { value: percentage },
    config: { tension: 280, friction: 60 },
    immediate: !animate,
  });
  
  return (
    <ResponsiveChart className="w-full h-full">
      {({ width, height }) => {
        const radius = Math.min(width, height) / 2 - config.padding;
        const innerRadius = radius - config.strokeWidth;
        
        // Arc angles (180° gauge)
        const startAngle = Math.PI;
        const endAngle = 0;
        
        return (
          <svg width={width} height={height}>
            <Group top={height / 2} left={width / 2}>
              {/* Background arc */}
              <Arc
                innerRadius={innerRadius}
                outerRadius={radius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={colors.border}
              />
              
              {/* Animated value arc */}
              {transitions((style) => (
                <animated.g>
                  <Arc
                    innerRadius={innerRadius}
                    outerRadius={radius}
                    startAngle={startAngle}
                    endAngle={startAngle + (1 - style.value.get()) * Math.PI}
                    fill={color}
                  />
                </animated.g>
              ))}
              
              {/* Center label */}
              {showLabel && (
                <>
                  <text
                    y={0}
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize={config.fontSize}
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {ratio.toFixed(1)}×
                  </text>
                  <text
                    y={config.fontSize * 0.8}
                    textAnchor="middle"
                    fill={colors.muted}
                    fontSize={config.fontSize * 0.5}
                    dominantBaseline="middle"
                  >
                    ROI Ratio
                  </text>
                </>
              )}
            </Group>
          </svg>
        );
      }}
    </ResponsiveChart>
  );
}

// Standalone version without responsive wrapper for fixed sizes
export function RoiGaugeFixed({ 
  ratio, 
  width,
  height,
  showLabel = true,
}: RoiGaugeProps & { width: number; height: number }) {
  const config = sizeConfig.sm; // Use small size for fixed dimensions
  
  const color = useMemo(() => {
    if (ratio >= 2) return colors.good;
    if (ratio >= 1) return colors.warn;
    return colors.bad;
  }, [ratio]);
  
  const percentage = Math.min(ratio / 5, 1);
  const radius = Math.min(width, height) / 2 - config.padding;
  const innerRadius = radius - config.strokeWidth;
  
  const startAngle = Math.PI;
  const endAngle = startAngle + (1 - percentage) * Math.PI;
  
  return (
    <svg width={width} height={height}>
      <Group top={height / 2} left={width / 2}>
        {/* Background arc */}
        <Arc
          innerRadius={innerRadius}
          outerRadius={radius}
          startAngle={startAngle}
          endAngle={0}
          fill={colors.border}
        />
        
        {/* Value arc */}
        <Arc
          innerRadius={innerRadius}
          outerRadius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={color}
        />
        
        {/* Center label */}
        {showLabel && (
          <text
            y={0}
            textAnchor="middle"
            fill={colors.text}
            fontSize={config.fontSize}
            fontWeight="600"
            dominantBaseline="middle"
          >
            {ratio.toFixed(1)}×
          </text>
        )}
      </Group>
    </svg>
  );
} 