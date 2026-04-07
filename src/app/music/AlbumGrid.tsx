'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';

const COLUMN_STEPS = [1, 2, 3, 4, 6];

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

export default function AlbumGrid({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [columnStepIndex, setColumnStepIndex] = useState(3); // default: 4 cols

  const wheelAccum = useRef(0);
  const pinchStartDist = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Set initial column count based on viewport
  useEffect(() => {
    if (window.innerWidth < 768) setColumnStepIndex(1);
    else if (window.innerWidth < 1024) setColumnStepIndex(2);
    else if (window.innerWidth >= 1280) setColumnStepIndex(4);
    else setColumnStepIndex(3);
  }, []);

  // Non-passive wheel listener for trackpad pinch
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      if (wheelAccum.current > 50) {
        setColumnStepIndex((prev) =>
          Math.min(prev + 1, COLUMN_STEPS.length - 1),
        );
        wheelAccum.current = 0;
      } else if (wheelAccum.current < -50) {
        setColumnStepIndex((prev) => Math.max(prev - 1, 1));
        wheelAccum.current = 0;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Grid touch pinch handlers
  const handleGridTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
    }
  };

  const handleGridTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || pinchStartDist.current === null) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const diff = dist - pinchStartDist.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) {
        setColumnStepIndex((prev) => Math.max(prev - 1, 1));
      } else {
        setColumnStepIndex((prev) =>
          Math.min(prev + 1, COLUMN_STEPS.length - 1),
        );
      }
      pinchStartDist.current = dist;
    }
  };

  const handleGridTouchEnd = () => {
    pinchStartDist.current = null;
  };

  const cols = COLUMN_STEPS[columnStepIndex];
  const gap = cols <= 2 ? 'gap-8' : cols <= 4 ? 'gap-6' : 'gap-4';

  return (
    <div className="w-full pl-8 pr-8">
      <div
        ref={gridRef}
        className={`grid ${gap} transition-[gap] duration-300`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onTouchStart={handleGridTouchStart}
        onTouchMove={handleGridTouchMove}
        onTouchEnd={handleGridTouchEnd}
      >
        {albums.map((album) => (
          <div
            key={album.id}
            className="w-full cursor-pointer"
            onClick={() => setSelectedAlbum(album)}
          >
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <Image
                src={album.coverImage}
                alt={`${album.title} by ${album.artist}`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            {cols <= 4 && (
              <div className="mt-3">
                <h3 className="text-base text-center font-medium text-gray-900">
                  {album.title}
                </h3>
                <p className="text-sm text-center text-gray-600">
                  {album.artist}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog
        open={!!selectedAlbum}
        onOpenChange={() => setSelectedAlbum(null)}
      >
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
                  <p className="text-gray-700">{selectedAlbum.description}</p>

                  {/* Streaming Links */}
                  <div className="flex gap-3 mt-6">
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
