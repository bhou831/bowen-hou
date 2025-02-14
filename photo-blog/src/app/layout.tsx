import type { Metadata } from 'next';
import { Spectral } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Layout from '@/components/Layout';

const spectral = Spectral({
  subsets: ['latin'],
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
});

export const metadata: Metadata = {
  title: 'Bowen Hou',
  description: 'Bio Page of Bowen Hou',
  metadataBase: new URL('https://bowen-hou.com'), 
  openGraph: {
    title: 'Bowen Hou',
    description: 'Bio Page of Bowen Hou',
    url: 'https://bowen-hou.com',
    siteName: 'Bowen Hou',
    images: [
      {
        url: '/images/og/og.jpg',
        width: 800,
        height: 400,
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
    creator: '@yourtwitterhandle',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={spectral.variable}>
      <body className={spectral.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}