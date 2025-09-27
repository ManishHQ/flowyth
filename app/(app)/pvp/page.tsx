'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bullet } from '@/components/ui/bullet';
import NumberFlow from "@number-flow/react";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceData {
  id: string;
  price: number;
  startPrice: number | null;
  timestamp: number;
  symbol: string;
  percentageChange: number;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  [key: string]: number | string; // Dynamic keys for each coin's percentage
}

export default function P2PTestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [matchStarted, setMatchStarted] = useState(false);

  // Game timer states
  const [gameState, setGameState] = useState<'idle' | 'racing' | 'finished' | 'results'>('idle');
  const [timeLeft, setTimeLeft] = useState(15);
  const [winner, setWinner] = useState<PriceData | null>(null);

  // Chart data arrays - similar to the working MUI example
  const [btcData, setBtcData] = useState<number[]>([]);
  const [ethData, setEthData] = useState<number[]>([]);
  const [linkData, setLinkData] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Use ref to access current prices in interval
  const pricesRef = useRef<PriceData[]>([]);

  // Update ref when prices change
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Create a lookup map for O(1) symbol retrieval
  const priceFeeds = [
    {
      id: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      symbol: "BTC/USD"
    },
    {
      id: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
      symbol: "ETH/USD"
    },
    {
      id: "8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221",
      symbol: "LINK/USD"
    }
  ];

  // Create lookup map once - O(1) access instead of O(n) array.find()
  const symbolLookup = React.useMemo(() => {
    const lookup: { [key: string]: string } = {};
    priceFeeds.forEach(feed => {
      lookup[feed.id] = feed.symbol;
    });
    return lookup;
  }, []);

  const startStreaming = () => {
    if (eventSource) {
      eventSource.close();
    }

    // Create SSE connection to Pyth
    const priceIds = priceFeeds.map(feed => `0x${feed.id}`); // Add 0x prefix for API call
    const sseUrl = `https://hermes.pyth.network/v2/updates/price/stream?ids[]=${priceIds.join('&ids[]=')}`;


    const es = new EventSource(sseUrl);

    es.onopen = () => {
      console.log('Connected to Pyth price stream');
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.parsed && Array.isArray(data.parsed)) {
          setPrices(prev => {
            const updated = [...prev];

            data.parsed.forEach((item: any) => {

              // O(1) symbol lookup instead of O(n) array.find()
              const symbol = symbolLookup[item.id] || 'Unknown';
              const currentPrice = parseFloat(item.price.price) * Math.pow(10, item.price.expo);

              const existingIndex = updated.findIndex(p => p.id === item.id);

              if (existingIndex >= 0) {
                // Update existing price
                const existing = updated[existingIndex];
                const percentageChange = existing.startPrice ? ((currentPrice - existing.startPrice) / existing.startPrice) * 100 : 0;

                updated[existingIndex] = {
                  ...existing,
                  price: currentPrice,
                  timestamp: item.price.publish_time,
                  percentageChange: percentageChange
                };
              } else {
                // Add new price (first time receiving this price)
                updated.push({
                  id: item.id,
                  price: currentPrice,
                  startPrice: matchStarted ? currentPrice : null, // Set start price only if match has started
                  timestamp: item.price.publish_time,
                  symbol: symbol,
                  percentageChange: 0
                });
              }
            });

            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    es.onerror = (error) => {
      console.error('SSE Error:', error);
      setIsConnected(false);
    };

    setEventSource(es);
  };

  // Update chart data arrays every 2-3 seconds instead of on every price update
  useEffect(() => {
    if (!matchStarted) return;

    const interval = setInterval(() => {
      if (pricesRef.current.length > 0) {
        console.log('Updating chart data arrays...');

        // Find percentage for each coin using current prices
        const btcPrice = pricesRef.current.find(p => p.symbol === 'BTC/USD');
        const ethPrice = pricesRef.current.find(p => p.symbol === 'ETH/USD');
        const linkPrice = pricesRef.current.find(p => p.symbol === 'LINK/USD');

        // Only update if we have start prices (match is active) and at least one coin has data
        if ((btcPrice?.startPrice || ethPrice?.startPrice || linkPrice?.startPrice)) {
          // Update data arrays - keep last 20 points
          setBtcData(prev => [...prev, btcPrice?.percentageChange || 0].slice(-20));
          setEthData(prev => [...prev, ethPrice?.percentageChange || 0].slice(-20));
          setLinkData(prev => [...prev, linkPrice?.percentageChange || 0].slice(-20));

          // Create time labels array to match data length
          setTimeLabels(prev => {
            const newLabels = [...prev, new Date().toLocaleTimeString()].slice(-20);
            return newLabels;
          });

          console.log('Chart data updated:', {
            btc: btcPrice?.percentageChange?.toFixed(4) || '0',
            eth: ethPrice?.percentageChange?.toFixed(4) || '0',
            link: linkPrice?.percentageChange?.toFixed(4) || '0',
            dataLength: btcData.length + 1
          });
        }
      }
    }, 500); // Update every 2.5 seconds

    return () => clearInterval(interval);
  }, [matchStarted]);

  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
      setMatchStarted(false);
      console.log('Disconnected from price stream');
    }
  };

  const startMatch = () => {
    if (!isConnected) {
      alert('Please start streaming first!');
      return;
    }

    // Set current prices as start prices
    setPrices(prev => prev.map(price => ({
      ...price,
      startPrice: price.price,
      percentageChange: 0
    })));

    setMatchStarted(true);
    setGameState('racing');
    setTimeLeft(15);
    setWinner(null);
    console.log('15-second race started!');
  };

  const resetMatch = () => {
    setPrices(prev => prev.map(price => ({
      ...price,
      startPrice: null,
      percentageChange: 0
    })));
    // Clear chart data arrays
    setBtcData([]);
    setEthData([]);
    setLinkData([]);
    setTimeLabels([]);
    setMatchStarted(false);
    setGameState('idle');
    setTimeLeft(15);
    setWinner(null);
    console.log('Match reset.');
  };

  // Game timer logic
  useEffect(() => {
    let gameTimer: NodeJS.Timeout;

    if (gameState === 'racing') {
      gameTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Race finished - determine winner using ref to get current prices
            const currentPrices = pricesRef.current;
            const sortedPrices = currentPrices
              .filter(p => p.startPrice !== null)
              .sort((a, b) => b.percentageChange - a.percentageChange);

            const raceWinner = sortedPrices[0];
            setWinner(raceWinner);
            setGameState('finished');

            // Show results for 10 seconds
            setTimeout(() => {
              setGameState('results');
              setTimeout(() => {
                resetMatch();
              }, 10000); // Show results for 10 seconds
            }, 1000);

            console.log('Race finished! Winner:', raceWinner?.symbol);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (gameTimer) {
        clearInterval(gameTimer);
      }
    };
  }, [gameState]); // Only depend on gameState, not timeLeft or prices

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-1 sm:px-0">
        <div className="text-center space-y-2 sm:space-y-4 px-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>🔥 P2P TRADING DUEL</h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Real-time crypto price battles powered by Pyth Network
          </p>
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant={isConnected ? "success" : "destructive"} />
              CONNECTION STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={startStreaming}
                disabled={isConnected}
                variant={isConnected ? "secondary" : "default"}
              >
                {isConnected ? 'Connected' : 'Start Streaming'}
              </Button>
              <Button
                onClick={stopStreaming}
                disabled={!isConnected}
                variant="outline"
              >
                Stop Streaming
              </Button>
              <Button
                onClick={startMatch}
                disabled={!isConnected || gameState === 'racing' || gameState === 'finished'}
                variant={gameState === 'racing' ? "secondary" : "default"}
                className={gameState === 'racing' ? "animate-pulse" : ""}
              >
                {gameState === 'racing' ? `Racing... ${timeLeft}s` :
                 gameState === 'finished' ? 'Race Finished!' :
                 gameState === 'results' ? 'Results Shown' :
                 'Start 15s Race'}
              </Button>
              <Button
                onClick={resetMatch}
                disabled={gameState === 'racing'}
                variant="outline"
              >
                Reset Race
              </Button>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Status: {isConnected ? 'Connected to Pyth Network' : 'Disconnected'}
              </p>
              {matchStarted && (
                <p className="text-sm font-medium text-green-600">
                  🎯 Match Active - Tracking percentage changes from start prices
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Status Display */}
        {gameState === 'racing' && (
          <Card className="border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-700 mb-2">
                  ⏱️ Race in Progress
                </h2>
                <div className="text-4xl font-mono font-bold text-blue-800 mb-2">
                  {timeLeft}s
                </div>
                {prices.length > 0 && (
                  <p className="text-blue-600">
                    Current Leader: <span className="font-semibold">
                      {prices.sort((a, b) => b.percentageChange - a.percentageChange)[0]?.symbol}
                    </span> ({prices.sort((a, b) => b.percentageChange - a.percentageChange)[0]?.percentageChange >= 0 ? '+' : ''}
                    {prices.sort((a, b) => b.percentageChange - a.percentageChange)[0]?.percentageChange.toFixed(4)}%)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winner Display */}
        {(gameState === 'finished' || gameState === 'results') && winner && (
          <Card className="border-gold bg-gradient-to-r from-yellow-100 to-yellow-200 ring-4 ring-yellow-400">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-yellow-800 mb-3">
                  🏆 WINNER! 🏆
                </h2>
                <div className="text-6xl mb-4">
                  {winner.symbol === 'BTC/USD' ? '₿' : winner.symbol === 'ETH/USD' ? 'Ξ' : '🔗'}
                </div>
                <h3 className="text-2xl font-bold text-yellow-900 mb-2">
                  {winner.symbol}
                </h3>
                <p className="text-xl font-semibold text-yellow-700">
                  {winner.percentageChange >= 0 ? '+' : ''}
                  {winner.percentageChange.toFixed(4)}% gain
                </p>
                {gameState === 'results' && (
                  <p className="text-sm text-yellow-600 mt-3">
                    🎉 Congratulations! Starting new race soon...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avatar Racing Visualization */}
        {matchStarted && (
          <Card>
            <CardHeader>
              <CardTitle>🏁 Avatar Racing Track</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 bg-green-500 rounded-lg overflow-hidden">
                {/* Football Field Background */}
                <div className="absolute inset-0 bg-green-500"></div>
                {/* Field Lines */}
                <div className="absolute inset-0">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white opacity-60 transform -translate-x-1/2"></div>
                  {/* Goal lines */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-60"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white opacity-60"></div>
                  {/* Yard lines */}
                  <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white opacity-40"></div>
                  <div className="absolute right-1/4 top-0 bottom-0 w-px bg-white opacity-40"></div>
                  {/* Center circle */}
                  <div className="absolute left-1/2 top-1/2 w-16 h-16 border border-white opacity-60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                {(() => {
                  // Smart auto-scaling Y-axis calculation with dynamic zero line
                  const allValues = [...btcData, ...ethData, ...linkData].filter(v => v !== undefined && v !== null);

                  if (allValues.length === 0) {
                    // Default when no data - zero line in middle
                    return (
                      <>
                        <div className="absolute left-0 right-0 top-0 h-1/2 bg-green-100 opacity-30"></div>
                        <span className="absolute left-2 top-2 text-xs text-green-600">+0.050%</span>
                        <div className="absolute left-0 right-0 bottom-0 h-1/2 bg-red-100 opacity-30"></div>
                        <span className="absolute left-2 bottom-2 text-xs text-red-600">-0.050%</span>
                        {/* Zero Line - centered */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-400 transform -translate-y-1/2"></div>
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-white px-1">0%</span>
                      </>
                    );
                  }

                  // Calculate actual min/max from data
                  const minValue = Math.min(...allValues);
                  const maxValue = Math.max(...allValues);
                  const dataRange = maxValue - minValue;

                  // Add smart padding (20% of range, minimum 0.01%)
                  const padding = Math.max(dataRange * 0.2, 0.01);
                  const yMin = minValue - padding;
                  const yMax = maxValue + padding;

                  // Ensure minimum range for visibility
                  const finalRange = Math.max(yMax - yMin, 0.02);
                  const center = (yMax + yMin) / 2;
                  const finalYMax = center + finalRange / 2;
                  const finalYMin = center - finalRange / 2;

                  // Calculate where 0% should be positioned
                  const zeroNormalized = (0 - finalYMin) / (finalYMax - finalYMin); // Normalize 0% to 0-1
                  const zeroPosition = 95 - (zeroNormalized * 90); // Convert to percentage from top

                  // Determine zones based on actual zero position
                  const isZeroVisible = zeroPosition >= 5 && zeroPosition <= 95;

                  return (
                    <>
                      {/* Positive Zone - above zero line */}
                      {finalYMax > 0 && (
                        <div
                          className="absolute left-0 right-0 bg-green-100 opacity-30"
                          style={{
                            top: '5%',
                            height: isZeroVisible ? `${Math.max(zeroPosition - 5, 0)}%` : '45%'
                          }}
                        ></div>
                      )}
                      <span className="absolute left-2 top-2 text-xs text-green-600 bg-white bg-opacity-80 px-1 rounded">
                        +{finalYMax.toFixed(3)}%
                      </span>

                      {/* Negative Zone - below zero line */}
                      {finalYMin < 0 && (
                        <div
                          className="absolute left-0 right-0 bg-red-100 opacity-30"
                          style={{
                            bottom: '5%',
                            height: isZeroVisible ? `${Math.max(95 - zeroPosition, 0)}%` : '45%'
                          }}
                        ></div>
                      )}
                      <span className="absolute left-2 bottom-2 text-xs text-red-600 bg-white bg-opacity-80 px-1 rounded">
                        {finalYMin.toFixed(3)}%
                      </span>

                      {/* Dynamic Zero Line - positioned based on actual 0% */}
                      {isZeroVisible && (
                        <>
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-gray-400 transform -translate-y-1/2 z-10"
                            style={{ top: `${zeroPosition}%` }}
                          ></div>
                          <span
                            className="absolute left-2 transform -translate-y-1/2 text-xs text-gray-600 bg-white bg-opacity-90 px-1 rounded font-medium z-10"
                            style={{ top: `${zeroPosition}%` }}
                          >
                            0%
                          </span>
                        </>
                      )}

                      {/* Additional scale reference lines */}
                      {finalRange > 0.05 && (
                        <>
                          {/* Quarter lines */}
                          <div className="absolute left-0 right-0 h-px bg-gray-300 opacity-30" style={{ top: '27.5%' }}></div>
                          <span className="absolute left-2 text-xs text-gray-400 bg-white bg-opacity-60 px-1 rounded text-[10px]" style={{ top: '26%' }}>
                            {(finalYMax * 0.75 + finalYMin * 0.25).toFixed(3)}%
                          </span>
                          <div className="absolute left-0 right-0 h-px bg-gray-300 opacity-30" style={{ top: '72.5%' }}></div>
                          <span className="absolute left-2 text-xs text-gray-400 bg-white bg-opacity-60 px-1 rounded text-[10px]" style={{ top: '71%' }}>
                            {(finalYMax * 0.25 + finalYMin * 0.75).toFixed(3)}%
                          </span>
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Racing Avatars Following Chart Curve */}
                {(() => {
                  // Use same smart auto-scaling logic for positioning (MUST match chart display logic)
                  const allValues = [...btcData, ...ethData, ...linkData].filter(v => v !== undefined && v !== null);

                  // Default scale when no data
                  if (allValues.length === 0) {
                    var yMin = -0.05;
                    var yMax = 0.05;
                  } else {
                    // Calculate actual min/max from data (SAME AS CHART DISPLAY)
                    const minValue = Math.min(...allValues);
                    const maxValue = Math.max(...allValues);
                    const dataRange = maxValue - minValue;

                    // Add smart padding (20% of range, minimum 0.01%)
                    const padding = Math.max(dataRange * 0.2, 0.01);
                    const tempYMin = minValue - padding;
                    const tempYMax = maxValue + padding;

                    // Ensure minimum range for visibility (SAME AS CHART DISPLAY)
                    const finalRange = Math.max(tempYMax - tempYMin, 0.02);
                    const center = (tempYMax + tempYMin) / 2;
                    var yMax = center + finalRange / 2; // This should be finalYMax
                    var yMin = center - finalRange / 2; // This should be finalYMin
                  }

                  // Debug Y-axis calculation
                  if (allValues.length > 0) {
                    console.log('Y-axis debug:', {
                      allValues: allValues.slice(-3), // Last 3 values
                      yMin,
                      yMax,
                      dataRange: yMax - yMin
                    });
                  }

                  return prices.map((priceData, index) => {
                    // Get the data array for this crypto
                    const dataArray = index === 0 ? btcData : index === 1 ? ethData : linkData;

                    // Use the maximum data length across all arrays for consistent progression
                    const maxDataLength = Math.max(btcData.length, ethData.length, linkData.length, 1);

                    // Calculate avatar position (should be at the END of the curve)
                    let avatarX, avatarY;
                    if (dataArray.length > 0) {
                      // Position avatar at the last data point
                      avatarX = 15 + ((dataArray.length - 1) / Math.max(19, 1)) * 70;
                      const lastValue = dataArray[dataArray.length - 1];
                      // Use smart scaling for Y position
                      const normalizedY = (lastValue - yMin) / (yMax - yMin); // Normalize to 0-1
                      avatarY = 95 - (normalizedY * 90); // Convert to percentage from top (5% margin top/bottom)
                      
                      // Debug avatar positioning
                      if (index === 0) { // Only log for first coin to avoid spam
                        console.log(`Avatar ${priceData.symbol} positioning:`, {
                          lastValue,
                          yMin,
                          yMax,
                          normalizedY,
                          avatarY,
                          percentageChange: priceData.percentageChange,
                          // Expectation check
                          expectation: lastValue > 0 ? 'Should be in upper half (avatarY < 50)' : 'Should be in lower half (avatarY > 50)'
                        });
                      }
                    } else {
                      // No data yet, start at beginning
                      avatarX = 15;
                      avatarY = 50; // Center at 0%
                    }

                    // Create smooth curve path using quadratic bezier curves
                    const createSmoothPath = (points: { x: number; y: number }[]) => {
                      if (points.length < 2) return '';

                      let path = `M ${points[0].x} ${points[0].y}`;

                      for (let i = 1; i < points.length; i++) {
                        const prev = points[i - 1];
                        const curr = points[i];

                        if (i === 1) {
                          // First curve - start smoothly
                          const midX = (prev.x + curr.x) / 2;
                          const midY = (prev.y + curr.y) / 2;
                          path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
                        } else {
                          // Smooth curves using control points
                          const next = points[i + 1];
                          if (next) {
                            // Calculate control point for smooth transition
                            const controlX = curr.x;
                            const controlY = curr.y;
                            const endX = (curr.x + next.x) / 2;
                            const endY = (curr.y + next.y) / 2;
                            path += ` Q ${controlX} ${controlY} ${endX} ${endY}`;
                          } else {
                            // Last point - end smoothly
                            path += ` Q ${curr.x} ${curr.y} ${curr.x} ${curr.y}`;
                          }
                        }
                      }
                      return path;
                    };

                    // Convert data to smooth curve points using smart scaling
                    const curvePoints = dataArray.map((value, idx) => {
                      const x = 15 + (idx / Math.max(19, 1)) * 70;
                      // Use smart scaling for Y position
                      const normalizedY = (value - yMin) / (yMax - yMin); // Normalize to 0-1
                      const y = 95 - (normalizedY * 90); // Convert to percentage from top (5% margin)
                      return { x, y };
                    });

                    const smoothPath = createSmoothPath(curvePoints);

                    return (
                    <div key={priceData.id}>
                      {/* Smooth Curve Path */}
                      {dataArray.length > 1 && smoothPath && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={index === 0 ? '#FB923C' : index === 1 ? '#EF4444' : '#3B82F6'} stopOpacity="0.3" />
                              <stop offset="100%" stopColor={index === 0 ? '#FB923C' : index === 1 ? '#EF4444' : '#3B82F6'} stopOpacity="0.8" />
                            </linearGradient>
                          </defs>
                          <path
                            d={smoothPath}
                            fill="none"
                            stroke={index === 0 ? '#FB923C' : index === 1 ? '#EF4444' : '#3B82F6'}
                            strokeWidth="0.8"
                            opacity="0.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* Add glow effect */}
                          <path
                            d={smoothPath}
                            fill="none"
                            stroke={`url(#gradient-${index})`}
                            strokeWidth="1.5"
                            opacity="0.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      )}

                      {/* Avatar */}
                      <div
                        className="absolute transition-all duration-1000 ease-out transform z-10"
                        style={{
                          left: `${avatarX}%`,
                          top: `${avatarY}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="relative">
                          {/* Glow Effect */}
                          <div className={`absolute inset-0 w-10 h-10 rounded-full blur-sm opacity-30 ${
                            index === 0 ? 'bg-orange-400' :
                            index === 1 ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>

                          {/* Avatar */}
                          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white ${
                            index === 0 ? 'bg-orange-400 text-white' :
                            index === 1 ? 'bg-red-400 text-white' : 'bg-blue-400 text-white'
                          }`}>
                            {index === 0 ? '₿' : index === 1 ? 'Ξ' : '🔗'}
                          </div>

                          {/* Performance Label */}
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full shadow-sm ${
                              priceData.percentageChange >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {priceData.percentageChange >= 0 ? '+' : ''}
                              {priceData.percentageChange.toFixed(4)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  });
                })()}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                {prices.map((priceData, index) => (
                  <div key={priceData.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-orange-400' :
                      index === 1 ? 'bg-red-400' : 'bg-blue-400'
                    }`}></div>
                    <span className="text-sm font-medium">{priceData.symbol}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        <div className="grid gap-3 sm:gap-4 px-2 sm:px-4">
          {prices.length === 0 ? (
            <Card>
              <CardContent className="p-3 sm:p-6 text-center text-muted-foreground">
                {isConnected ? 'Waiting for price data...' : 'Click "Start Streaming" to begin'}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {prices
                .sort((a, b) => matchStarted ? b.percentageChange - a.percentageChange : 0) // Sort by performance when match is active
                .map((priceData, index) => (
              <motion.div
                key={priceData.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                exit={{
                  opacity: 0,
                  y: -50,
                  scale: 0.9,
                  transition: { duration: 0.3 }
                }}
                whileHover={{
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: index === 0 && matchStarted ? 1.02 : 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.6
                  }
                }}
                className="relative"
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                  matchStarted && index === 0 && "bg-accent ring-2 ring-success/50 winner-glow",
                  matchStarted && index === 1 && "bg-accent/50 ring-2 ring-warning/50",
                  matchStarted && index === 2 && "bg-accent/25 ring-2 ring-destructive/50"
                )}>
                <CardHeader className="flex items-center justify-between p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2.5">
                    <Bullet variant={
                      matchStarted && index === 0 ? "success" :
                      matchStarted && index === 1 ? "warning" :
                      matchStarted && index === 2 ? "destructive" : "default"
                    } />
                    {priceData.symbol}
                  </CardTitle>
                  {matchStarted && (
                    <motion.span
                      key={`rank-${index}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{
                        scale: 1,
                        rotate: 0,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                          delay: 0.1
                        }
                      }}
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "flex items-center justify-center rounded text-sm font-bold px-1.5",
                        index === 0 ? "h-8 bg-primary text-primary-foreground" :
                        "h-6 bg-secondary text-secondary-foreground"
                      )}
                    >
                      #{index + 1}
                    </motion.span>
                  )}
                </CardHeader>

                <CardContent className={cn(
                  "flex-1 pt-2 px-3 sm:px-6 sm:pt-6 overflow-clip relative",
                  matchStarted && index === 0 && "bg-accent"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-3xl md:text-4xl font-display">
                        <NumberFlow
                          value={priceData.price}
                          prefix="$"
                          locales="en-US"
                        />
                      </span>
                      {priceData.startPrice && (
                        <div className="mt-2">
                          <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide">
                            START: ${priceData.startPrice.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {priceData.startPrice && (
                        <div className="text-2xl md:text-3xl font-display font-bold">
                          <span className={cn(
                            priceData.percentageChange >= 0 ? 'text-success' : 'text-destructive'
                          )}>
                            {priceData.percentageChange >= 0 ? '+' : ''}
                            <NumberFlow
                              value={priceData.percentageChange}
                              suffix="%"
                            />
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(priceData.timestamp * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>


                </CardContent>
              </Card>
              </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet />
              HOW IT WORKS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:p-6">
            <p className="text-sm text-muted-foreground">
              • Uses Pyth Network's Server-Sent Events (SSE) for real-time price streaming
            </p>
            <p className="text-sm text-muted-foreground">
              • Click "Start Match" to record current prices as baseline for percentage calculations
            </p>
            <p className="text-sm text-muted-foreground">
              • Green/Red percentages show gains/losses from match start prices
            </p>
            <p className="text-sm text-muted-foreground">
              • Perfect for P2P matches - highest percentage gain wins!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Arrow Indicator Component (matching dashboard style)
interface ArrowIndicatorProps {
  direction: "up" | "down";
  index: number;
}

const ArrowIndicator = ({ direction, index }: ArrowIndicatorProps) => {
  const staggerDelay = index * 0.15; // Faster stagger
  const phaseDelay = (index % 3) * 0.8; // Different phase groups

  return (
    <span
      style={{
        animationDelay: `${staggerDelay + phaseDelay}s`,
        animationDuration: "3s",
        animationTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      }}
      className={cn(
        "text-center text-4xl size-12 font-display leading-none block",
        "transition-all duration-700 ease-out",
        "animate-marquee-pulse",
        "will-change-transform"
      )}
    >
      {direction === "up" ? "↑" : "↓"}
    </span>
  );
};