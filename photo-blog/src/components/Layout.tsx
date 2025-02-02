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
      {/* Full-width nav bar */}
      <nav className="w-full border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side navigation */}
            <div className="flex space-x-8">
              <Link href="/" className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                Home
              </Link>
              <Link href="/photography" className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                Photography
              </Link>
              <Link href="/music" className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                Music
              </Link>
              <Link href="/journal" className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                Journal
              </Link>
            </div>
            
            {/* Right side theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main content with same padding as nav */}
      <main className="container mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}