'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { triggerHaptic } from '@/lib/haptics';

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  description: string;
  links: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
  };
  preview?: {
    source: 'apple';
    trackTitle: string;
    url: string;
  };
}

const PREVIEW_DURATION_SECONDS = 30;

function AlbumCoverTilt({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;

    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;

    const rect = wrap.getBoundingClientRect();
    const px = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    const py = Math.min(
      1,
      Math.max(0, (event.clientY - rect.top) / rect.height),
    );
    const max = 30;

    card.classList.add('is-tilting');
    card.style.setProperty(
      '--album-tilt-ry',
      `${((px - 0.5) * max).toFixed(2)}deg`,
    );
    card.style.setProperty(
      '--album-tilt-rx',
      `${((0.5 - py) * max).toFixed(2)}deg`,
    );
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;

    card.classList.remove('is-tilting');
    card.style.setProperty('--album-tilt-rx', '0deg');
    card.style.setProperty('--album-tilt-ry', '0deg');
  };

  return (
    <div
      ref={wrapRef}
      className="album-tilt"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div
        ref={cardRef}
        className="album-tilt-card relative aspect-square overflow-hidden rounded-lg bg-white shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}

function formatPreviewTime(seconds: number) {
  return `0:${Math.floor(seconds).toString().padStart(2, '0')}`;
}

function VinylPreviewPlayer({ album }: { album: Album }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;

    setIsPlaying(false);
    setProgress(0);
    setPlaybackError(null);

    return () => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };
  }, [album.id]);

  const resetPlayback = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handleTogglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !album.preview) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (audio.ended || audio.currentTime >= PREVIEW_DURATION_SECONDS - 0.05) {
      audio.currentTime = 0;
      setProgress(0);
    }

    setPlaybackError(null);

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setPlaybackError('The preview could not be played. Please try again.');
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentTime = Math.min(audio.currentTime, PREVIEW_DURATION_SECONDS);
    setProgress(currentTime);

    if (audio.currentTime >= PREVIEW_DURATION_SECONDS) {
      resetPlayback();
    }
  };

  const previewProgress = Math.min(
    100,
    (progress / PREVIEW_DURATION_SECONDS) * 100,
  );

  return (
    <div className="w-full">
      <motion.div
        initial={
          prefersReducedMotion
            ? false
            : { borderRadius: '0.5rem', opacity: 0.65, scale: 0.94 }
        }
        animate={{ borderRadius: '9999px', opacity: 1, scale: 1 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-square w-full"
      >
        <div
          aria-hidden="true"
          className={`vinyl-ambient ${isPlaying ? 'is-playing' : ''}`}
        />

        <div
          className="vinyl-record-surface absolute inset-0 overflow-hidden rounded-full shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
          style={{
            animationPlayState:
              isPlaying && !prefersReducedMotion ? 'running' : 'paused',
          }}
        >
          <motion.div
            initial={
              prefersReducedMotion
                ? false
                : { borderRadius: '0.5rem', inset: '0%' }
            }
            animate={{ borderRadius: '9999px', inset: '27%' }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.08,
              duration: 0.58,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute z-10 overflow-hidden shadow-[0_0_0_2px_rgba(255,255,255,0.12)]"
          >
            <Image
              src={album.coverImage}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
          </motion.div>
        </div>

        {album.preview ? (
          <button
            type="button"
            onClick={handleTogglePlayback}
            className="absolute left-1/2 top-1/2 z-20 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-gray-950 shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4 active:scale-95"
            aria-label={`${isPlaying ? 'Pause' : 'Play'} preview of ${album.preview.trackTitle} by ${album.artist}`}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
            )}
          </button>
        ) : (
          <div className="absolute left-1/2 top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-300 bg-gray-950 shadow" />
        )}
      </motion.div>

      {album.preview ? (
        <>
          <audio
            ref={audioRef}
            src={album.preview.url}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={resetPlayback}
            onError={() => {
              resetPlayback();
              setPlaybackError(
                'This preview is temporarily unavailable. Try Apple Music instead.',
              );
            }}
          />
          <div className="mt-4 text-center">
            <p className="truncate text-sm font-medium text-gray-900">
              {album.preview.trackTitle}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-8 text-right text-[11px] tabular-nums text-gray-500">
                {formatPreviewTime(progress)}
              </span>
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label="Preview progress"
                aria-valuemin={0}
                aria-valuemax={PREVIEW_DURATION_SECONDS}
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="h-full rounded-full bg-gray-900 transition-[width] duration-100"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
              <span className="w-8 text-[11px] tabular-nums text-gray-500">
                0:30
              </span>
            </div>
            {album.links.appleMusic && (
              <a
                href={album.links.appleMusic}
                target="_blank"
                rel="noopener noreferrer"
                onClick={triggerHaptic}
                className="mt-1 inline-flex min-h-11 items-center text-[11px] text-gray-500 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                Preview provided courtesy of iTunes
              </a>
            )}
            {playbackError && (
              <p
                className="mt-2 text-xs text-red-600"
                role="status"
                aria-live="polite"
              >
                {playbackError}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-center text-sm text-gray-500">
          Preview unavailable
        </p>
      )}
    </div>
  );
}

function StreamingLinks({
  links,
  className = '',
}: {
  links: Album['links'];
  className?: string;
}) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {links.spotify && (
        <a
          href={links.spotify}
          target="_blank"
          rel="noopener noreferrer"
          onClick={triggerHaptic}
          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          <Image
            src="/images/icons/spotify.png"
            alt="Listen on Spotify"
            width={32}
            height={32}
            className="transition-opacity hover:opacity-80"
          />
        </a>
      )}
      {links.appleMusic && (
        <a
          href={links.appleMusic}
          target="_blank"
          rel="noopener noreferrer"
          onClick={triggerHaptic}
          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          <Image
            src="/images/icons/apple-music.png"
            alt="Listen on Apple Music"
            width={32}
            height={32}
            className="transition-opacity hover:opacity-80"
          />
        </a>
      )}
      {links.youtube && (
        <a
          href={links.youtube}
          target="_blank"
          rel="noopener noreferrer"
          onClick={triggerHaptic}
          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          <Image
            src="/images/icons/youtube.png"
            alt="Watch on YouTube"
            width={32}
            height={32}
            className="transition-opacity hover:opacity-80"
          />
        </a>
      )}
    </div>
  );
}

