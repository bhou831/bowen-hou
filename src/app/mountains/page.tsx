import type { Metadata } from 'next';
import entries from '@/content/mountains/entries.json';
import MountainsGlobe, { type MountainEntry } from './MountainsGlobe';

export const metadata: Metadata = {
  title: 'Mountains',
  description:
    'Born in Yunnan, Bowen maps the mountains he has visited and dreams of exploring.',
  alternates: {
    canonical: '/mountains/',
  },
};

export default function MountainsPage() {
  return <MountainsGlobe entries={entries.entries as MountainEntry[]} />;
}
