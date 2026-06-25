import collections from '@/content/photography/collections.json';

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
}

export function getCollections(): Collection[] {
  return collections.collections;
}

export function getCollectionById(id: string): Collection | undefined {
  return getCollections().find((collection) => collection.id === id);
}
