import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Essays and notes from Bowen Hou on sustainability, cities, technology, and everyday observations.',
  alternates: {
    canonical: '/journal/',
  },
  openGraph: {
    title: 'Bowen Hou Journal',
    description:
      'Essays and notes from Bowen Hou on sustainability, cities, technology, and everyday observations.',
    url: 'https://bowen-hou.com/journal/',
    type: 'website',
  },
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
