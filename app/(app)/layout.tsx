'use client';

import { ReactNode } from 'react';
import GamingNav from '@/components/gaming-nav';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <GamingNav />

      {/* Main content with proper spacing for navigation */}
      <main className="lg:pl-20 xl:pl-64 pb-16 lg:pb-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}