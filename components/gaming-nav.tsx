'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  User,
  Swords,
  Trophy,
  Target,
  UserCircle, 

} from 'lucide-react';

const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/home',
    paths: ['/home']
  },
  {
    id: 'solo',
    label: 'Solo',
    icon: Target,
    href: '/solo',
    paths: ['/solo']
  },
  {
    id: 'pvp',
    label: 'PvP',
    icon: Swords,
    href: '/pvp',
    paths: ['/pvp']
  },
  {
    id: 'tournament',
    label: 'Tournament',
    icon: Trophy,
    href: '/tournaments',
    paths: ['/tournaments']
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserCircle,
    href: '/profile',
    paths: ['/profile']
  }
];

export default function GamingNav() {
  const pathname = usePathname();

  const isActive = (item: typeof navigationItems[0]) => {
    return item.paths.some(path => {
      if (path === '/') {
        return pathname === '/' ;
      }
      return pathname.startsWith(path);
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64">
        <div className="flex h-full flex-col bg-card border-r border-border">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-foreground text-lg">
                Flowyth
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className="ml-3">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 transition-colors",
                  "hover:bg-accent"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  active ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile bottom padding to prevent content overlap */}
      <div className="lg:hidden h-16" />
    </>
  );
}