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
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-white"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(17,24,39,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.022)_1px,transparent_1px)] bg-[size:5rem_4rem]"
      />
      <nav
        className={`w-full border-b border-gray-200 sticky top-0 z-40 bg-white/90 backdrop-blur-sm transition-shadow duration-200 ${
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
