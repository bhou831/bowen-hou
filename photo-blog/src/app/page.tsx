'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
    }, 8000);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="px-2 sm:px-8 space-y-8">
      <h1 className="text-2xl text-gray-900 dark:text-gray-100">
        Bowen Hou
      </h1>
      
      {/* Slideshow container */}
      <div className="w-full max-w-[1000px] mx-auto">
        <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-800">
          <AnimatePresence mode="wait">
            {images.length > 0 && (
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.1, 0.3, 0.6, 1] // Custom easing for a more natural fade
                }}
                className="absolute inset-0"
              >
                <Image 
                  src={images[currentImageIndex]} 
                  alt={`Slideshow image ${currentImageIndex + 1}`}
                  fill 
                  className="object-cover"
                  priority
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bio section - aligned with the slideshow width */}
      <div className="max-w-[1000px] mx-auto prose dark:prose-invert">
        <div className="mt-4 text-gray-800 dark:text-gray-200">
          <p>I am an software engineer for <a href="https://autodesk.com">Autodesk</a> and I work on data quality assurance. I had a masters degree in Civil Engineering and Engineering & Tech Management at <a href="https://cmu.edu">Carnegie Mellon</a> and a bachlars degree in Civil Engineering from <a href="https://ce.lafayette.edu">Lafayette College</a>.</p>
          <p>This site serves as an archive of my photos and music recommendations, sometimes random blog posts. I will maintain this website and upload new content regularly.</p>
          <p>Why build this website? I used to post photos on instagram, recent <a href="https://about.instagram.com/brand/layout">grid design update</a> and their focus towards engagement based recommendation makes me to think this is no longer a serious platform for photo sharing, and other platforms like <a href="https://500px.com/">500px</a> still does not provide a finer creator control over content layout and arrangement. Hope you enjoy this page and be a regular visitor.</p>
        </div>
      </div>
    </div>
  );
}