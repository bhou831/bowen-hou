'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const imageList = Array.from({ length: 25 }, (_, i) => 
      `/images/slideshow/cover_page_${i + 1}.JPG`
    );

    // Shuffle the images on each page load
    const shuffledImages = shuffleArray(imageList);
    setImages(shuffledImages);

    // Check if banner has been dismissed
    const bannerDismissed = localStorage.getItem('darkModeBannerDismissed');
    if (!bannerDismissed) {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((current) =>
        current === images.length - 1 ? 0 : current + 1,
      );
    }, 8000);

    return () => clearInterval(timer);
  }, [images.length]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('darkModeBannerDismissed', 'true');
  };

  return (
    <div className="px-2 sm:px-8 space-y-8">
      {/* Dismissible Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1000px] mx-auto bg-gray-100 border border-gray-300 rounded-lg p-4 flex items-center justify-between gap-4"
          >
            <p className="text-sm text-gray-700 flex-1">
              I've removed dark mode entirely on 11-22-25 as it simply did not look good on photographic content. Enjoy the site in light mode!
            </p>
            <button
              onClick={handleDismissBanner}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-2xl text-gray-900">Bowen Hou</h1>

      {/* Slideshow container */}
      <div className="w-full max-w-[1000px] mx-auto">
        <div className="relative aspect-[4/3] bg-gray-200">
          <AnimatePresence mode="wait">
            {images.length > 0 && (
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.1, 0.3, 0.6, 1],
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
      <div className="max-w-[1000px] mx-auto prose">
        <div className="mt-4 text-gray-800">
          <p>
            I am a senior software engineer for{' '}
            <a href="https://autodesk.com">Autodesk</a> working on data quality
            assurance. I had a masters degree in Civil Engineering and
            Engineering & Tech Management at{' '}
            <a href="https://cmu.edu">Carnegie Mellon</a> and a bachlars degree
            in Civil Engineering from{' '}
            <a href="https://ce.lafayette.edu">Lafayette College</a>.
          </p>
          <p>
            This site serves as an archive of my photos and music
            recommendations, sometimes random blog posts. I will maintain this
            website and upload new content regularly.
          </p>
          <p>
            Why build this website? I used to post photos on instagram, recent{' '}
            <a href="https://about.instagram.com/brand/layout">
              grid design update
            </a>{' '}
            and their focus towards engagement based recommendation makes me to
            think this is no longer a serious platform for photo sharing, and
            other platforms like <a href="https://500px.com/">500px</a> still
            does not provide a finer creator control over content layout and
            arrangement. Hope you enjoy this page and be a regular visitor.
          </p>
        </div>
      </div>
    </div>
  );
}
