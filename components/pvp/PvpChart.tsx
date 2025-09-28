'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PvpChartProps {
  creatorData: number[];
  opponentData: number[];
  creatorCoin: string;
  opponentCoin: string;
  creatorEmoji: string;
  opponentEmoji: string;
  timeLeft: number;
}

export const PvpChart: React.FC<PvpChartProps> = ({
  creatorData,
  opponentData,
  creatorCoin,
  opponentCoin,
  creatorEmoji,
  opponentEmoji,
  timeLeft
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('PvpChart render with data:', {
      creatorData: { length: creatorData.length, data: creatorData.slice(-3) },
      opponentData: { length: opponentData.length, data: opponentData.slice(-3) },
      creatorCoin,
      opponentCoin
    });
  }, [creatorData.length, opponentData.length, creatorCoin, opponentCoin]);
  // Calculate chart dimensions and scaling
  const chartWidth = 100; // percentage
  const chartHeight = 200; // px
  const maxDataPoints = 20;

  // Combine all data to find min/max for scaling
  const allValues = [...creatorData, ...opponentData].filter(v => v !== undefined && v !== null && !isNaN(v));

  let yMin = -0.01; // Start with smaller default range for better visibility
  let yMax = 0.01;

  if (allValues.length > 0) {
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const dataRange = Math.abs(maxValue - minValue);

    if (dataRange > 0) {
      // Use actual data range with generous padding
      const padding = Math.max(dataRange * 0.5, 0.005); // 50% padding or minimum 0.005
      yMin = minValue - padding;
      yMax = maxValue + padding;
    } else {
      // If all values are the same, create a small range around that value
      const centerValue = allValues[0];
      const smallRange = Math.max(Math.abs(centerValue) * 0.1, 0.005);
      yMin = centerValue - smallRange;
      yMax = centerValue + smallRange;
    }

    // Ensure minimum range for visibility of small changes
    const finalRange = Math.max(yMax - yMin, 0.01); // Minimum 0.01% range
    const center = (yMax + yMin) / 2;
    yMax = center + finalRange / 2;
    yMin = center - finalRange / 2;
  }

  // Helper function to convert data point to SVG coordinates
  const dataToSvgY = (value: number) => {
    const normalized = (value - yMin) / (yMax - yMin);
    return chartHeight - (normalized * chartHeight);
  };

  const dataToSvgX = (index: number, arrayLength: number) => {
    if (arrayLength <= 1) return 0;
    return (index / (arrayLength - 1)) * chartWidth;
  };

  // Create path strings for both lines
  const createPath = (data: number[]) => {
    if (data.length === 0) return '';

    const points = data.map((value, index) => {
      const x = dataToSvgX(index, data.length);
      const y = dataToSvgY(value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return points;
  };

  const creatorPath = createPath(creatorData);
  const opponentPath = createPath(opponentData);

  // Get current values
  const creatorCurrent = creatorData.length > 0 ? creatorData[creatorData.length - 1] : 0;
  const opponentCurrent = opponentData.length > 0 ? opponentData[opponentData.length - 1] : 0;

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Live Performance Chart</h3>
        <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded-full">
          <span className="text-lg font-bold">{timeLeft}s</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border">
        {/* Chart SVG */}
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="absolute inset-0"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="20" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Zero line */}
            {yMin < 0 && yMax > 0 && (
              <line
                x1="0"
                y1={dataToSvgY(0)}
                x2={chartWidth}
                y2={dataToSvgY(0)}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.7"
              />
            )}

            {/* Creator line glow effect */}
            {creatorData.length >= 1 && creatorPath && (
              <>
                <path
                  d={creatorPath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  filter="blur(2px)"
                />
                <path
                  d={creatorPath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                />
              </>
            )}

            {/* Opponent line glow effect */}
            {opponentData.length >= 1 && opponentPath && (
              <>
                <path
                  d={opponentPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  filter="blur(2px)"
                />
                <path
                  d={opponentPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                />
              </>
            )}

            {/* Current position dots */}
            {creatorData.length > 0 && (
              <circle
                cx={dataToSvgX(creatorData.length - 1, creatorData.length)}
                cy={dataToSvgY(creatorCurrent)}
                r="4"
                fill="#f97316"
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-md"
              />
            )}

            {opponentData.length > 0 && (
              <circle
                cx={dataToSvgX(opponentData.length - 1, opponentData.length)}
                cy={dataToSvgY(opponentCurrent)}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-md"
              />
            )}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground -ml-16 py-2">
            <span>{yMax >= 0 ? '+' : ''}{yMax.toFixed(4)}%</span>
            <span>{((yMax + yMin) / 2) >= 0 ? '+' : ''}{((yMax + yMin) / 2).toFixed(4)}%</span>
            <span>{yMin >= 0 ? '+' : ''}{yMin.toFixed(4)}%</span>
          </div>
        </div>

        {/* Progress indicators showing data points */}
        <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
          <span>Start</span>
          <span>{Math.max(creatorData.length, opponentData.length)}/{maxDataPoints} data points</span>
          <span>End</span>
        </div>
      </div>

      {/* Legend with current values */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{creatorEmoji}</span>
            <div>
              <div className="font-semibold text-orange-800">{creatorCoin}</div>
              <div className="text-xs text-orange-600">Creator</div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-lg font-bold",
              creatorCurrent >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {creatorCurrent >= 0 ? '+' : ''}{creatorCurrent.toFixed(4)}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{opponentEmoji}</span>
            <div>
              <div className="font-semibold text-blue-800">{opponentCoin}</div>
              <div className="text-xs text-blue-600">Opponent</div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-lg font-bold",
              opponentCurrent >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {opponentCurrent >= 0 ? '+' : ''}{opponentCurrent.toFixed(4)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};