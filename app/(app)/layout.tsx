'use client';

import { ReactNode, useEffect, useState } from 'react';
import GamingNav from '@/components/gaming-nav';
import UserOnboardingModal from '@/components/user-onboarding-modal';
import { useDynamicUser } from '@/hooks/use-dynamic-user';
import { useUserStore } from '@/lib/stores/user-store';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { walletAddress, isLoggedIn } = useDynamicUser();
  const { checkUserExists } = useUserStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);

  // Check if user exists in database when wallet connects
  useEffect(() => {
    const checkUser = async () => {
      if (!isLoggedIn || !walletAddress || hasCheckedUser) return;

      try {
        const userExists = await checkUserExists(walletAddress);
        if (!userExists) {
          setShowOnboarding(true);
        }
        setHasCheckedUser(true);
      } catch (error) {
        console.error('Failed to check user:', error);
        setHasCheckedUser(true);
      }
    };

    checkUser();
  }, [isLoggedIn, walletAddress, checkUserExists, hasCheckedUser]);

  // Reset check when wallet disconnects
  useEffect(() => {
    if (!isLoggedIn) {
      setHasCheckedUser(false);
      setShowOnboarding(false);
    }
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-background">
      <GamingNav />

      {/* Main content with proper spacing for navigation */}
      <main className="lg:pl-64 pb-16 lg:pb-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>

      {/* Onboarding Modal */}
      <UserOnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
    </div>
  );
}