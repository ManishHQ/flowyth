'use client';

import { useState, useEffect } from 'react';
import { formatCountdown } from '@/lib/hooks/use-crypto-fantasy-league-v2';

interface TournamentCountdownProps {
  targetTime: number; // Unix timestamp in milliseconds
  label?: string;
  onComplete?: () => void;
}

export function TournamentCountdown({ targetTime, label = '', onComplete }: TournamentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && onComplete) {
        onComplete();
      }
    };

    // Update immediately
    updateTimeLeft();

    // Then update every second
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  if (timeLeft <= 0) {
    return <span className="font-mono text-red-500">Ended</span>;
  }

  return (
    <span className="font-mono">
      {formatCountdown(timeLeft)} {label && <span className="font-normal">{label}</span>}
    </span>
  );
}