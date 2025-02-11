'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
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
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedAlbum.title}
              </DialogTitle>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {selectedAlbum.artist}
              </p>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Album Cover */}
                <div className="relative w-full md:w-1/2 aspect-square shrink-0">
                  <Image
                    src={selectedAlbum.coverImage}
                    alt={`${selectedAlbum.title} by ${selectedAlbum.artist}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                {/* Album Details */}
                <div className="flex flex-col w-full md:w-1/2">
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedAlbum.description}
                  </p>

                  {/* Streaming Links */}
                  <div className="flex gap-4 mt-6">
                    {selectedAlbum.links.spotify && (
                      <a
                        href={selectedAlbum.links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Image
                          src="/images/icons/spotify.png"
                          alt="Listen on Spotify"
                          width={32}
                          height={32}
                          className="transition-opacity hover:opacity-80"
                        />
                      </a>
                    )}
                    {selectedAlbum.links.appleMusic && (
                      <a
                        href={selectedAlbum.links.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Image
                          src="/images/icons/apple-music.png"
                          alt="Listen on Apple Music"
                          width={32}
                          height={32}
                          className="transition-opacity hover:opacity-80"
                        />
                      </a>
                    )}
                    {selectedAlbum.links.youtube && (
                      <a
                        href={selectedAlbum.links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Image
                          src="/images/icons/youtube.png"
                          alt="Watch on YouTube"
                          width={32}
                          height={32}
                          className="transition-opacity hover:opacity-80"
                        />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}