'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Trophy,
  Users,
  Gamepad2,
  BookOpen,
  User,
  Menu,
  X,
  Swords,
  Target
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    emoji: '🏠'
  },
  {
    name: 'Tournaments',
    href: '/tournaments',
    icon: Trophy,
    emoji: '🏆'
  },
  {
    name: 'Create Squad',
    href: '/create-squad',
    icon: Users,
    emoji: '⚽'
  },
  {
    name: 'PvP Trading',
    href: '/pvp',
    icon: Swords,
    emoji: '⚔️'
  },
  {
    name: 'Solo Play',
    href: '/solo',
    icon: Target,
    emoji: '🎯'
  },
  {
    name: 'Learn',
    href: '/learn',
    icon: BookOpen,
    emoji: '📚'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    emoji: '👤'
  }
];

export default function GamingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-20 xl:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="text-2xl">🏆</div>
              <span className="hidden xl:block text-xl font-bold text-primary">Flowyth</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200'
                        )}
                      >
                        <span className="text-xl lg:text-2xl">{item.emoji}</span>
                        <span className="hidden xl:block">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-card px-4 py-4 shadow-sm border-b border-border lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="-m-2.5"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
          <span className="sr-only">Open sidebar</span>
        </Button>
        <div className="flex-1 text-sm font-semibold leading-6 text-foreground">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="text-lg font-bold text-primary">Flowyth</span>
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-m-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 ring-1 ring-border">
                <div className="flex h-16 shrink-0 items-center">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-xl font-bold text-primary">Flowyth</span>
                  </Link>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                pathname === item.href
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200'
                              )}
                            >
                              <span className="text-xl">{item.emoji}</span>
                              <span>{item.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navigation.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                'flex flex-col items-center justify-center rounded-lg p-2 text-xs font-medium transition-colors duration-200 min-h-[60px]'
              )}
            >
              <span className="text-lg mb-1">{item.emoji}</span>
              <span className="text-xs leading-tight text-center">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}