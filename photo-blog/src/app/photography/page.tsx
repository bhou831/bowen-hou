'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collection, getCollections } from '@/lib/photo-utils';

export default function Photography() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
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
        prev === selectedCollection.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (selectedCollection) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedCollection.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Responsive grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {collections.map((collection) => (
          <div 
            key={collection.id}
            className="cursor-pointer group mx-auto w-full max-w-lg"
            onClick={() => handleCollectionClick(collection)}
          >
            {/* Simple container with aspect ratio and shadow */}
            <div className="relative w-full aspect-[4/3] shadow-lg hover:shadow-xl transition-all duration-300 border border-black/20 dark:border-white/20 rounded-lg overflow-hidden">
              <Image
                src={collection.coverImage}
                alt={collection.title}
                fill
                className="object-cover"
                quality={100}
              />
            </div>
            <h3 className="mt-4 text-center text-lg text-gray-900 dark:text-gray-100">
              {collection.title}
            </h3>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        {selectedCollection && (
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-black/95 border-none p-0">
            <DialogTitle className="sr-only">
              {selectedCollection.title} - Image {currentImageIndex + 1} of {selectedCollection.images.length}
            </DialogTitle>

            <button 
              onClick={() => setIsLightboxOpen(false)} 
              className="absolute top-4 right-4 text-white z-50 hover:text-gray-300"
            >
              <X className="w-6 h-6" />
              <span className="sr-only">Close gallery</span>
            </button>

            <div className="relative h-[95vh] flex flex-col md:flex-row">
              {/* Main Image Section */}
              <div className="flex-1 relative flex items-center justify-center min-h-[60vh] md:min-h-0">
                <button 
                  onClick={previousImage} 
                  className="absolute left-4 text-white hover:text-gray-300 z-10" 
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <div className="relative w-full h-full">
                  <Image 
                    src={selectedCollection.images[currentImageIndex]} 
                    alt={`${selectedCollection.title} - Image ${currentImageIndex + 1}`}
                    fill 
                    className="object-contain" 
                    quality={100}
                    priority
                  />
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
              <div className="md:w-80 bg-black/80 p-4 md:p-8 flex flex-col justify-end">
                <div className="text-white">
                  <h3 className="text-xl font-medium mb-4">{selectedCollection.title}</h3>
                  <p className="text-sm leading-relaxed">
                    {selectedCollection.description}
                  </p>
                  <p className="text-sm mt-4 text-gray-400">
                    Image {currentImageIndex + 1} of {selectedCollection.images.length}
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