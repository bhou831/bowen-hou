'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mountHaptic, triggerHaptic } from '@/lib/haptics';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const navLabelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [activePill, setActivePill] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/photography', label: 'Photography' },
    { href: '/music', label: 'Music' },
    { href: '/journal', label: 'Journal' },
  ];

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

  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => isActive(item.href)),
  );

  const updateActivePill = useCallback(() => {
    const activeItem = navItemRefs.current[activeIndex];
    const activeLabel = navLabelRefs.current[activeIndex];
    if (!activeItem || !activeLabel) return;

    const leftPadding = 19;
    const rightPadding = 11;
    const labelLeft = activeItem.offsetLeft + activeLabel.offsetLeft;
    const width = activeLabel.offsetWidth + leftPadding + rightPadding;

    setActivePill({
      left: labelLeft - leftPadding,
      width,
      ready: true,
    });
  }, [activeIndex]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateActivePill);
    window.addEventListener('resize', updateActivePill);

    void document.fonts?.ready.then(updateActivePill);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateActivePill);
    };
  }, [updateActivePill]);

  const navLinkClassName = (path: string) =>
    `relative z-10 inline-flex h-11 items-center justify-center rounded-full px-2.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:px-3.5 md:text-base ${
      isActive(path)
        ? 'font-medium text-gray-950'
        : 'text-gray-700 hover:text-gray-950'
    }`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-md bg-gray-950 px-4 py-2 text-sm text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-white"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(17,24,39,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.022)_1px,transparent_1px)] bg-[size:5rem_4rem]"
      />
      <nav
        aria-label="Primary"
        className={`w-full border-b border-gray-200 sticky top-0 z-40 bg-white/90 backdrop-blur-sm transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="pl-4 pr-4 md:pl-8 md:pr-8 flex justify-between items-center h-16 max-w-full">
          <div className="relative inline-flex items-center gap-1 rounded-full p-1">
            <span
              aria-hidden="true"
              className="absolute bottom-2 top-2 z-0 overflow-hidden rounded-full border border-white/75 bg-white/35 shadow-[0_1px_8px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(15,23,42,0.04)] backdrop-blur-2xl transition-[transform,width,opacity] duration-200 ease-out before:absolute before:inset-0 before:bg-[linear-gradient(110deg,rgba(255,255,255,0.72),rgba(255,255,255,0.22)_46%,rgba(226,232,240,0.3))] before:opacity-80 before:content-[''] motion-reduce:transition-none"
              style={{
                opacity: activePill.ready ? 1 : 0,
                transform: `translateX(${activePill.left}px)`,
                width: activePill.width,
              }}
            />
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                ref={(node) => {
                  navItemRefs.current[index] = node;
                }}
                onClick={triggerHaptic}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={navLinkClassName(item.href)}
              >
                <span
                  ref={(node) => {
                    navLabelRefs.current[index] = node;
                  }}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main
        id="main-content"
        tabIndex={-1}
        className="w-full pl-4 pr-4 py-8 focus:outline-none md:pl-8 md:pr-8"
      >
        {children}
      </main>
    </div>
  );
}
