'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Collection, getCollections } from '@/lib/photo-utils';
import { triggerHaptic } from '@/lib/haptics';

const COLUMN_STEPS = [1, 2, 3, 4, 6];

export default function Photography() {
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [columnStepIndex, setColumnStepIndex] = useState(3); // default: 4 cols

  const touchStartX = useRef<number | null>(null);
  const wheelAccum = useRef(0);
  const pinchStartDist = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const collections = getCollections();

  // Set initial column count based on viewport
  useEffect(() => {
    if (window.innerWidth < 640) setColumnStepIndex(0);
    else if (window.innerWidth < 1024) setColumnStepIndex(1);
    else setColumnStepIndex(3);
  }, []);

  // Non-passive wheel listener for trackpad pinch (ctrlKey + scroll)
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
        setColumnStepIndex((prev) => Math.max(prev - 1, 0));
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
        // spreading fingers = zoom in = fewer columns
        setColumnStepIndex((prev) => Math.max(prev - 1, 0));
      } else {
        // pinching in = zoom out = more columns
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

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setCurrentImageIndex(0);
    setIsLightboxOpen(true);
  };

  const nextImage = () => {
    if (selectedCollection) {
      setCurrentImageIndex((prev) =>
        prev === selectedCollection.images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const previousImage = () => {
    if (selectedCollection) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedCollection.images.length - 1 : prev - 1,
      );
    }
  };

  // Keyboard navigation in lightbox
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

  // Lightbox touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) touchStartX.current = e.touches[0].clientX;
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

  const cols = COLUMN_STEPS[columnStepIndex];
  const gap = cols <= 2 ? 'gap-8' : cols <= 4 ? 'gap-6' : 'gap-4';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div
        ref={gridRef}
        className={`grid ${gap} p-1 transition-[gap] duration-300`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onTouchStart={handleGridTouchStart}
        onTouchMove={handleGridTouchMove}
        onTouchEnd={handleGridTouchEnd}
      >
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="cursor-pointer group mx-auto w-full transition-all duration-300 ease-in-out"
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
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {cols <= 4 && (
              <div className="mt-3 relative inline-block group">
                <h3 className="text-left text-md text-gray-700 font-light tracking-wide inline-block">
                  {collection.title}
                </h3>
                <div className="h-px bg-gray-400 mt-1 w-0 group-hover:w-full transition-all duration-500" />
              </div>
            )}
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
