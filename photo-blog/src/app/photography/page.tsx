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
    <div className="w-full">
      {/* Grid container with larger frames */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-12">
        {collections.map((collection) => (
          <div 
            key={collection.id}
            className="cursor-pointer group"
            onClick={() => handleCollectionClick(collection)}
          >
            {/* Frame container with fixed aspect ratio */}
            <div className="relative w-full aspect-[4/3] flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Frame image */}
                <Image
                  src="/images/frame.png"
                  alt="Frame"
                  fill
                  className="object-contain"
                />
                {/* Photo container with padding for frame */}
                <div className="absolute inset-[12%] flex items-center justify-center">
                  <div className="relative w-[80%] h-[80%] mx-auto">
                    <Image
                      src={collection.coverImage}
                      alt={collection.title}
                      fill
                      className="object-contain"
                      quality={100}
                    />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="mt-4 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
              {collection.title}
            </h3>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        {selectedCollection && (
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full bg-black/95 border-none p-0">
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
            
            <div className="relative h-[90vh] flex items-center justify-center">
              <button
                onClick={previousImage}
                className="absolute left-4 text-white hover:text-gray-300"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <div className="relative w-full h-full px-16">
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

              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <h3 className="text-xl font-medium">{selectedCollection.title}</h3>
                <p className="mt-2 max-w-2xl mx-auto">
                  {selectedCollection.description}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}