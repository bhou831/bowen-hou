import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music',
  description: 'Music recommendations and album notes from Bowen Hou.',
  alternates: {
    canonical: '/music/',
  },
  openGraph: {
    title: 'Bowen Hou Music',
    description: 'Music recommendations and album notes from Bowen Hou.',
    url: 'https://bowen-hou.com/music/',
    type: 'website',
  },
};

export default function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
