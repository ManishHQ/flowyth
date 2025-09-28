'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getUserAvatar, shortenAddress } from '@/lib/utils/avatar';
import { motion } from 'framer-motion';

interface GameRaceTrackProps {
  creatorData: number[];
  opponentData: number[];
  creatorWallet: string;
  opponentWallet: string;
  creatorCoin: string;
  opponentCoin: string;
  timeLeft: number;
}

export const GameRaceTrack: React.FC<GameRaceTrackProps> = ({
  creatorData,
  opponentData,
  creatorWallet,
  opponentWallet,
  creatorCoin,
  opponentCoin,
  timeLeft
}) => {
  // Calculate smart auto-scaling Y-axis with dynamic zero line (from UI prototype)
  const allValues = [...creatorData, ...opponentData].filter(v => v !== undefined && v !== null);

  let yMin = -0.05, yMax = 0.05; // Default scale

  if (allValues.length > 0) {
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const dataRange = maxValue - minValue;

    // Smart padding (20% of range, minimum 0.01%)
    const padding = Math.max(dataRange * 0.2, 0.01);
    const tempYMin = minValue - padding;
    const tempYMax = maxValue + padding;

    // Ensure minimum range for visibility
    const finalRange = Math.max(tempYMax - tempYMin, 0.02);
    const center = (tempYMax + tempYMin) / 2;
    yMax = center + finalRange / 2;
    yMin = center - finalRange / 2;
  }

  // Calculate where 0% should be positioned
  const zeroNormalized = (0 - yMin) / (yMax - yMin);
  const zeroPosition = 95 - (zeroNormalized * 90);
  const isZeroVisible = zeroPosition >= 5 && zeroPosition <= 95;

  // Create smooth curve path using quadratic bezier curves
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      if (i === 1) {
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
      } else {
        const next = points[i + 1];
        if (next) {
          const controlX = curr.x;
          const controlY = curr.y;
          const endX = (curr.x + next.x) / 2;
          const endY = (curr.y + next.y) / 2;
          path += ` Q ${controlX} ${controlY} ${endX} ${endY}`;
        } else {
          path += ` Q ${curr.x} ${curr.y} ${curr.x} ${curr.y}`;
        }
      }
    }
    return path;
  };

  // Get current values for display
  const creatorCurrent = creatorData.length > 0 ? creatorData[creatorData.length - 1] : 0;
  const opponentCurrent = opponentData.length > 0 ? opponentData[opponentData.length - 1] : 0;

  return (
    <div className="space-y-4">
      {/* Race Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">🏁 Avatar Racing Track</h3>
        <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded-full">
          <span className="text-lg font-bold">{timeLeft}s</span>
        </div>
      </div>

      {/* Racing Track */}
      <div className="relative h-64 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg overflow-hidden">
        {/* Track Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        {/* Zone Backgrounds */}
        {/* Positive Zone */}
        {yMax > 0 && (
          <div
            className="absolute left-0 right-0 bg-green-100 dark:bg-green-900/30 opacity-30"
            style={{
              top: '5%',
              height: isZeroVisible ? `${Math.max(zeroPosition - 5, 0)}%` : '45%'
            }}
          ></div>
        )}
        <span className="absolute left-2 top-2 text-xs text-success-readable bg-background bg-opacity-80 px-1 rounded">
          +{(yMax * 100).toFixed(3)}%
        </span>

        {/* Negative Zone */}
        {yMin < 0 && (
          <div
            className="absolute left-0 right-0 bg-red-100 dark:bg-red-900/30 opacity-30"
            style={{
              bottom: '5%',
              height: isZeroVisible ? `${Math.max(95 - zeroPosition, 0)}%` : '45%'
            }}
          ></div>
        )}
        <span className="absolute left-2 bottom-2 text-xs text-error-readable bg-background bg-opacity-80 px-1 rounded">
          {(yMin * 100).toFixed(3)}%
        </span>

        {/* Dynamic Zero Line */}
        {isZeroVisible && (
          <>
            <div
              className="absolute left-0 right-0 h-0.5 bg-gray-400 transform -translate-y-1/2 z-10"
              style={{ top: `${zeroPosition}%` }}
            ></div>
            <span
              className="absolute left-2 transform -translate-y-1/2 text-xs bg-background bg-opacity-90 px-1 rounded font-medium z-10"
              style={{ top: `${zeroPosition}%` }}
            >
              0%
            </span>
          </>
        )}

        {/* Racing Avatars and Curves */}
        {[
          { data: creatorData, wallet: creatorWallet, coin: creatorCoin, color: '#FB923C', index: 0 },
          { data: opponentData, wallet: opponentWallet, coin: opponentCoin, color: '#3B82F6', index: 1 }
        ].filter((player) => player.wallet && player.wallet.trim() !== '').map((player) => {
          // Convert data to smooth curve points
          const curvePoints = player.data.map((value, idx) => {
            const x = 15 + (idx / Math.max(19, 1)) * 70;
            const normalizedY = (value - yMin) / (yMax - yMin);
            const y = 95 - (normalizedY * 90);
            return { x, y };
          });

          const smoothPath = createSmoothPath(curvePoints);

          // Calculate avatar position
          let avatarX, avatarY;
          if (player.data.length > 0) {
            avatarX = 15 + ((player.data.length - 1) / Math.max(19, 1)) * 70;
            const lastValue = player.data[player.data.length - 1];
            const normalizedY = (lastValue - yMin) / (yMax - yMin);
            avatarY = 95 - (normalizedY * 90);
          } else {
            avatarX = 15;
            avatarY = 50; // Center
          }

          const currentChange = player.data.length > 0 ? player.data[player.data.length - 1] : 0;

          return (
            <div key={player.wallet}>
              {/* Smooth Curve Path */}
              {player.data.length > 1 && smoothPath && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`gradient-${player.index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={player.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={player.color} stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <path
                    d={smoothPath}
                    fill="none"
                    stroke={player.color}
                    strokeWidth="0.8"
                    opacity="0.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Glow effect */}
                  <path
                    d={smoothPath}
                    fill="none"
                    stroke={`url(#gradient-${player.index})`}
                    strokeWidth="1.5"
                    opacity="0.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}

              {/* Avatar */}
              <motion.div
                className="absolute transition-all duration-1000 ease-out transform z-10"
                style={{
                  left: `${avatarX}%`,
                  top: `${avatarY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="relative">
                  {/* Glow Effect */}
                  <div
                    className="absolute inset-0 w-12 h-12 rounded-full blur-sm opacity-30"
                    style={{ backgroundColor: player.color }}
                  ></div>

                  {/* Avatar Image */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-white bg-white">
                    <img
                      src={getUserAvatar(player.wallet)}
                      alt={`${shortenAddress(player.wallet)} avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Fallback initials */}
                    <div
                      className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: player.color,
                        color: 'white',
                        display: 'none'
                      }}
                    >
                      {shortenAddress(player.wallet).slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Performance Label */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="text-center">
                      <div className="text-xs font-medium mb-1">{shortenAddress(player.wallet)}</div>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full shadow-sm",
                        currentChange >= 0 ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700'
                        : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
                      )}>
                        {player.coin} {currentChange >= 0 ? '+' : ''}{(currentChange * 100).toFixed(4)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Legend with User Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Creator */}
        {creatorWallet && creatorWallet.trim() !== '' && (
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={getUserAvatar(creatorWallet)}
                alt="Creator avatar"
                className="w-8 h-8 rounded-full border-2 border-orange-400"
              />
              <div>
                <div className="text-sm font-semibold">{shortenAddress(creatorWallet)}</div>
                <div className="text-xs text-muted-foreground">Creator • {creatorCoin || 'No coin selected'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-lg font-bold",
                creatorCurrent >= 0 ? "text-success-readable" : "text-error-readable"
              )}>
                {creatorCurrent >= 0 ? '+' : ''}{(creatorCurrent * 100).toFixed(4)}%
              </div>
            </div>
          </div>
        )}

        {/* Opponent */}
        {opponentWallet && opponentWallet.trim() !== '' ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={getUserAvatar(opponentWallet)}
                alt="Opponent avatar"
                className="w-8 h-8 rounded-full border-2 border-blue-400"
              />
              <div>
                <div className="text-sm font-semibold">{shortenAddress(opponentWallet)}</div>
                <div className="text-xs text-muted-foreground">Opponent • {opponentCoin || 'No coin selected'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-lg font-bold",
                opponentCurrent >= 0 ? "text-success-readable" : "text-error-readable"
              )}>
                {opponentCurrent >= 0 ? '+' : ''}{(opponentCurrent * 100).toFixed(4)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="text-center text-muted-foreground">
              <div className="text-sm">Waiting for opponent...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};