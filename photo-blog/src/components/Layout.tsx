'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation bar with items aligned left */}
      <nav className="w-full border-b border-gray-200 dark:border-gray-800">
        <div className="pl-4 pr-4 md:pl-8 md:pr-8 flex justify-between items-center h-16 max-w-full">
          {/* Left-aligned navigation items */}
          <div className="flex space-x-4 md:space-x-5">
            <Link
              href="/"
              className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Home
            </Link>
            <Link
              href="/photography"
              className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Photograph
            </Link>
            <Link
              href="/music"
              className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Music
            </Link>
            <Link
              href="/journal"
              className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
            >
              Journal
            </Link>
          </div>

          {/* Right-aligned theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 ml-2 md:ml-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="w-full pl-4 pr-4 md:pl-8 md:pr-8 py-8">{children}</main>
    </div>
  );
}
