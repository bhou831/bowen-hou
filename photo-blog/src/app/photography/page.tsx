'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
}

export default function Photography() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const collections: Collection[] = [
    {
      id: '1',
      title: 'Mountain Sunrise',
      description: 'A collection of sunrise photographs from various mountain peaks.',
      coverImage: '/collections/mountains/cover.jpg',
      images: ['/collections/mountains/1.jpg', '/collections/mountains/2.jpg']
    },
  ];

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {collections.map((collection) => (
          <div 
            key={collection.id}
            className="cursor-pointer group"
            onClick={() => handleCollectionClick(collection)}
          >
            <div className="relative aspect-[4/3] flex items-center justify-center">
              {/* Frame container */}
              <div className="relative w-full h-full">
                {/* Wooden frame image */}
                <Image
                  src="/images/frame.png"
                  alt="Wooden frame"
                  fill
                  className="object-contain"
                />
                {/* Photo container - adjust padding based on your frame image */}
                <div className="absolute inset-[10%] flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <Image
                      src={collection.coverImage}
                      alt={collection.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="mt-2 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
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