export default function AlbumGrid({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const albumTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleAlbumOpen = (album: Album, trigger: HTMLButtonElement) => {
    triggerHaptic();
    albumTriggerRef.current = trigger;
    setSelectedAlbum(album);
  };

  const handleAlbumOpenChange = (open: boolean) => {
    if (!open) {
      triggerHaptic();
      setSelectedAlbum(null);
    }
  };

  return (
    <div className="w-full">
      <h1 className="sr-only">Music recommendations</h1>
      <div className="music-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 lg:gap-6 xl:gap-4">
        {albums.map((album) => (
          <button
            type="button"
            key={album.id}
            className="group w-full cursor-pointer text-left transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-50"
            onClick={(event) => handleAlbumOpen(album, event.currentTarget)}
          >
            <AlbumCoverTilt>
              <Image
                src={album.coverImage}
                alt=""
                fill
                className="object-cover"
              />
            </AlbumCoverTilt>
            <div className="mt-3">
              <h3 className="truncate text-center text-sm font-normal text-gray-900 transition-[font-weight] duration-200 group-hover:font-medium group-focus-visible:font-medium md:text-base">
                {album.title}
              </h3>
              <p className="truncate text-center text-xs text-gray-600 md:text-sm">
                {album.artist}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedAlbum} onOpenChange={handleAlbumOpenChange}>
        {selectedAlbum && (
          <DialogContent
            className="flex max-h-[90dvh] max-w-2xl flex-col overflow-hidden bg-white"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              albumTriggerRef.current?.focus({ preventScroll: true });
            }}
          >
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {selectedAlbum.title}
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600">
                {selectedAlbum.artist}
              </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 md:hidden">
              <div className="mx-auto w-[min(52vw,31dvh,220px)] shrink-0">
                <VinylPreviewPlayer album={selectedAlbum} />
              </div>

              <StreamingLinks
                links={selectedAlbum.links}
                className="shrink-0 justify-center"
              />

              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <p className="whitespace-pre-line text-gray-700">
                  {selectedAlbum.description}
                </p>
              </div>
            </div>

            <div className="hidden min-h-0 flex-1 overflow-y-auto pr-2 md:block">
              <div className="flex gap-6">
                {/* Vinyl Preview */}
                <div className="w-[300px] flex-[0_0_300px]">
                  <VinylPreviewPlayer album={selectedAlbum} />
                </div>

                {/* Album Details */}
                <div className="flex flex-col w-full md:w-1/2">
                  <p className="whitespace-pre-line text-gray-700">
                    {selectedAlbum.description}
                  </p>

                  {/* Streaming Links */}
                  <StreamingLinks
                    links={selectedAlbum.links}
                    className="mt-6"
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <style jsx global>{`
        .album-tilt {
          perspective: 900px;
        }

        .album-tilt-card {
          transform: rotateX(var(--album-tilt-rx, 0deg))
            rotateY(var(--album-tilt-ry, 0deg));
          transform-style: preserve-3d;
          transition:
            transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 300ms ease;
          will-change: transform;
        }

        @media (hover: hover) and (pointer: fine) {
          .album-tilt-card.is-tilting {
            transition:
              transform 160ms ease-out,
              box-shadow 300ms ease;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .album-tilt-card {
            transform: none !important;
            transition: none !important;
          }

          .vinyl-record-surface,
          .vinyl-ambient {
            animation: none !important;
          }

          .vinyl-ambient {
            transition: none !important;
          }
        }

        @keyframes vinyl-ambient-dance {
          0%,
          100% {
            transform: rotate(-3deg) scale(0.96);
          }
          35% {
            transform: rotate(3deg) scale(1.035);
          }
          68% {
            transform: rotate(-1deg) scale(0.99);
          }
        }

        @keyframes vinyl-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .vinyl-ambient {
          position: absolute;
          inset: -7%;
          border-radius: 9999px;
          background:
            radial-gradient(
              circle at 28% 28%,
              rgba(244, 173, 72, 0.42),
              transparent 34%
            ),
            radial-gradient(
              circle at 72% 32%,
              rgba(89, 136, 171, 0.34),
              transparent 38%
            ),
            radial-gradient(
              circle at 54% 76%,
              rgba(182, 91, 96, 0.3),
              transparent 36%
            );
          filter: blur(20px);
          opacity: 0;
          transform: scale(0.92);
          transition:
            opacity 500ms ease,
            transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }

        .vinyl-ambient.is-playing {
          animation: vinyl-ambient-dance 4.6s ease-in-out infinite;
          opacity: 0.58;
        }

        .vinyl-record-surface {
          animation: vinyl-spin 3.2s linear infinite;
          background:
            radial-gradient(
              circle at center,
              transparent 0 8%,
              rgba(255, 255, 255, 0.08) 8.2% 8.7%,
              transparent 8.9% 17%
            ),
            repeating-radial-gradient(
              circle at center,
              #080808 0,
              #080808 2px,
              #191919 3px,
              #050505 4px
            );
          will-change: transform;
        }

        .vinyl-record-surface::before {
          position: absolute;
          z-index: 1;
          inset: 0;
          border-radius: 9999px;
          background: conic-gradient(
            from 35deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.13) 24deg,
            transparent 60deg,
            transparent 180deg,
            rgba(255, 255, 255, 0.08) 210deg,
            transparent 246deg
          );
          content: '';
          pointer-events: none;
        }

        @media (orientation: landscape) and (max-width: 767px) {
          .music-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
