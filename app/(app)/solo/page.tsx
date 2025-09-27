'use client';

import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PredictionMarket {
  id: string;
  question: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: string;
  imageUrl: string;
}

const sampleMarkets: PredictionMarket[] = [
  {
    id: '1',
    question: 'Will Bitcoin reach $100k by end of 2025?',
    description: "If you think Bitcoin will moon, swipe right. If you think it's a bubble, pass.",
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: 125000,
    endDate: '2025-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=600&fit=crop',
  },
  {
    id: '2',
    question: 'Will AI achieve AGI by 2030?',
    description: 'Artificial General Intelligence by 2030? The robots are coming, but when?',
    yesPrice: 0.32,
    noPrice: 0.68,
    volume: 89000,
    endDate: '2030-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=600&fit=crop',
  },
  {
    id: '3',
    question: 'Will SpaceX land humans on Mars by 2030?',
    description: 'Elon says Mars by 2030. Do you believe in the mission or just the memes?',
    yesPrice: 0.28,
    noPrice: 0.72,
    volume: 156000,
    endDate: '2030-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop',
  },
];

interface SwipeCardProps {
  market: PredictionMarket;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down', amount: number) => void;
  isVisible: boolean;
  currentIndex: number;
  totalCount: number;
  zIndex: number;
  amount: number;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
}

function SwipeCard({ market, onSwipe, isVisible, currentIndex, totalCount, zIndex, amount, setAmount }: SwipeCardProps) {
  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (Math.abs(offset.y) > Math.abs(offset.x) && Math.abs(offset.y) > swipeThreshold) {
      onSwipe(offset.y > 0 ? 'down' : 'up', amount);
    } else if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      const direction = offset.x > 0 ? 'right' : 'left';
      onSwipe(direction, amount);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className={`absolute inset-0 ${zIndex === 1 ? 'z-10' : 'z-0'}`}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ rotate: 0, scale: 1.05 }}
      animate={{
        scale: zIndex === 1 ? 1 : 0.95,
        y: zIndex === 1 ? 0 : 20,
        opacity: zIndex === 1 ? 1 : 0.7
      }}
      exit={{
        x: 300,
        opacity: 0,
        transition: { duration: 0.3 }
      }}
    >
      <div
        className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative"
        style={{
          backgroundImage: `url(${market.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute top-6 left-6 z-20">
          <div className="px-3 py-1 rounded-full bg-white/90">
            <span className="font-semibold text-gray-800 text-sm">
              {currentIndex + 1} / {totalCount}
            </span>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-8 pb-12 z-10">
          <h2 className="text-3xl font-bold leading-tight text-white mb-4">
            {market.question}
          </h2>

          <p className="text-lg leading-relaxed text-white mb-6">
            {market.description}
          </p>

          <div className="flex items-center justify-between mb-6 gap-2">
            <button
              onClick={() => onSwipe('left', amount)}
              className="px-4 py-2 bg-red-500 rounded-xl border-2 border-red-600 hover:bg-red-600 transition-colors"
            >
              <span className="text-sm font-bold text-white">
                ❌ NO ${(market.noPrice * 100).toFixed(0)}¢
              </span>
            </button>

            <div className="px-4 py-2 bg-yellow-500 rounded-xl border-2 border-yellow-600">
              <span className="text-sm font-bold text-white">
                💰 ${(market.volume / 1000).toFixed(0)}K Pool
              </span>
            </div>

            <button
              onClick={() => onSwipe('right', amount)}
              className="px-4 py-2 bg-primary rounded-xl border-2 border-primary hover:bg-primary transition-colors"
            >
              <span className="text-sm font-bold text-white">
                ✅ YES ${(market.yesPrice * 100).toFixed(0)}¢
              </span>
            </button>
          </div>

          <div className="p-4 mx-4 mb-4 bg-yellow-400 rounded-2xl border-2 border-black">
            <p className="mb-3 text-sm font-bold text-black">💰 BET AMOUNT</p>

            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {[0.5, 1, 2, 5, 10, 25, 50].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(value)}
                  className={`px-3 py-1 rounded-full border-2 transition-all ${
                    amount === value
                      ? 'bg-red-500 border-red-600 text-white'
                      : 'bg-white border-black text-black hover:bg-gray-100'
                  }`}
                >
                  <span className="font-bold text-sm">${value}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                onClick={() => setAmount(prev => Math.max(0.5, prev - 1))}
                className="w-10 h-10 bg-red-500 rounded-full border-2 border-black flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <span className="text-lg font-bold text-white">−</span>
              </button>

              <div className="px-4 py-2 bg-gray-100 rounded-lg min-w-[80px]">
                <span className="text-xl font-bold text-center text-gray-800 block">
                  ${amount}
                </span>
              </div>

              <button
                onClick={() => setAmount((prev: number) => prev + 1)}
                className="w-10 h-10 bg-primary rounded-full border-2 border-black flex items-center justify-center hover:bg-primary transition-colors"
              >
                <span className="text-lg font-bold text-white">+</span>
              </button>
            </div>

            <p className="text-sm text-center text-black font-bold">
              ← NO | ↑ Skip ↓ | YES →
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const dynamic = 'force-dynamic';

export default function SoloPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [markets] = useState(sampleMarkets);
  const [amount, setAmount] = useState(10);

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down', amount: number) => {
    const market = markets[currentIndex];

    switch (direction) {
      case 'left':
        console.log(`❌ NO bet $${amount} on: "${market.question}"`);
        console.log(`Expected return: $${(amount * (1 / market.noPrice - 1)).toFixed(2)}`);
        break;
      case 'right':
        console.log(`✅ YES bet $${amount} on: "${market.question}"`);
        console.log(`Expected return: $${(amount * (1 / market.yesPrice - 1)).toFixed(2)}`);
        break;
      case 'up':
      case 'down':
        console.log(`⏭️ SKIP on: "${market.question}"`);
        break;
    }

    setCurrentIndex(prev => (prev + 1) % markets.length);
  };

  const restart = () => {
    setCurrentIndex(0);
    console.log('🔄 Restarted prediction market deck');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[700px] relative">
        {currentIndex < markets.length ? (
          <>
            {markets
              .slice(currentIndex, currentIndex + 2)
              .map((market, index) => (
                <SwipeCard
                  key={`${market.id}-${currentIndex + index}`}
                  market={market}
                  onSwipe={handleSwipe}
                  isVisible={true}
                  currentIndex={currentIndex + index}
                  totalCount={markets.length}
                  zIndex={1 - index}
                  amount={amount}
                  setAmount={setAmount}
                />
              ))}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 text-center">
              <h2 className="mb-4 text-4xl font-bold">
                🎉 DEGEN COMPLETE!
              </h2>
              <p className="mb-6 text-lg font-bold">
                Check console for your degen bets 📱
              </p>
              <Button
                onClick={restart}
                className="px-8 py-4 text-lg font-bold"
              >
                🔄 DEGEN AGAIN
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}