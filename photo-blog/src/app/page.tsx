'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/slideshow');
        const data = await response.json();
        setImages(data.images);
      } catch (error) {
        console.error('Error fetching slideshow images:', error);
      }
    }
    
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((current) =>
        current === images.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="pl-8 pr-8 space-y-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
        Bowen Hou
      </h1>
      
      {/* Slideshow container */}
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
          {images.length > 0 && (
            <Image
              src={images[currentImageIndex]}
              alt={`Slideshow image ${currentImageIndex + 1}`}
              fill
              className="object-cover transition-opacity duration-500"
              priority
            />
          )}
          
          {/* Navigation dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex 
                    ? 'bg-white' 
                    : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Bio section - aligned with the slideshow width */}
      <div className="max-w-[1200px] mx-auto prose dark:prose-invert">
        <div className="mt-4 text-gray-800 dark:text-gray-200">
          <p>
            This is your bio section. You can write about yourself, your interests,
            and your background here.
          </p>
        </div>
      </div>
    </div>
  );
}