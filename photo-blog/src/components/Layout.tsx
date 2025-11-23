'use client';

import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar with items aligned left */}
      <nav className="w-full border-b border-gray-200">
        <div className="pl-4 pr-4 md:pl-8 md:pr-8 flex justify-between items-center h-16 max-w-full">
          {/* Left-aligned navigation items */}
          <div className="flex space-x-4 md:space-x-5">
            <Link
              href="/"
              className="text-gray-800 hover:text-gray-600"
            >
              Home
            </Link>
            <Link
              href="/photography"
              className="text-gray-800 hover:text-gray-600"
            >
              Photograph
            </Link>
            <Link
              href="/music"
              className="text-gray-800 hover:text-gray-600"
            >
              Music
            </Link>
            <Link
              href="/journal"
              className="text-gray-800 hover:text-gray-600"
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
