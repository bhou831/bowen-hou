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
    { href: '/photography', label: 'Photograph' },
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
    `relative z-10 inline-flex h-8 items-center justify-center rounded-full px-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4 focus-visible:ring-offset-white md:px-3.5 md:text-base ${
      isActive(path)
        ? 'font-medium text-gray-950'
        : 'text-gray-700 hover:text-gray-950'
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
          <div className="relative inline-flex items-center gap-1 rounded-full p-1">
            <span
              aria-hidden="true"
              className="absolute bottom-1 top-1 z-0 overflow-hidden rounded-full border border-white/75 bg-white/30 shadow-[0_1px_16px_rgba(15,23,42,0.13),inset_0_0_1px_1px_rgba(255,255,255,0.55),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)] backdrop-blur-2xl transition-[transform,width,opacity] duration-200 ease-out before:absolute before:inset-0 before:scale-[1.65] before:bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.96),rgba(255,255,255,0.34)_34%,rgba(209,213,219,0.32)_68%,rgba(255,255,255,0.58))] before:opacity-85 before:blur-[16px] before:content-[''] motion-reduce:transition-none"
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

      <main className="w-full pl-4 pr-4 md:pl-8 md:pr-8 py-8">{children}</main>
    </div>
  );
}
