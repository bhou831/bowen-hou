'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Collection, getCollections } from '@/lib/photo-utils';

export default function Photography() {
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const collections = getCollections();

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

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Artistic Minimalist Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 p-2">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="cursor-pointer group mx-auto w-full transition-all duration-500 ease-in-out"
            onClick={() => handleCollectionClick(collection)}
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
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
            <div className="mt-3 relative">
              <h3 className="text-left text-md text-gray-700 dark:text-gray-200 font-light tracking-wide">
                {collection.title}
              </h3>
              <div className="h-px w-0 bg-gray-400 dark:bg-gray-500 group-hover:w-1/3 transition-all duration-500 mt-1"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        {selectedCollection && (
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-black/95 border-none p-0 overflow-hidden">
            <DialogTitle className="sr-only">
              {selectedCollection.title} - Image {currentImageIndex + 1} of{' '}
              {selectedCollection.images.length}
            </DialogTitle>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="fixed top-2 right-2 text-white z-50 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close gallery</span>
            </button>

            {/* Mobile-first approach with flex-col by default, flex-row only on desktop */}
            <div className="h-screen xl:min-h-0 xl:h-[95vh] flex flex-col xl:flex-row">
              {/* Main Image Section */}
              <div className="flex-1 relative flex items-center justify-center min-h-[50vh] xl:min-h-0 py-6 xl:py-0">
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

              {/* Description Panel - Column layout for mobile and iPad portrait */}
              <div className="xl:w-80 bg-black/80 p-4 xl:p-8 flex justify-center flex-col xl:max-h-full overflow-y-auto">
                {/* Image counter moved to the top for mobile visibility */}
                <div className="text-white">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-medium">
                      {selectedCollection.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {currentImageIndex + 1}/{selectedCollection.images.length}
                    </p>
                  </div>

                  <p className="text-md font-light leading-relaxed py-2 pb-10 mb-4">
                    {selectedCollection.description}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
