'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    // These will be your featured images
    '/images/featured/1.jpg',
    '/images/featured/2.jpg',
    '/images/featured/3.jpg',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((current) =>
        current === images.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="space-y-8">
      <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
        <Image
          src={images[currentImageIndex]}
          alt="Featured photograph"
          fill
          className="object-cover transition-opacity duration-500"
          priority
        />
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold">Bowen Hou</h1>
        <div className="mt-4">
          <p>
            This is your bio section. You can write about yourself, your interests,
            and your background here.
          </p>
        </div>
      </div>
    </div>
  );
}