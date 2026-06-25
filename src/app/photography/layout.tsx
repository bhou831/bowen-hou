import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photography',
  description:
    'Photo collections by Bowen Hou, including travel, landscape, city, and personal photography.',
  alternates: {
    canonical: '/photography/',
  },
  openGraph: {
    title: 'Bowen Hou Photography',
    description:
      'Photo collections by Bowen Hou, including travel, landscape, city, and personal photography.',
    url: 'https://bowen-hou.com/photography/',
    type: 'website',
  },
};

export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
