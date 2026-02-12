'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar with items aligned left */}
      <nav className="w-full border-b border-gray-200">
        <div className="pl-4 pr-4 md:pl-8 md:pr-8 flex justify-between items-center h-16 max-w-full">
          {/* Left-aligned navigation items */}
          <div className="flex space-x-4 md:space-x-5">
            <Link
              href="/"
              className={`pb-1 border-b-2 transition-colors ${
                isActive('/')
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-800 border-transparent hover:text-gray-600'
              }`}
            >
              Home
            </Link>
            <Link
              href="/photography"
              className={`pb-1 border-b-2 transition-colors ${
                isActive('/photography')
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-800 border-transparent hover:text-gray-600'
              }`}
            >
              Photograph
            </Link>
            <Link
              href="/music"
              className={`pb-1 border-b-2 transition-colors ${
                isActive('/music')
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-800 border-transparent hover:text-gray-600'
              }`}
            >
              Music
            </Link>
            <Link
              href="/journal"
              className={`pb-1 border-b-2 transition-colors ${
                isActive('/journal')
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-800 border-transparent hover:text-gray-600'
              }`}
            >
              Journal
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="w-full pl-4 pr-4 md:pl-8 md:pr-8 py-8">{children}</main>
    </div>
  );
}
