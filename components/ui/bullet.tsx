import React from 'react';
import { cn } from '@/lib/utils';

interface BulletProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function Bullet({ variant = 'default', className }: BulletProps) {
  const variants = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    destructive: 'bg-red-500',
  };

  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full',
        variants[variant],
        className
      )}
    />
  );
}