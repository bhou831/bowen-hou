'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import { triggerHaptic } from '@/lib/haptics';

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

function AlbumCoverTilt({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;

    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;

    const rect = wrap.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const max = 40;

    card.classList.add('is-tilting');
    card.style.setProperty('--album-tilt-ry', `${((px - 0.5) * max).toFixed(2)}deg`);
    card.style.setProperty('--album-tilt-rx', `${((0.5 - py) * max).toFixed(2)}deg`);
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;

    card.classList.remove('is-tilting');
    card.style.setProperty('--album-tilt-rx', '0deg');
    card.style.setProperty('--album-tilt-ry', '0deg');
  };

  return (
    <div
      ref={wrapRef}
      className="album-tilt"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div
        ref={cardRef}
        className="album-tilt-card relative aspect-square overflow-hidden rounded-lg bg-white shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}

export default function AlbumGrid({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const handleAlbumOpen = (album: Album) => {
    triggerHaptic();
    setSelectedAlbum(album);
  };

  const handleAlbumOpenChange = (open: boolean) => {
    if (!open) {
      triggerHaptic();
      setSelectedAlbum(null);
    }
  };

  return (
    <div className="w-full">
      <div className="music-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 lg:gap-6 xl:gap-4">
        {albums.map((album) => (
          <button
            type="button"
            key={album.id}
            className="group w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-50"
            onClick={() => handleAlbumOpen(album)}
          >
            <AlbumCoverTilt>
              <Image
                src={album.coverImage}
                alt={`${album.title} by ${album.artist}`}
                fill
                className="object-cover"
              />
            </AlbumCoverTilt>
            <div className="mt-3">
              <h3 className="truncate text-center text-sm font-medium text-gray-900 md:text-base">
                {album.title}
              </h3>
              <p className="truncate text-center text-xs text-gray-600 md:text-sm">
                {album.artist}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedAlbum} onOpenChange={handleAlbumOpenChange}>
        {selectedAlbum && (
          <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {selectedAlbum.title}
              </DialogTitle>
              <p className="text-lg text-gray-600">{selectedAlbum.artist}</p>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Album Cover */}
                <div className="relative w-full md:w-[300px] md:h-[300px] md:flex-[0_0_300px] aspect-square">
                  <Image
                    src={selectedAlbum.coverImage}
                    alt={`${selectedAlbum.title} by ${selectedAlbum.artist}`}
                    fill
                    sizes="300px"
                    className="object-cover rounded-lg"
                  />
                </div>

                {/* Album Details */}
                <div className="flex flex-col w-full md:w-1/2">
                  <p className="whitespace-pre-line text-gray-700">
                    {selectedAlbum.description}
                  </p>

                  {/* Streaming Links */}
                  <div className="flex gap-3 mt-6">
                    {selectedAlbum.links.spotify && (
                      <a
                        href={selectedAlbum.links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={triggerHaptic}
                        className="flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4"
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
                        onClick={triggerHaptic}
                        className="flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4"
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
                        onClick={triggerHaptic}
                        className="flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4"
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
      <style jsx global>{`
        .album-tilt {
          perspective: 900px;
        }

        .album-tilt-card {
          transform: rotateX(var(--album-tilt-rx, 0deg))
            rotateY(var(--album-tilt-ry, 0deg));
          transform-style: preserve-3d;
          transition:
            transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 300ms ease;
          will-change: transform;
        }

        @media (hover: hover) and (pointer: fine) {
          .album-tilt-card.is-tilting {
            transition:
              transform 160ms ease-out,
              box-shadow 300ms ease;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .album-tilt-card {
            transform: none !important;
            transition: none !important;
          }
        }

        @media (orientation: landscape) and (max-width: 767px) {
          .music-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
