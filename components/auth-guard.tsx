'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDynamicContext, useIsLoggedIn } from '@/lib/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface AuthGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireProfile = false, 
  redirectTo = '/' 
}: AuthGuardProps) {
  const { sdkHasLoaded } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();

  useEffect(() => {
    if (sdkHasLoaded && !isLoggedIn) {
      router.push(redirectTo);
    }
  }, [sdkHasLoaded, isLoggedIn, router, redirectTo]);

  // Show loading state while SDK is loading
  if (!sdkHasLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 max-w-2xl mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please connect your wallet to continue.</p>
          </div>
        </Card>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
