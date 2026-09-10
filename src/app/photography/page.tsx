'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Info, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collection, getCollections } from '@/lib/photo-utils';
import { triggerHaptic } from '@/lib/haptics';

export default function Photography() {
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isRotateHintVisible, setIsRotateHintVisible] = useState(false);
  const [isSwipeCueVisible, setIsSwipeCueVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const swipeAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const sheetTouchStartY = useRef<number | null>(null);
  const descriptionOpenButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionSheetToggleRef = useRef<HTMLButtonElement>(null);
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null);
  const wasDescriptionOpen = useRef(false);
  const hasShownRotateHint = useRef(false);
  const hasShownSwipeCue = useRef(false);

  const collections = getCollections();

  const handleCollectionClick = (
    collection: Collection,
    trigger: HTMLButtonElement,
  ) => {
    triggerHaptic();
    lightboxTriggerRef.current = trigger;
    setSelectedCollection(collection);
    setCurrentImageIndex(0);
    setIsDescriptionOpen(false);
    setIsRotateHintVisible(false);
    setIsSwipeCueVisible(false);
    hasShownRotateHint.current = false;
    hasShownSwipeCue.current = false;
    setIsLightboxOpen(true);
  };

  const handleLightboxOpenChange = (open: boolean) => {
    if (!open) {
      triggerHaptic();
      setIsLightboxOpen(false);
      setIsDescriptionOpen(false);
      setIsRotateHintVisible(false);
      setIsSwipeCueVisible(false);
    } else {
      setIsLightboxOpen(true);
    }
  };

  const nextImage = () => {
    if (selectedCollection) {
      triggerHaptic();
      setIsDescriptionOpen(false);
      setIsRotateHintVisible(false);
      setIsSwipeCueVisible(false);
      setCurrentImageIndex((prev) =>
        prev === selectedCollection.images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const getImageIndex = (offset: number) => {
    if (!selectedCollection) return 0;
    const { length } = selectedCollection.images;
    return (currentImageIndex + offset + length) % length;
  };

  const completeSwipe = (direction: 1 | -1) => {
    if (!selectedCollection || isSwipeAnimating) return;

    triggerHaptic();
    setIsDescriptionOpen(false);
    setIsRotateHintVisible(false);
    setIsSwipeCueVisible(false);
    setIsDraggingImage(false);
    setIsSwipeAnimating(true);
    setDragOffset(
      direction * -(carouselRef.current?.clientWidth ?? window.innerWidth),
    );

    swipeAnimationTimeout.current = setTimeout(() => {
      setCurrentImageIndex(
        (prev) =>
          (prev + direction + selectedCollection.images.length) %
          selectedCollection.images.length,
      );
      setDragOffset(0);
      setIsSwipeAnimating(false);
      swipeAnimationTimeout.current = null;
    }, 240);
  };

  const previousImage = () => {
    if (selectedCollection) {
      triggerHaptic();
      setIsDescriptionOpen(false);
      setIsRotateHintVisible(false);
      setIsSwipeCueVisible(false);
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedCollection.images.length - 1 : prev - 1,
      );
    }
  };

  useEffect(() => {
    if (!isLightboxOpen || !selectedCollection || hasShownRotateHint.current) {
      return;
    }

    const currentImage = selectedCollection.images[currentImageIndex];
    const image = new window.Image();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const showHintIfHelpful = () => {
      const isSubDesktop = window.matchMedia('(max-width: 1279px)').matches;
      const isPortraitViewport = window.matchMedia(
        '(orientation: portrait)',
      ).matches;
      const isLandscapePhoto = image.naturalWidth > image.naturalHeight;

      if (isSubDesktop && isPortraitViewport && isLandscapePhoto) {
        hasShownRotateHint.current = true;
        setIsRotateHintVisible(true);
        timeoutId = setTimeout(() => setIsRotateHintVisible(false), 3500);
      }
    };

    image.onload = showHintIfHelpful;
    image.src = currentImage;

    return () => {
      image.onload = null;
      setIsRotateHintVisible(false);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentImageIndex, isLightboxOpen, selectedCollection]);

  useEffect(() => {
    if (isDescriptionOpen) {
      descriptionSheetToggleRef.current?.focus({ preventScroll: true });
    } else if (wasDescriptionOpen.current && isLightboxOpen) {
      descriptionOpenButtonRef.current?.focus({ preventScroll: true });
    }

    wasDescriptionOpen.current = isDescriptionOpen;
  }, [isDescriptionOpen, isLightboxOpen]);

  useEffect(() => {
    if (
      !isLightboxOpen ||
      !selectedCollection ||
      selectedCollection.images.length < 2 ||
      hasShownSwipeCue.current
    ) {
      return;
    }

    const isSubDesktop = window.matchMedia('(max-width: 1279px)').matches;
    if (!isSubDesktop) return;

    hasShownSwipeCue.current = true;
    const startTimeoutId = setTimeout(() => setIsSwipeCueVisible(true), 550);
    const endTimeoutId = setTimeout(() => setIsSwipeCueVisible(false), 1750);

    return () => {
      clearTimeout(startTimeoutId);
      clearTimeout(endTimeoutId);
      setIsSwipeCueVisible(false);
    };
  }, [isLightboxOpen, selectedCollection]);

  useEffect(() => {
    return () => {
      if (swipeAnimationTimeout.current) {
        clearTimeout(swipeAnimationTimeout.current);
      }
    };
  }, []);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!isLightboxOpen || !selectedCollection) return;
    const len = selectedCollection.images.length;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        triggerHaptic();
        setIsDescriptionOpen(false);
        setIsRotateHintVisible(false);
        setIsSwipeCueVisible(false);
        setCurrentImageIndex((prev) => (prev === len - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        triggerHaptic();
        setIsDescriptionOpen(false);
        setIsRotateHintVisible(false);
        setIsSwipeCueVisible(false);
        setCurrentImageIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, selectedCollection]);

  // Lightbox touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !isSwipeAnimating) {
      setIsSwipeCueVisible(false);
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = null;
      setIsDraggingImage(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      isSwipeAnimating
    ) {
      return;
    }

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (isHorizontalSwipe.current) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const carouselWidth = carouselRef.current?.clientWidth ?? window.innerWidth;
    const shouldChangeImage =
      isHorizontalSwipe.current && Math.abs(deltaX) > carouselWidth * 0.16;

    if (shouldChangeImage) {
      completeSwipe(deltaX < 0 ? 1 : -1);
    } else {
      setIsDraggingImage(false);
      setDragOffset(0);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) sheetTouchStartY.current = e.touches[0].clientY;
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (sheetTouchStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - sheetTouchStartY.current;
    if (diff > 50) {
      triggerHaptic();
      setIsDescriptionOpen(false);
    }
    sheetTouchStartY.current = null;
  };

  return (
    <div className="w-full">
      <h1 className="sr-only">Photography</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 xl:gap-6 p-1">
        {collections.map((collection, index) => (
          <button
            type="button"
            key={collection.id}
            className="group mx-auto w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-50"
            onClick={(event) =>
              handleCollectionClick(collection, event.currentTarget)
            }
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-gray-100">
              <div className="absolute inset-0">
                <Image
                  src={collection.coverImage}
                  alt=""
                  fill
                  className="object-cover"
                  quality={90}
                  priority={index < 4}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="mt-3 relative inline-block">
              <h3 className="relative inline-block text-left text-base font-light tracking-wide text-gray-700">
                <span>{collection.title}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 whitespace-nowrap font-light text-gray-900 [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:[clip-path:inset(0_0_0_0)]"
                  style={{ WebkitTextStroke: '0.25px currentColor' }}
                >
                  {collection.title}
                </span>
              </h3>
              <div className="mt-1 h-px w-0 bg-gray-400 transition-[width] duration-500 ease-out group-hover:w-full group-focus-visible:w-full" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={handleLightboxOpenChange}>
        {selectedCollection && (
          <DialogContent
            className="max-w-none max-h-none w-screen h-[100dvh] gap-0 rounded-none sm:rounded-none xl:max-w-[95vw] xl:max-h-[95vh] xl:w-full xl:h-full xl:rounded-lg bg-black/75 border-none p-0 overflow-hidden"
            closeButtonClassName="right-[calc(env(safe-area-inset-right)+0.75rem)] top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 rounded-full bg-black/40 text-white opacity-100 ring-offset-black backdrop-blur-sm hover:bg-black/55 hover:text-white focus:ring-white data-[state=open]:bg-black/40 data-[state=open]:text-white"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              lightboxTriggerRef.current?.focus({ preventScroll: true });
            }}
          >
            <DialogTitle className="sr-only">
              {selectedCollection.title} - Image {currentImageIndex + 1} of{' '}
              {selectedCollection.images.length}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedCollection.description}
            </DialogDescription>

            <div className="h-full min-h-0 flex flex-col xl:flex-row">
              {/* Main Image Section */}
              <div
                className="flex-1 relative flex items-center justify-center min-h-0 p-3 xl:p-0"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{ touchAction: 'pan-y' }}
              >
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black xl:grid"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div
                  ref={carouselRef}
                  className="relative w-full h-full flex items-center justify-center overflow-hidden"
                >
                  {[-1, 0, 1].map((offset) => {
                    const imageIndex = getImageIndex(offset);
                    const isCurrentImage = offset === 0;

                    return (
                      <div
                        key={selectedCollection.images[imageIndex]}
                        className="absolute inset-0 max-w-[100vw] xl:max-w-none"
                        style={{
                          transform: `translateX(calc(${offset * 100}% + ${dragOffset}px))`,
                          transition: isDraggingImage
                            ? 'none'
                            : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      >
                        <div
                          className={`relative h-full w-full ${
                            isCurrentImage &&
                            currentImageIndex === 0 &&
                            isSwipeCueVisible
                              ? 'animate-swipe-cue'
                              : ''
                          }`}
                        >
                          <Image
                            src={selectedCollection.images[imageIndex]}
                            alt={`${selectedCollection.title} - Image ${imageIndex + 1}`}
                            fill
                            className="object-contain"
                            quality={100}
                            loading="eager"
                            priority={isCurrentImage}
                            sizes="100vw"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`xl:hidden pointer-events-none absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-sm font-light text-white backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
                    isRotateHintVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden={!isRotateHintVisible}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Rotate for a larger view</span>
                </div>

                <button
                  ref={descriptionOpenButtonRef}
                  onClick={() => {
                    triggerHaptic();
                    setIsDescriptionOpen((open) => !open);
                  }}
                  className="xl:hidden absolute bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-10 flex min-h-11 max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-white backdrop-blur-sm hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label={
                    isDescriptionOpen
                      ? 'Hide image description'
                      : 'Show image description'
                  }
                  aria-expanded={isDescriptionOpen}
                  aria-controls="photo-description-sheet"
                >
                  <span className="min-w-0 truncate text-sm font-light">
                    {selectedCollection.title}
                  </span>
                  <Info className="h-4 w-4 shrink-0" />
                </button>

                <div
                  className={`xl:hidden pointer-events-none absolute inset-x-6 bottom-[calc(env(safe-area-inset-bottom)+0.875rem)] z-10 h-px bg-white/15 transition-opacity duration-300 ${
                    isDescriptionOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className="h-px bg-white/55 transition-all duration-300 ease-out"
                    style={{
                      width: `${((currentImageIndex + 1) / selectedCollection.images.length) * 100}%`,
                    }}
                  />
                </div>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black xl:grid"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Desktop Description Panel */}
              <div className="hidden xl:flex xl:w-80 bg-black/75 p-8 flex-col justify-center xl:max-h-full overflow-y-auto">
                <div className="text-white">
                  <h3 className="text-xl font-medium mb-3">
                    {selectedCollection.title}
                  </h3>

                  {/* Progress bar */}
                  <div className="w-full h-px bg-white/20">
                    <div
                      className="h-px bg-white/60 transition-all duration-300 ease-out"
                      style={{
                        width: `${((currentImageIndex + 1) / selectedCollection.images.length) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="text-base whitespace-pre-line font-light leading-relaxed py-2 pb-10 mb-4 mt-4">
                    {selectedCollection.description}
                  </p>
                </div>
              </div>

              {isDescriptionOpen && (
                <button
                  className="xl:hidden absolute inset-0 z-10 cursor-default bg-transparent"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => {
                    triggerHaptic();
                    setIsDescriptionOpen(false);
                  }}
                />
              )}

              {/* Mobile/Tablet Description Sheet */}
              <div
                id="photo-description-sheet"
                className={`xl:hidden absolute inset-x-0 bottom-0 z-20 max-h-[55vh] overflow-y-auto bg-black/85 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-white backdrop-blur-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  isDescriptionOpen
                    ? 'translate-y-0'
                    : 'pointer-events-none translate-y-full'
                }`}
                role="region"
                aria-label={`${selectedCollection.title} description`}
                aria-hidden={!isDescriptionOpen}
                inert={!isDescriptionOpen}
              >
                <button
                  type="button"
                  ref={descriptionSheetToggleRef}
                  className="mx-auto mb-4 flex h-8 w-20 touch-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  onClick={() => {
                    triggerHaptic();
                    setIsDescriptionOpen(false);
                  }}
                  onTouchStart={handleSheetTouchStart}
                  onTouchEnd={handleSheetTouchEnd}
                  aria-label="Hide image description"
                >
                  <div className="mx-auto h-1 w-10 rounded-full bg-white/30" />
                </button>

                <h3 className="mb-4 text-xl font-medium">
                  {selectedCollection.title}
                </h3>

                <div className="w-full h-px bg-white/20">
                  <div
                    className="h-px bg-white/60 transition-all duration-300 ease-out"
                    style={{
                      width: `${((currentImageIndex + 1) / selectedCollection.images.length) * 100}%`,
                    }}
                  />
                </div>

                <p className="text-base whitespace-pre-line font-light leading-relaxed py-4 pb-2">
                  {selectedCollection.description}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <style jsx global>{`
        @keyframes swipe-cue {
          0%,
          100% {
            transform: translateX(0);
          }
          38% {
            transform: translateX(-18px);
          }
          70% {
            transform: translateX(6px);
          }
        }

        .animate-swipe-cue {
          animation: swipe-cue 1.15s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-swipe-cue {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
