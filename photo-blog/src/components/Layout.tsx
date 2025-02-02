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
      <nav className="py-4 px-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex space-x-6">
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
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}