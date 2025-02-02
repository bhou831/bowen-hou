'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { X } from 'lucide-react';

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

  // This would come from your content management system
  const albums: Album[] = [
    {
      id: '1',
      title: 'Album Name',
      artist: 'Artist Name',
      coverImage: '/albums/album1.jpg',
      description: 'Why I love this album...',
      links: {
        spotify: 'https://spotify.com/album/...',
        appleMusic: 'https://music.apple.com/album/...',
        youtube: 'https://youtube.com/playlist/...'
      }
    },
    // Add more albums here
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {albums.map((album) => (
          <div 
            key={album.id}
            className="cursor-pointer group"
            onClick={() => setSelectedAlbum(album)}
          >
            <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform duration-200 hover:scale-105">
              <Image
                src={album.coverImage}
                alt={`${album.title} by ${album.artist}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-2 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {album.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {album.artist}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Album Detail Modal */}
      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        {selectedAlbum && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6 relative">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="absolute top-4 right-4"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
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
                  
                  <div className="mt-4 flex gap-4">
                    {selectedAlbum.links.spotify && (
                      <a
                        href={selectedAlbum.links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-600"
                      >
                        Spotify
                      </a>
                    )}
                    {selectedAlbum.links.appleMusic && (
                      <a
                        href={selectedAlbum.links.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600"
                      >
                        Apple Music
                      </a>
                    )}
                    {selectedAlbum.links.youtube && (
                      <a
                        href={selectedAlbum.links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-600"
                      >
                        YouTube
                      </a>
                    )}
                  </div>

                  <p className="mt-4 text-gray-700 dark:text-gray-300">
                    {selectedAlbum.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}