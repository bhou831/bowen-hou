'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { mountHaptic, triggerHaptic } from '@/lib/haptics';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    mountHaptic();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinkClassName = (path: string) =>
    `pb-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-50 ${
      isActive(path)
        ? 'text-gray-900 border-gray-900'
        : 'text-gray-800 border-transparent hover:text-gray-600'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav
        className={`w-full border-b border-gray-200 sticky top-0 z-40 bg-gray-50 transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="pl-4 pr-4 md:pl-8 md:pr-8 flex justify-between items-center h-16 max-w-full">
          <div className="flex space-x-4 md:space-x-5">
            <Link
              href="/"
              onClick={triggerHaptic}
              className={navLinkClassName('/')}
            >
              Home
            </Link>
            <Link
              href="/photography"
              onClick={triggerHaptic}
              className={navLinkClassName('/photography')}
            >
              Photograph
            </Link>
            <Link
              href="/music"
              onClick={triggerHaptic}
              className={navLinkClassName('/music')}
            >
              Music
            </Link>
            <Link
              href="/journal"
              onClick={triggerHaptic}
              className={navLinkClassName('/journal')}
            >
              Journal
            </Link>
          </div>
        </div>
      </nav>

      <main className="w-full pl-4 pr-4 md:pl-8 md:pr-8 py-8">{children}</main>
    </div>
  );
}
