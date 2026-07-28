'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SLIDESHOW_IMAGES = Array.from(
  { length: 26 },
  (_, i) => `/images/slideshow/cover_page_${i + 1}.JPG`,
);

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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setImages(shuffleArray(SLIDESHOW_IMAGES));
  }, []);

  useEffect(() => {
    if (images.length === 0 || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((current) =>
        current === images.length - 1 ? 0 : current + 1,
      );
    }, 8000);

    return () => clearInterval(timer);
  }, [images.length, prefersReducedMotion]);

  return (
    <div className="space-y-8">
      <div className="w-full max-w-[1000px] mx-auto">
        <h1 className="text-2xl text-gray-900">Bowen Hou</h1>
      </div>

      {/* Slideshow container */}
      <div className="w-full max-w-[1000px] mx-auto">
        <div className="relative aspect-[4/3] bg-gray-200">
          <AnimatePresence mode="wait">
            {images.length > 0 && (
              <motion.div
                key={currentImageIndex}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  ease: [0.1, 0.3, 0.6, 1],
                }}
                className="absolute inset-0"
              >
                <Image
                  src={images[currentImageIndex]}
                  alt="Featured photograph by Bowen Hou"
                  fill
                  className="object-cover"
                  priority={currentImageIndex === 0}
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preload next image */}
          {images.length > 0 && currentImageIndex < images.length - 1 && (
            <link
              rel="preload"
              as="image"
              href={images[currentImageIndex + 1]}
            />
          )}
        </div>

        {/* Progress bar — below the image, always visible */}
        {images.length > 0 && (
          <div className="w-full h-px bg-gray-200 mt-2">
            <div
              key={currentImageIndex}
              className="slideshow-progress h-px bg-gray-400"
              style={{
                animation: prefersReducedMotion
                  ? 'none'
                  : 'slideshow-progress 8s linear forwards',
              }}
            />
          </div>
        )}
      </div>

      {/* Bio section */}
      <div className="max-w-[1000px] mx-auto prose">
        <div className="mt-4 text-gray-800">
          <p>
            I’m a senior software engineer at{' '}
            <a href="https://autodesk.com">Autodesk</a>, where I work on data
            quality assurance. Before that, I studied at{' '}
            <span
              className="ann ann-nw ann-blue ann-short-arrow"
              data-note="The Steel City"
            >
              <a href="https://cmu.edu">Carnegie Mellon</a>
            </span>{' '}
            and{' '}
            <span
              className="ann ann-nw ann-amber ann-short-arrow ann-mobile-only"
              data-note="Lehigh Valley"
            >
              <a href="https://ce.lafayette.edu">Lafayette College</a>
            </span>
            <span
              className="ann ann-s ann-amber ann-desktop-only"
              data-note="Lehigh Valley"
            >
              <a href="https://ce.lafayette.edu">Lafayette College</a>
            </span>
            .
          </p>
          <p>
            This site serves as an archive of my photos and music
            recommendations, along with the occasional blog post. I maintain
            this website and upload new content regularly.
          </p>
          <p>
            Why build this website? I used to post photos on Instagram, but its
            recent{' '}
            <a href="https://about.instagram.com/brand/layout">
              grid design update
            </a>{' '}
            and shift toward engagement-based recommendations made me think it
            is no longer a serious platform for photo sharing. The level of
            creator control I want over content layout and arrangement is still
            missing from other platforms like 500px, VSCO, etc. I hope you enjoy this page and become a regular visitor.
          </p>
        </div>
      </div>
    </div>
  );
}
