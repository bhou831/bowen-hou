/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next';
import { Spectral } from 'next/font/google';
import './globals.css';
import Layout from '@/components/Layout';

const spectral = Spectral({
  subsets: ['latin'],
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
});

export const metadata: Metadata = {
  title: {
    default: 'Bowen Hou',
    template: '%s | Bowen Hou',
  },
  description:
    'Bowen Hou (侯博文) is a software engineer and photographer. This is his personal website, photo archive, journal, and music collection.',
  metadataBase: new URL('https://bowen-hou.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Bowen Hou',
    description:
      'Personal website of Bowen Hou (侯博文), software engineer and photographer.',
    url: 'https://bowen-hou.com',
    siteName: 'Bowen Hou',
    images: [
      {
        url: '/images/og/og.jpg',
        width: 900,
        height: 600,
        alt: 'Bowen Hou Photograph',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bowen Hou',
    description: 'Bio Page of Bowen Hou',
    creator: '@HarveyHBB',
    images: ['/images/og/og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Bowen Hou',
  alternateName: '侯博文',
  url: 'https://bowen-hou.com/',
  jobTitle: 'Senior Software Engineer',
  worksFor: {
    '@type': 'Organization',
    name: 'Autodesk',
    url: 'https://www.autodesk.com/',
  },
  alumniOf: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'Carnegie Mellon University',
      url: 'https://www.cmu.edu/',
    },
    {
      '@type': 'CollegeOrUniversity',
      name: 'Lafayette College',
      url: 'https://www.lafayette.edu/',
    },
  ],
  knowsAbout: [
    'Software engineering',
    'Data quality assurance',
    'Photography',
    'Civil engineering',
    'Urbanism',
  ],
  sameAs: ['https://x.com/HarveyHBB'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spectral.variable} suppressHydrationWarning>
      <body className={spectral.className} suppressHydrationWarning>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/syabro/neat-annotations/neat-annotations.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght@400;500;600&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
