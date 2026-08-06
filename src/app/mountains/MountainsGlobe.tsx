'use client';

import Image from 'next/image';
import type { Globe } from 'cobe';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { triggerHaptic } from '@/lib/haptics';

export type MountainEntry = {
  id: string;
  name: string;
  countryCode: string;
  location: [latitude: number, longitude: number];
  type: 'mountain' | 'park' | 'trail';
  status: 'visited' | 'dream';
  mapUrl: string;
  description?: string;
  image?: string;
  imageAlt?: string;
};

type ProjectedEntry = {
  entry: MountainEntry;
  x: number;
  y: number;
  visible: boolean;
  distanceFromCenter: number;
};

type DestinationStatus = MountainEntry['status'];

type EntryCluster = { id: string; entries: ProjectedEntry[] };
type AnchorStyle = React.CSSProperties;

const INITIAL_PHI = 0.25;
const INITIAL_THETA = 0.16;
const AUTO_ROTATE_SPEED = 0.00135;
const BASE_GLOBE_SCALE = 0.98;
const MAX_GLOBE_ZOOM = 3;
const MAX_POLAROIDS = 6;
const MAX_MOBILE_POLAROIDS = 3;
const MODAL_CLOSE_DURATION = 150;

function mapSamplesForZoom(isMobile: boolean, zoom: number) {
  const baseSamples = isMobile ? 8000 : 16000;
  const maximumSamples = isMobile ? 20000 : 40000;
  return Math.round(
    Math.min(maximumSamples, baseSamples * Math.pow(zoom, 0.75)),
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina',
  CA: 'Canada',
  CH: 'Switzerland',
  CL: 'Chile',
  CN: 'China',
  ID: 'Indonesia',
  IS: 'Iceland',
  IT: 'Italy',
  JP: 'Japan',
  NP: 'Nepal',
  NO: 'Norway',
  NZ: 'New Zealand',
  PE: 'Peru',
  PK: 'Pakistan',
  RU: 'Russia',
  ES: 'Spain',
  TZ: 'Tanzania',
  US: 'United States',
};

function countryFlag(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split('')
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join('');
}

function toSphere([latitude, longitude]: MountainEntry['location']) {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(lat);
  return [
    -cosLat * Math.cos(lon),
    Math.sin(lat),
    cosLat * Math.sin(lon),
  ] as const;
}

function projectEntry(
  entry: MountainEntry,
  phi: number,
  theta: number,
  width: number,
  height: number,
  zoom: number,
): ProjectedEntry {
  const [sphereX, sphereY, sphereZ] = toSphere(entry.location);
  const cosTheta = Math.cos(theta);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const sinPhi = Math.sin(phi);
  const projectedX = cosPhi * sphereX + sinPhi * sphereZ;
  const projectedY =
    sinPhi * sinTheta * sphereX +
    cosTheta * sphereY -
    cosPhi * sinTheta * sphereZ;
  const depth =
    -sinPhi * cosTheta * sphereX +
    sinTheta * sphereY +
    cosPhi * cosTheta * sphereZ;
  const scale = BASE_GLOBE_SCALE * zoom;
  const x = ((projectedX / (width / height)) * scale + 1) / 2;
  const y = (-projectedY * scale + 1) / 2;

  const distanceFromCenter = Math.hypot(x - 0.5, y - 0.5);

  return {
    entry,
    x,
    y,
    visible: depth > 0 && distanceFromCenter <= 0.49,
    distanceFromCenter,
  };
}

function groupNearbyEntries(
  points: ProjectedEntry[],
  width: number,
  zoom: number,
): EntryCluster[] {
  const visible = points.filter((point) => point.visible);
  if (zoom >= MAX_GLOBE_ZOOM - 0.1) {
    return visible.map((point) => ({ id: point.entry.id, entries: [point] }));
  }
  const threshold = (width < 640 ? 74 : 104) / Math.max(1, zoom);
  const visited = new Set<string>();
  const clusters: EntryCluster[] = [];

  for (const point of visible) {
    if (visited.has(point.entry.id)) continue;
    const queue = [point];
    const members: ProjectedEntry[] = [];
    visited.add(point.entry.id);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      members.push(current);
      for (const candidate of visible) {
        if (visited.has(candidate.entry.id)) continue;
        const distance = Math.hypot(
          (current.x - candidate.x) * width,
          (current.y - candidate.y) * width,
        );
        if (distance <= threshold) {
          visited.add(candidate.entry.id);
          queue.push(candidate);
        }
      }
    }

    clusters.push({
      id: members
        .map(({ entry }) => entry.id)
        .sort()
        .join('--'),
      entries: members.sort(
        (a, b) => a.distanceFromCenter - b.distanceFromCenter,
      ),
    });
  }
  return clusters;
}

function ContourPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`mountain-contours relative overflow-hidden bg-stone-100 ${
        compact ? 'h-full w-full' : 'aspect-[4/3] w-full'
      }`}
    >
      <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-[0.18em] text-gray-500">
        Dream destination
      </span>
    </div>
  );
}

function EntryArtwork({
  entry,
  compact = false,
  modal = false,
}: {
  entry: MountainEntry;
  compact?: boolean;
  modal?: boolean;
}) {
  if (!entry.image) return <ContourPlaceholder compact={compact || modal} />;
  return (
    <div
      className={
        compact || modal ? 'relative h-full w-full' : 'relative aspect-[4/3]'
      }
    >
      <Image
        src={entry.image}
        alt={entry.imageAlt || ''}
        fill
        sizes={compact ? '180px' : '(max-width: 767px) 90vw, 640px'}
        className="object-cover"
      />
    </div>
  );
}

function FallbackDestinationButton({
  entry,
  onOpen,
}: {
  entry: MountainEntry;
  onOpen: (entry: MountainEntry, trigger: HTMLButtonElement) => void;
}) {
  const isVisited = entry.status === 'visited';
  return (
    <button
      type="button"
      data-mountain-control
      onClick={(event) => onOpen(entry, event.currentTarget)}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-800 transition hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          isVisited ? 'bg-gray-950' : 'border border-gray-700 bg-white'
        }`}
      />
      <span>{entry.name}</span>
    </button>
  );
}

function PolaroidCard({
  entry,
  compact = false,
  onOpen,
}: {
  entry: MountainEntry;
  compact?: boolean;
  onOpen: (entry: MountainEntry, trigger: HTMLButtonElement) => void;
}) {
  const isVisited = entry.status === 'visited';
  return (
    <button
      type="button"
      data-mountain-control
      onClick={(event) => onOpen(entry, event.currentTarget)}
      className={`mountain-polaroid group pointer-events-auto bg-white text-left shadow-[0_10px_28px_rgba(15,23,42,0.18)] transition-transform duration-200 hover:-translate-y-1 ${
        isVisited
          ? 'border border-gray-700'
          : 'border border-dashed border-gray-500'
      } ${compact ? 'w-[6.5rem] p-1.5 sm:w-32' : 'w-[6.5rem] p-1.5 sm:w-40 sm:p-2'}`}
      aria-label={`Open ${entry.name}, ${isVisited ? 'visited' : 'dream destination'}`}
    >
      <div className={compact ? 'h-20' : 'h-24 sm:h-28'}>
        <EntryArtwork entry={entry} compact />
      </div>
      <span className="mt-2 block truncate text-center text-xs text-gray-900 sm:text-sm">
        {entry.name}
      </span>
      <span className="mt-0.5 block text-center text-[9px] uppercase tracking-[0.16em] text-gray-500">
        {isVisited ? 'Visited' : 'Dream'}
      </span>
    </button>
  );
}

export default function MountainsGlobe({
  entries,
}: {
  entries: MountainEntry[];
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeRef = useRef<Globe | null>(null);
  const animationRef = useRef<number | null>(null);
  const projectionTimerRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const phiRef = useRef(INITIAL_PHI);
  const thetaRef = useRef(INITIAL_THETA);
  const zoomRef = useRef(1);
  const pauseRef = useRef(false);
  const resumeAtRef = useRef(0);
  const sizeRef = useRef({ width: 800, height: 800 });
  const pointerRef = useRef<{
    id: number;
    x: number;
    y: number;
    phi: number;
    theta: number;
  } | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modalCloseTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [stageSize, setStageSize] = useState({ width: 800, height: 800 });
  const [projectedEntries, setProjectedEntries] = useState<ProjectedEntry[]>(
    [],
  );
  const [selectedEntry, setSelectedEntry] = useState<MountainEntry | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleStatuses, setVisibleStatuses] = useState<DestinationStatus[]>([
    'visited',
    'dream',
  ]);
  const visibleEntries = useMemo(
    () => entries.filter((entry) => visibleStatuses.includes(entry.status)),
    [entries, visibleStatuses],
  );
  const clusters = useMemo(
    () => groupNearbyEntries(projectedEntries, stageSize.width, zoomLevel),
    [projectedEntries, stageSize.width, zoomLevel],
  );
  const expandedCluster = clusters.find(
    (cluster) => cluster.id === expandedClusterId,
  );
  const polaroidIds = new Set(
    clusters
      .filter((cluster) => cluster.entries.length === 1)
      .map((cluster) => cluster.entries[0])
      .filter((point) => {
        if (!point.entry.image) return false;
        const isMobileStage = stageSize.width < 640;
        const horizontalInset = isMobileStage ? 0.2 : 0.14;
        const topInset = isMobileStage ? 0.44 : 0.28;
        return (
          point.x >= horizontalInset &&
          point.x <= 1 - horizontalInset &&
          point.y >= topInset
        );
      })
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
      .slice(
        0,
        stageSize.width < 640
          ? zoomLevel >= 2.5
            ? MAX_POLAROIDS
            : MAX_MOBILE_POLAROIDS
          : MAX_POLAROIDS,
      )
      .map(({ entry }) => entry.id),
  );
  const shouldPause =
    Boolean(prefersReducedMotion) ||
    isDragging ||
    isFocusWithin ||
    zoomLevel > 1.05 ||
    Boolean(expandedClusterId) ||
    Boolean(selectedEntry) ||
    !isInViewport;

  useEffect(() => {
    pauseRef.current = shouldPause;
  }, [shouldPause]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
      const nextSize = { width: size, height: size };
      sizeRef.current = nextSize;
      setStageSize(nextSize);
      globeRef.current?.update(nextSize);
    };
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(stage);
    updateSize();

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.05 },
    );
    intersectionObserver.observe(stage);
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglAvailable(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const start = async () => {
      try {
        const supportsWebgl = Boolean(
          canvas.getContext('webgl2') || canvas.getContext('webgl'),
        );
        if (!supportsWebgl) {
          setWebglAvailable(false);
          return;
        }
        const { default: createGlobe } = await import('cobe');
        if (cancelled) return;
        const isMobile = window.matchMedia('(max-width: 639px)').matches;
        const size = sizeRef.current;
        const globe = createGlobe(canvas, {
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          width: size.width,
          height: size.height,
          phi: phiRef.current,
          theta: thetaRef.current,
          dark: 0,
          diffuse: 1.25,
          mapSamples: mapSamplesForZoom(isMobile, zoomRef.current),
          mapBrightness: 4.8,
          mapBaseBrightness: 0,
          baseColor: [0.97, 0.97, 0.97],
          markerColor: [0.08, 0.08, 0.08],
          glowColor: [1, 1, 1],
          markerElevation: 0.01,
          scale: BASE_GLOBE_SCALE * zoomRef.current,
          markers: visibleEntries.map((entry) => ({
            id: entry.id,
            location: entry.location,
            size: entry.status === 'visited' ? 0.035 : 0.028,
            color:
              entry.status === 'visited'
                ? ([0.06, 0.06, 0.06] as [number, number, number])
                : ([0.5, 0.5, 0.5] as [number, number, number]),
          })),
        });
        globeRef.current = globe;
        globe.update({ phi: phiRef.current, theta: thetaRef.current });
        setProjectedEntries(
          visibleEntries.map((entry) =>
            projectEntry(
              entry,
              phiRef.current,
              thetaRef.current,
              size.width,
              size.height,
              zoomRef.current,
            ),
          ),
        );
        lastFrameTimeRef.current = null;

        const animate = (time: number) => {
          const elapsedFrames = lastFrameTimeRef.current
            ? Math.min((time - lastFrameTimeRef.current) / (1000 / 60), 2)
            : 1;
          lastFrameTimeRef.current = time;
          const isPointerInteracting = activePointersRef.current.size > 0;

          if (!pauseRef.current || isPointerInteracting) {
            if (!pauseRef.current && time >= resumeAtRef.current) {
              phiRef.current += AUTO_ROTATE_SPEED * elapsedFrames;
            }
            globe.update({
              phi: phiRef.current,
              theta: thetaRef.current,
              scale: BASE_GLOBE_SCALE * zoomRef.current,
            });
            if (time - projectionTimerRef.current > 90) {
              projectionTimerRef.current = time;
              const currentSize = sizeRef.current;
              setProjectedEntries(
                visibleEntries.map((entry) =>
                  projectEntry(
                    entry,
                    phiRef.current,
                    thetaRef.current,
                    currentSize.width,
                    currentSize.height,
                    zoomRef.current,
                  ),
                ),
              );
            }
          }
          animationRef.current = window.requestAnimationFrame(animate);
        };
        animationRef.current = window.requestAnimationFrame(animate);
      } catch {
        if (!cancelled) setWebglAvailable(false);
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (animationRef.current)
        window.cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, [visibleEntries]);

  useEffect(() => {
    if (expandedClusterId && !expandedCluster) setExpandedClusterId(null);
  }, [expandedCluster, expandedClusterId]);

  useEffect(
    () => () => {
      if (modalCloseTimerRef.current) {
        window.clearTimeout(modalCloseTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedClusterId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openEntry = (entry: MountainEntry, trigger: HTMLButtonElement) => {
    if (modalCloseTimerRef.current) {
      window.clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    triggerHaptic();
    modalTriggerRef.current = trigger;
    setExpandedClusterId(null);
    setSelectedEntry(entry);
    setIsModalClosing(false);
    setIsModalOpen(true);
  };
  const closeEntry = () => {
    if (isModalClosing) return;
    triggerHaptic();
    setIsModalClosing(true);
    modalCloseTimerRef.current = window.setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
      setSelectedEntry(null);
      modalCloseTimerRef.current = null;
      window.requestAnimationFrame(() => {
        modalTriggerRef.current?.focus({ preventScroll: true });
      });
    }, MODAL_CLOSE_DURATION);
  };
  const anchorStyle = (entry: ProjectedEntry): AnchorStyle => ({
    left: `${entry.x * 100}%`,
    top: `${entry.y * 100}%`,
    opacity: entry.visible ? 1 : 0,
  });
  const toggleStatus = (status: DestinationStatus) => {
    setExpandedClusterId(null);
    setVisibleStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };
  const updateZoom = (nextZoom: number) => {
    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    globeRef.current?.update({
      scale: BASE_GLOBE_SCALE * nextZoom,
      mapSamples: mapSamplesForZoom(isMobile, nextZoom),
    });
    const currentSize = sizeRef.current;
    setProjectedEntries(
      visibleEntries.map((entry) =>
        projectEntry(
          entry,
          phiRef.current,
          thetaRef.current,
          currentSize.width,
          currentSize.height,
          nextZoom,
        ),
      ),
    );
  };
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const normalizedDelta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * stageSize.height
          : event.deltaY;
    const nextZoom = Math.max(
      1,
      Math.min(
        MAX_GLOBE_ZOOM,
        zoomRef.current * Math.exp(-normalizedDelta * 0.0015),
      ),
    );
    if (Math.abs(nextZoom - zoomRef.current) < 0.001) return;
    updateZoom(nextZoom);
    resumeAtRef.current = performance.now() + 900;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-mountain-control]'))
      return;
    setExpandedClusterId(null);
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (activePointersRef.current.size === 1) {
      pointerRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        phi: phiRef.current,
        theta: thetaRef.current,
      };
    } else if (activePointersRef.current.size === 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      pinchRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        zoom: zoomRef.current,
      };
      pointerRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) return;
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (activePointersRef.current.size >= 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const gesture = pinchRef.current;
      if (!gesture) return;
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const nextZoom = Math.max(
        1,
        Math.min(MAX_GLOBE_ZOOM, gesture.zoom * (distance / gesture.distance)),
      );
      updateZoom(nextZoom);
      return;
    }
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    phiRef.current = pointer.phi + (event.clientX - pointer.x) * 0.006;
    thetaRef.current = Math.max(
      -0.75,
      Math.min(0.75, pointer.theta + (event.clientY - pointer.y) * 0.006),
    );
  };
  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) return;
    activePointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    if (activePointersRef.current.size === 1) {
      const [id, position] = Array.from(activePointersRef.current.entries())[0];
      pointerRef.current = {
        id,
        x: position.x,
        y: position.y,
        phi: phiRef.current,
        theta: thetaRef.current,
      };
    } else {
      pointerRef.current = null;
      setIsDragging(false);
      resumeAtRef.current = performance.now() + 1200;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="mountains-page relative -mx-4 -my-8 h-[calc(100dvh-4rem)] overflow-hidden md:-mx-8">
      <h1 className="sr-only">Mountains</h1>
      <p className="sr-only">
        Born in Yunnan, one of the most mountainous regions in the world, I have
        always found a deep sense of serenity and belonging in the mountains.
        This is a map of the peaks I have visited—and my dream of exploring
        every beautiful mountain I can reach.
      </p>

      <div className="mountain-story-column pointer-events-none absolute left-4 right-16 top-4 z-30 md:bottom-8 md:left-8 md:right-auto md:top-8 md:flex md:w-[min(22vw,320px)] md:flex-col md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
            A personal atlas (Beta)
          </p>
          <p className="mt-1 text-lg text-gray-900">Mountains</p>
        </div>
        <p className="mountain-story-copy mt-3 max-w-[34rem] text-[13px] leading-relaxed text-gray-600 sm:text-sm md:mt-0 md:text-[15px] md:leading-7">
          Born in Yunnan, one of the most mountainous regions in the world, I
          have always found a deep sense of serenity and belonging in the
          mountains. This is a map of the peaks I have visited—and my dream of
          exploring every beautiful mountain I can reach.
        </p>
      </div>

      <details className="mountain-info absolute right-4 top-4 z-40 md:right-8 md:top-6">
        <summary
          data-mountain-control
          className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm transition hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 [&::-webkit-details-marker]:hidden"
          aria-label="About this mountains globe"
        >
          <Info className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-xl">
          <p className="font-medium text-gray-950">Map key</p>
          <fieldset className="mt-3 grid grid-cols-2 gap-2">
            <legend className="sr-only">Filter destinations by status</legend>
            {(['visited', 'dream'] as DestinationStatus[]).map((status) => {
              const isVisited = status === 'visited';
              const isSelected = visibleStatuses.includes(status);
              const count = entries.filter(
                (entry) => entry.status === status,
              ).length;
              return (
                <button
                  type="button"
                  key={status}
                  aria-pressed={isSelected}
                  onClick={() => {
                    triggerHaptic();
                    toggleStatus(status);
                  }}
                  className={`flex min-h-11 flex-col items-start justify-center rounded-md px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                    isSelected
                      ? 'bg-white text-gray-950 shadow-[0_3px_12px_rgba(15,23,42,0.12)] ring-1 ring-gray-200'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium">
                    {isVisited ? 'Visited' : 'Dream'}
                  </span>
                  <span className="mt-0.5 text-[10px] text-gray-400">
                    {count} places
                  </span>
                </button>
              );
            })}
          </fieldset>
          <a
            href="https://cobe.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
          >
            Globe made with COBE <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </details>

      <div className="absolute inset-x-0 bottom-0 top-40 grid place-items-center px-2 pb-2 sm:top-32 sm:px-6 sm:pb-4 md:inset-y-0 md:left-[min(24vw,352px)] md:top-0 md:pt-0">
        <div
          ref={stageRef}
          className={`mountain-stage relative aspect-square h-[min(94vw,calc(100dvh-15rem))] max-h-full w-[min(94vw,calc(100dvh-15rem))] max-w-full touch-none select-none sm:h-[min(86vw,calc(100dvh-12rem))] sm:w-[min(86vw,calc(100dvh-12rem))] md:h-[min(72vw,calc(100dvh-5rem))] md:w-[min(72vw,calc(100dvh-5rem))] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onWheel={handleWheel}
          onFocusCapture={() => setIsFocusWithin(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              resumeAtRef.current = performance.now() + 1200;
              setIsFocusWithin(false);
            }
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="h-full w-full opacity-0 [animation:mountain-canvas-in_500ms_ease-out_100ms_forwards]"
          />

          {webglAvailable &&
            clusters.map((cluster) => {
              const anchor = cluster.entries[0];
              if (cluster.entries.length > 1) {
                const isExpanded = cluster.id === expandedClusterId;
                return (
                  <div
                    key={cluster.id}
                    className="mountain-anchor pointer-events-none absolute z-20"
                    style={anchorStyle(anchor)}
                  >
                    <button
                      type="button"
                      data-mountain-control
                      onClick={() => {
                        triggerHaptic();
                        if (stageSize.width < 640) {
                          const nextZoom = Math.min(
                            MAX_GLOBE_ZOOM,
                            Math.max(
                              zoomRef.current + 0.65,
                              zoomRef.current * 1.5,
                            ),
                          );
                          updateZoom(nextZoom);
                          setExpandedClusterId(null);
                        } else {
                          setExpandedClusterId(isExpanded ? null : cluster.id);
                        }
                      }}
                      className="pointer-events-auto grid h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gray-800 bg-white px-3 text-sm text-gray-950 shadow-lg"
                      aria-expanded={
                        stageSize.width >= 640 ? isExpanded : undefined
                      }
                      aria-label={`${cluster.entries.length} nearby destinations${stageSize.width < 640 ? '. Pinch or tap to zoom in' : ''}`}
                    >
                      {cluster.entries.length}
                    </button>
                    {isExpanded && (
                      <div className="pointer-events-auto absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-end gap-2 md:flex">
                        {cluster.entries.map(({ entry }, index) => (
                          <div
                            key={entry.id}
                            style={{
                              transform: `rotate(${(index - (cluster.entries.length - 1) / 2) * 3}deg)`,
                            }}
                          >
                            <PolaroidCard
                              entry={entry}
                              compact
                              onOpen={openEntry}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const { entry } = anchor;
              return (
                <div
                  key={entry.id}
                  className="mountain-anchor pointer-events-none absolute z-10"
                  style={anchorStyle(anchor)}
                >
                  {polaroidIds.has(entry.id) ? (
                    <div
                      className="origin-bottom"
                      style={{
                        transform: `translate(-50%, -100%) rotate(${(entry.id.length % 5) - 2}deg)`,
                      }}
                    >
                      <PolaroidCard entry={entry} onOpen={openEntry} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-mountain-control
                      onClick={(event) => openEntry(entry, event.currentTarget)}
                      className={`pointer-events-auto relative h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full before:absolute before:left-1/2 before:top-1/2 before:h-3 before:w-3 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full ${
                        entry.status === 'visited'
                          ? 'before:bg-gray-950'
                          : 'before:border before:border-gray-800 before:bg-white'
                      }`}
                      aria-label={`Open ${entry.name}`}
                    />
                  )}
                </div>
              );
            })}

          {!webglAvailable && (
            <div className="absolute inset-0 grid place-items-center rounded-full border border-dashed border-gray-300 bg-white/90 p-8">
              <div className="max-h-[80%] w-full max-w-lg overflow-y-auto text-center">
                <p className="text-sm text-gray-600">
                  The interactive globe is unavailable here. Explore the
                  destinations below instead.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  {visibleEntries.map((entry) => (
                    <FallbackDestinationButton
                      key={entry.id}
                      entry={entry}
                      onOpen={openEntry}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {visibleEntries.length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white/90 px-5 py-4 text-center shadow-lg backdrop-blur-sm">
              <p className="text-sm font-medium text-gray-900">
                No destinations selected.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Turn on a status in the map key to explore the atlas.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEntry();
          }
        }}
      >
        {selectedEntry && (
          <DialogContent
            forceMount
            onClose={closeEntry}
            closeButtonClassName="!right-2 !top-2 !h-9 !w-9 bg-white/90 opacity-100 shadow-sm sm:!right-3 sm:!top-3"
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              closeEntry();
            }}
            onPointerDownOutside={(event) => {
              event.preventDefault();
              closeEntry();
            }}
            className={`mountain-modal flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden bg-white p-0 ${
              isModalClosing ? 'is-closing' : ''
            }`}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
          >
            <div className="min-h-0 overflow-y-auto">
              <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-20 sm:p-6 sm:pt-20">
                <div className="mx-auto aspect-square w-[72%] overflow-hidden rounded-sm border border-gray-100 bg-stone-50">
                  <EntryArtwork entry={selectedEntry} modal />
                </div>
                <div className="mt-4 min-w-0">
                  <DialogHeader className="min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-gray-500">
                      <span>{selectedEntry.type}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {selectedEntry.status === 'visited'
                          ? 'Visited'
                          : 'Dream destination'}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <DialogTitle className="min-w-0 text-xl font-semibold leading-tight text-gray-950 sm:text-2xl">
                        <span
                          role="img"
                          aria-label={COUNTRY_NAMES[selectedEntry.countryCode]}
                          className="mr-2"
                        >
                          {countryFlag(selectedEntry.countryCode)}
                        </span>
                        {selectedEntry.name}
                      </DialogTitle>
                      {!selectedEntry.description && (
                        <a
                          href={selectedEntry.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={triggerHaptic}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gray-300 transition hover:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                          aria-label={`Open ${selectedEntry.name} in Google Maps`}
                        >
                          <Image
                            src="/images/icons/pin.png"
                            alt=""
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] object-contain"
                          />
                        </a>
                      )}
                    </div>
                    {selectedEntry.description ? (
                      <DialogDescription className="whitespace-pre-line pt-2 text-base leading-relaxed text-gray-700">
                        {selectedEntry.description}
                      </DialogDescription>
                    ) : (
                      <DialogDescription className="sr-only">
                        {`${selectedEntry.name}, ${selectedEntry.status === 'visited' ? 'visited' : 'dream destination'}.`}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  {selectedEntry.description && (
                    <div className="mt-4 flex justify-start">
                      <a
                        href={selectedEntry.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={triggerHaptic}
                        className="grid h-11 w-11 place-items-center rounded-full border border-gray-300 transition hover:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        aria-label={`Open ${selectedEntry.name} in Google Maps`}
                      >
                        <Image
                          src="/images/icons/pin.png"
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] object-contain"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
