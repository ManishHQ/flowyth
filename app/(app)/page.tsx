'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppRoot() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard as the main app entry point
    router.push('/dashboard');
  }, [router]);

  return null;
}