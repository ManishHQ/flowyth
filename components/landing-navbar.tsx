'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useIsLoggedIn, useDynamicContext } from '@/lib/dynamic';
import DynamicEmbeddedWidget from '@/components/dynamic/dynamic-embedded-widget';

export default function LandingNavbar() {
  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();

  const handleLogin = () => {
    setShowAuthFlow(true);
  };

  const handleLogout = () => {
    // Dynamic.xyz handles logout automatically
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center">
            <span
              className="text-2xl font-bold text-primary"
              style={{ fontFamily: 'var(--font-rebels), serif' }}
            >
              FLOWYTH
            </span>
          </div>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#tournaments"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tournaments
          </Link>
        </div>

        {/* Authentication Section */}
        <div className="flex items-center space-x-4">
          {!isLoggedIn ? (
            <div className="flex items-center space-x-2">
              {/* Login Button - triggers Dynamic widget */}
              <Button
                onClick={handleLogin}
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Connect Wallet
              </Button>
              {/* Mobile login button */}
              <Button
                onClick={handleLogin}
                variant="outline"
                size="sm"
                className="sm:hidden"
              >
                Login
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Go to Home Button */}
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/home">
                  Go to Home
                </Link>
              </Button>
              <Button asChild size="sm" className="sm:hidden">
                <Link href="/home">
                  Home
                </Link>
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu - could be expanded later */}
      <div className="md:hidden border-t border-border bg-background/95">
        <div className="flex justify-center space-x-6 py-3">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#tournaments"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tournaments
          </Link>
        </div>
      </div>
    </nav>
  );
}