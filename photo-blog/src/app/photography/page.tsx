'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Collection, getCollections } from '@/lib/photo-utils';

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export default function Photography() {
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const collections = getCollections();

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setCurrentImageIndex(0);
    setIsLightboxOpen(true);
  };

  const nextImage = () => {
    if (selectedCollection) {
      triggerHaptic();
      setCurrentImageIndex((prev) =>
        prev === selectedCollection.images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const previousImage = () => {
    if (selectedCollection) {
      triggerHaptic();
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedCollection.images.length - 1 : prev - 1,
      );
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen || !selectedCollection) return;

    const len = selectedCollection.images.length;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        triggerHaptic();
        setCurrentImageIndex((prev) => (prev === len - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        triggerHaptic();
        setCurrentImageIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, selectedCollection]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else previousImage();
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Artistic Minimalist Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 p-1">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="cursor-pointer group mx-auto w-full transition-all duration-500 ease-in-out"
            onClick={() => handleCollectionClick(collection)}
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-gray-100">
              <div className="absolute inset-0">
                <Image
                  src={collection.coverImage}
                  alt={collection.title}
                  fill
                  className="object-cover"
                  quality={90}
                />
              </div>

              {/* Artistic overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Title with artistic underline effect */}
            <div className="mt-3 relative inline-block group">
              <h3 className="text-left text-md text-gray-700 font-light tracking-wide inline-block">
                {collection.title}
              </h3>
              <div className="h-px bg-gray-400 mt-1 w-0 group-hover:w-full transition-all duration-500"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        {selectedCollection && (
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-black/75 border-none p-0 overflow-hidden">
            <DialogTitle className="sr-only">
              {selectedCollection.title} - Image {currentImageIndex + 1} of{' '}
              {selectedCollection.images.length}
            </DialogTitle>

            <div className="h-screen xl:min-h-0 xl:h-[95vh] flex flex-col xl:flex-row">
              {/* Main Image Section */}
              <div
                className="flex-1 relative flex items-center justify-center min-h-[50vh] xl:min-h-0 py-6 xl:py-0"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <button
                  onClick={previousImage}
                  className="absolute left-4 text-white hover:text-gray-300 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full max-w-[90vw] xl:max-w-none max-h-[60vh] xl:max-h-none">
                    <Image
                      src={selectedCollection.images[currentImageIndex]}
                      alt={`${selectedCollection.title} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                      quality={100}
                      loading="lazy"
                    />
                  </div>
                </div>

                <button
                  onClick={nextImage}
                  className="absolute right-4 text-white hover:text-gray-300"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              {/* Description Panel */}
              <div className="xl:w-80 bg-black/75 p-4 xl:p-8 flex justify-center flex-col xl:max-h-full overflow-y-auto">
                <div className="text-white">
                  <h3 className="text-xl font-medium mb-3">
                    {selectedCollection.title}
                  </h3>

                  {/* Progress bar */}
                  <div className="w-full h-px bg-white/20">
                    <div
                      className="h-px bg-white/60 transition-all duration-300 ease-out"
                      style={{
                        width: `${((currentImageIndex + 1) / selectedCollection.images.length) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="text-md font-light leading-relaxed py-2 pb-10 mb-4 mt-4">
                    {selectedCollection.description}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <style jsx global>{`
        [type='button'].absolute.right-4.top-4 svg {
          color: white !important;
        }
      `}</style>
    </div>
  );
}
