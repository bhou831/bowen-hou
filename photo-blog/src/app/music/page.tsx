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
      {/* Grid container */}
      <div className="w-full">
        <div className="grid grid-cols-4 gap-8">
          {albums.albums.map((album) => (
            <div 
              key={album.id}
              className="cursor-pointer group w-full max-w-[250px]"
              onClick={() => setSelectedAlbum(album)}
            >
              {/* Album cover container */}
              <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={album.coverImage}
                  alt={`${album.title} by ${album.artist}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              {/* Album info */}
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
      </div>

      {/* Album detail modal */}
      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        {selectedAlbum && (
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
            <DialogTitle className="sr-only">
              {selectedAlbum.title} by {selectedAlbum.artist}
            </DialogTitle>
            
            <button
              onClick={() => setSelectedAlbum(null)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
              <span className="sr-only">Close</span>
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Album cover */}
              <div className="relative w-full md:w-64 aspect-square">
                <Image
                  src={selectedAlbum.coverImage}
                  alt={`${selectedAlbum.title} by ${selectedAlbum.artist}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedAlbum.title}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {selectedAlbum.artist}
                </p>
                
                {/* Music service links */}
                <div className="mt-4 flex gap-4">
                  {selectedAlbum.links.spotify && (
                    <a
                      href={selectedAlbum.links.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-6 h-6"
                    >
                      <Image
                        src="/images/icons/spotify.png"
                        alt="Listen on Spotify"
                        fill
                        className="object-contain"
                      />
                    </a>
                  )}
                  {selectedAlbum.links.appleMusic && (
                    <a
                      href={selectedAlbum.links.appleMusic}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-6 h-6"
                    >
                      <Image
                        src="/images/icons/apple-music.png"
                        alt="Listen on Apple Music"
                        fill
                        className="object-contain"
                      />
                    </a>
                  )}
                  {selectedAlbum.links.youtube && (
                    <a
                      href={selectedAlbum.links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-6 h-6"
                    >
                      <Image
                        src="/images/icons/youtube.png"
                        alt="Watch on YouTube"
                        fill
                        className="object-contain"
                      />
                    </a>
                  )}
                </div>

                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  {selectedAlbum.description}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}