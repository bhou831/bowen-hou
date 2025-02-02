'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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

  // This would come from your S3 bucket or content management system
  const collections: Collection[] = [
    {
      id: '1',
      title: 'Mountain Sunrise',
      description: 'A collection of sunrise photographs from various mountain peaks.',
      coverImage: '/collections/mountains/cover.jpg',
      images: ['/collections/mountains/1.jpg', '/collections/mountains/2.jpg']
    },
    // Add more collections here
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
            <div className="relative aspect-[4/3] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-102">
              {/* Wooden frame effect */}
              <div className="absolute inset-0 border-[20px] border-[#8B4513] rounded-lg pointer-events-none" />
              <div className="relative w-full h-full">
                <Image
                  src={collection.coverImage}
                  alt={collection.title}
                  fill
                  className="object-cover rounded-sm"
                />
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
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          {selectedCollection && (
            <>
              <button
                onClick={previousImage}
                className="absolute left-4 text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <div className="relative w-full max-w-4xl h-[80vh]">
                <Image
                  src={selectedCollection.images[currentImageIndex]}
                  alt={selectedCollection.title}
                  fill
                  className="object-contain"
                />
              </div>
              
              <button
                onClick={nextImage}
                className="absolute right-4 text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <h3 className="text-xl font-medium">{selectedCollection.title}</h3>
                <p className="mt-2 max-w-2xl mx-auto">
                  {selectedCollection.description}
                </p>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}