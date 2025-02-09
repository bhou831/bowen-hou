'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import albums from '@/content/music/albums.json';

interface Album {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  description: string;
  links: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
  };
}

export default function Music() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  return (
    <div className="w-full pl-8 pr-8">
      {/* Responsive grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {albums.albums.map((album) => (
          <div 
            key={album.id}
            className="w-full cursor-pointer mx-auto max-w-[250px]"
            onClick={() => setSelectedAlbum(album)}
          >
            {/* Album cover container */}
            <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={album.coverImage}
                alt={`${album.title} by ${album.artist}`}
                fill
                className="object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
            <div className="mt-3 text-left">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                {album.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {album.artist}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        {selectedAlbum && (
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
            {/* Rest of the modal code remains the same */}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}