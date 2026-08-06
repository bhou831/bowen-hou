'use client';

import Image from 'next/image';
import type { Globe } from 'cobe';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  type:
    | 'mountain'
    | 'range'
    | 'ridge'
    | 'park'
    | 'trail'
    | 'pass'
    | 'landform'
    | 'attraction';
  status: 'visited' | 'dream';
  region: string;
  gatewayAirport: {
    name: string;
    code: string;
    note?: string;
  };
  park?: string;
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

type EntryCluster = { id: string; entries: ProjectedEntry[] };
type AnchorStyle = React.CSSProperties & {
  '--mountain-anchor': string;
  '--mountain-left': string;
  '--mountain-top': string;
  '--mountain-visible': string | number;
};
type SelectionState =
  | { kind: 'idle' }
  | { kind: 'single'; entryId: string }
  | { kind: 'cluster'; cluster: EntryCluster }
  | { kind: 'details'; entry: MountainEntry };

const INITIAL_PHI = 0.25;
const INITIAL_THETA = 0.16;
const AUTO_ROTATE_SPEED = 0.00135;
const BASE_GLOBE_SCALE = 0.98;
const MAX_GLOBE_ZOOM = 3;
const EARTH_RADIUS_KM = 6371;
const GLOBAL_CLUSTER_RADIUS_KM = 400;
const MODAL_CLOSE_DURATION = 150;

function mapSamplesForZoom(isMobile: boolean, zoom: number) {
  const baseSamples = isMobile ? 8000 : 20000;
  const maximumSamples = isMobile ? 20000 : 60000;
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
  zoom: number,
): EntryCluster[] {
  const visible = [...points.filter((point) => point.visible)].sort((a, b) =>
    a.entry.id.localeCompare(b.entry.id),
  );
  if (zoom >= MAX_GLOBE_ZOOM - 0.1) {
    return visible.map((point) => ({ id: point.entry.id, entries: [point] }));
  }
  const thresholdKm = GLOBAL_CLUSTER_RADIUS_KM / Math.max(1, zoom);
  const spherePoints = new Map(
    visible.map((point) => [point.entry.id, toSphere(point.entry.location)]),
  );
  const geographicDistance = (a: ProjectedEntry, b: ProjectedEntry) => {
    const [ax, ay, az] = spherePoints.get(a.entry.id)!;
    const [bx, by, bz] = spherePoints.get(b.entry.id)!;
    const chord = Math.min(2, Math.hypot(ax - bx, ay - by, az - bz));
    return 2 * Math.asin(chord / 2) * EARTH_RADIUS_KM;
  };
  const visited = new Set<string>();
  const clusters: EntryCluster[] = [];

  for (const seed of visible) {
    if (visited.has(seed.entry.id)) continue;
    visited.add(seed.entry.id);
    // Leader clustering still prevents chaining across a continent, while
    // geographic distance keeps membership stable as the globe rotates.
    const members = [seed];
    for (const candidate of visible) {
      if (visited.has(candidate.entry.id)) continue;
      const distance = geographicDistance(seed, candidate);
      if (distance <= thresholdKm) {
        visited.add(candidate.entry.id);
        members.push(candidate);
      }
    }

    // Use a geographic medoid for the badge anchor. Unlike a projected visual
    // centre, this representative cannot flip merely because the globe turns.
    const [medoid] = [...members].sort(
      (a, b) =>
        members.reduce(
          (sum, member) => sum + geographicDistance(a, member),
          0,
        ) -
          members.reduce(
            (sum, member) => sum + geographicDistance(b, member),
            0,
          ) || a.entry.id.localeCompare(b.entry.id),
    );
    const rest = members
      .filter((member) => member.entry.id !== medoid.entry.id)
      .sort((a, b) => a.entry.id.localeCompare(b.entry.id));

    clusters.push({
      id: members
        .map(({ entry }) => entry.id)
        .sort()
        .join('--'),
      entries: [medoid, ...rest],
    });
  }
  return clusters;
}

function EntryHeroPhoto({ entry }: { entry: MountainEntry }) {
  return (
    <div className="relative aspect-[3/2] w-full sm:aspect-[2/1]">
      <Image
        src={entry.image as string}
        alt={entry.imageAlt || ''}
        fill
        priority
        sizes="(max-width: 767px) 90vw, 640px"
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
  return (
    <button
      type="button"
      data-mountain-control
      onClick={(event) => onOpen(entry, event.currentTarget)}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-800 transition hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ⛰️
      </span>
      <span>
        {entry.name} {countryFlag(entry.countryCode)}
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
  const modalContentRef = useRef<HTMLDivElement | null>(null);
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
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const selectionOriginIdRef = useRef<string | null>(null);
  const modalFallbackTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileFirstDestinationRef = useRef<HTMLButtonElement | null>(null);
  const modalCloseTimerRef = useRef<number | null>(null);
  const detailsOpenFrameRef = useRef<number | null>(null);
  const mapSamplesTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [stageSize, setStageSize] = useState({ width: 800, height: 800 });
  const [projectedEntries, setProjectedEntries] = useState<ProjectedEntry[]>(
    [],
  );
  const [selection, setSelection] = useState<SelectionState>({ kind: 'idle' });
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const visitedCount = useMemo(
    () => entries.filter((entry) => entry.status === 'visited').length,
    [entries],
  );
  const visitedPercentage = entries.length
    ? (visitedCount / entries.length) * 100
    : 0;
  const clusters = useMemo(
    () => groupNearbyEntries(projectedEntries, zoomLevel),
    [projectedEntries, zoomLevel],
  );
  const selectedEntry = selection.kind === 'details' ? selection.entry : null;
  const selectedCluster =
    selection.kind === 'cluster' ? selection.cluster : undefined;
  const isMobileStage = stageSize.width < 640;
  const shouldPause =
    Boolean(prefersReducedMotion) ||
    isDragging ||
    isFocusWithin ||
    zoomLevel > 1.05 ||
    selection.kind !== 'idle' ||
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
          diffuse: 1.5,
          mapSamples: mapSamplesForZoom(isMobile, zoomRef.current),
          mapBrightness: 4.8,
          mapBaseBrightness: 0,
          baseColor: [0.97, 0.97, 0.97],
          markerColor: [0.08, 0.08, 0.08],
          glowColor: [1, 1, 1],
          markerElevation: 0.02,
          scale: BASE_GLOBE_SCALE * zoomRef.current,
          markers: entries.map((entry) => ({
            id: entry.id,
            location: entry.location,
            // This exposes COBE's native CSS anchor without drawing a dot.
            size: 0,
          })),
        });
        globeRef.current = globe;
        globe.update({ phi: phiRef.current, theta: thetaRef.current });
        setProjectedEntries(
          entries.map((entry) =>
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
              phiRef.current =
                (phiRef.current + AUTO_ROTATE_SPEED * elapsedFrames) %
                (Math.PI * 2);
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
                entries.map((entry) =>
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
  }, [entries]);

  const registerMarker = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) markerRefs.current.set(id, node);
      else markerRefs.current.delete(id);
    },
    [],
  );

  const focusSelectionOrigin = useCallback(() => {
    const originId = selectionOriginIdRef.current;
    window.requestAnimationFrame(() => {
      if (originId) {
        markerRefs.current.get(originId)?.focus({ preventScroll: true });
      } else {
        modalFallbackTriggerRef.current?.focus({ preventScroll: true });
      }
    });
  }, []);

  const dismissTransientSelection = useCallback(
    (restoreFocus = false) => {
      setSelection((current) =>
        current.kind === 'single' || current.kind === 'cluster'
          ? { kind: 'idle' }
          : current,
      );
      resumeAtRef.current = performance.now() + 1200;
      if (restoreFocus) focusSelectionOrigin();
    },
    [focusSelectionOrigin],
  );

  useEffect(
    () => () => {
      if (modalCloseTimerRef.current) {
        window.clearTimeout(modalCloseTimerRef.current);
      }
      if (detailsOpenFrameRef.current) {
        window.cancelAnimationFrame(detailsOpenFrameRef.current);
      }
      if (mapSamplesTimerRef.current) {
        window.clearTimeout(mapSamplesTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        (selection.kind === 'single' || selection.kind === 'cluster')
      ) {
        dismissTransientSelection(true);
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (
        (selection.kind === 'single' || selection.kind === 'cluster') &&
        event.target instanceof Element &&
        !event.target.closest('[data-mountain-selection]')
      ) {
        dismissTransientSelection(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [dismissTransientSelection, selection.kind]);

  const openEntry = (
    entry: MountainEntry,
    trigger: HTMLButtonElement,
    originId?: string,
  ) => {
    if (modalCloseTimerRef.current) {
      window.clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    if (detailsOpenFrameRef.current) {
      window.cancelAnimationFrame(detailsOpenFrameRef.current);
      detailsOpenFrameRef.current = null;
    }
    triggerHaptic();
    pauseRef.current = true;
    selectionOriginIdRef.current = originId ?? null;
    modalFallbackTriggerRef.current = originId ? null : trigger;
    setIsModalClosing(false);
    if (originId && isMobileStage) {
      // The mobile picker and details view are separate Radix portals. Let the
      // sheet leave the focus stack before the details dialog enters.
      setSelection({ kind: 'idle' });
      detailsOpenFrameRef.current = window.requestAnimationFrame(() => {
        detailsOpenFrameRef.current = null;
        pauseRef.current = true;
        setSelection({ kind: 'details', entry });
      });
      return;
    }
    // The desktop picker is an anchored popover, so opening synchronously is
    // both simpler and more reliable than waiting for another animation frame.
    setSelection({ kind: 'details', entry });
  };
  const closeEntry = () => {
    if (isModalClosing) return;
    triggerHaptic();
    setIsModalClosing(true);
    modalCloseTimerRef.current = window.setTimeout(() => {
      setIsModalClosing(false);
      setSelection({ kind: 'idle' });
      modalCloseTimerRef.current = null;
      focusSelectionOrigin();
    }, MODAL_CLOSE_DURATION);
  };
  const anchorStyle = (entry: ProjectedEntry): AnchorStyle => ({
    '--mountain-anchor': `--cobe-${entry.entry.id}`,
    '--mountain-left': `${entry.x * 100}%`,
    '--mountain-top': `${entry.y * 100}%`,
    '--mountain-visible': `var(--cobe-visible-${entry.entry.id}, ${entry.visible ? 1 : 0})`,
  });
  const updateZoom = (nextZoom: number) => {
    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
    // Scale applies every call so dragging/pinching feels immediate. Dot
    // density (mapSamples) is expensive to regenerate, so it's debounced to
    // settle ~120ms after the gesture stops moving instead of every frame.
    globeRef.current?.update({ scale: BASE_GLOBE_SCALE * nextZoom });
    if (mapSamplesTimerRef.current) {
      window.clearTimeout(mapSamplesTimerRef.current);
    }
    mapSamplesTimerRef.current = window.setTimeout(() => {
      mapSamplesTimerRef.current = null;
      const isMobile = window.matchMedia('(max-width: 639px)').matches;
      globeRef.current?.update({
        mapSamples: mapSamplesForZoom(isMobile, zoomRef.current),
      });
    }, 120);
    // While a pointer gesture is active, the rAF loop is already
    // re-projecting on its own ~90ms throttle (see `animate` above), so
    // re-projecting here too would just duplicate that work every move event.
    if (activePointersRef.current.size > 0) return;
    const currentSize = sizeRef.current;
    setProjectedEntries(
      entries.map((entry) =>
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
    dismissTransientSelection(false);
    updateZoom(nextZoom);
    resumeAtRef.current = performance.now() + 900;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-mountain-control]'))
      return;
    dismissTransientSelection(false);
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

  const markerTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeOut' as const };
  const clusterEntriesForList = (cluster: EntryCluster) =>
    [...cluster.entries].sort((a, b) =>
      a.entry.name.localeCompare(b.entry.name),
    );
  const toggleCluster = (cluster: EntryCluster) => {
    triggerHaptic();
    pauseRef.current = true;
    selectionOriginIdRef.current = cluster.id;
    setSelection((current) =>
      current.kind === 'cluster' && current.cluster.id === cluster.id
        ? { kind: 'idle' }
        : { kind: 'cluster', cluster },
    );
  };
  const activateSingleEntry = (
    entry: MountainEntry,
    trigger: HTMLButtonElement,
  ) => {
    if (selection.kind === 'single' && selection.entryId === entry.id) {
      openEntry(entry, trigger, entry.id);
      return;
    }
    triggerHaptic();
    pauseRef.current = true;
    selectionOriginIdRef.current = entry.id;
    setSelection({ kind: 'single', entryId: entry.id });
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

      <div className="mountain-story-column pointer-events-none absolute left-4 right-4 top-4 z-30 md:bottom-8 md:left-8 md:right-auto md:top-8 md:flex md:w-[min(22vw,320px)] md:flex-col md:justify-between">
        <div className="w-full max-w-60 md:max-w-none">
          <div className="flex items-baseline justify-between gap-4 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500 md:text-[11px]">
            <span>Mountains visited</span>
            <span className="shrink-0 tabular-nums tracking-[0.08em] text-gray-700">
              {visitedCount} / {entries.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${visitedCount} of ${entries.length} mountains visited`}
            aria-valuemin={0}
            aria-valuemax={entries.length}
            aria-valuenow={visitedCount}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200/90"
          >
            <div
              className="h-full rounded-full bg-gray-900 transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${visitedPercentage}%` }}
            />
          </div>
        </div>
        <p className="mountain-story-copy mt-3 max-w-[34rem] text-sm leading-relaxed text-gray-600 md:mt-0 md:text-[18px] md:leading-7">
          Born in Yunnan, one of the most mountainous regions in the world, I
          have always found a deep sense of serenity and belonging in the
          mountains. This is a map of the peaks I have visited—and my dream of
          exploring every beautiful mountain I can reach.
        </p>
      </div>

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
                const isOpen =
                  selection.kind === 'cluster' &&
                  selection.cluster.id === cluster.id;
                const isVisited = cluster.entries.some(
                  ({ entry }) => entry.status === 'visited',
                );
                const horizontalPlacement =
                  anchor.x < 0.3
                    ? '-left-5'
                    : anchor.x > 0.7
                      ? '-right-5'
                      : 'left-1/2 -translate-x-1/2';
                const verticalPlacement =
                  anchor.y < 0.45 ? 'top-8' : 'bottom-8';
                return (
                  <div
                    key={cluster.id}
                    className={`mountain-anchor pointer-events-none absolute ${isOpen ? 'z-30' : 'z-20'}`}
                    style={anchorStyle(anchor)}
                  >
                    <div className="-translate-x-1/2 -translate-y-1/2">
                      <motion.button
                        type="button"
                        data-mountain-control
                        data-mountain-selection
                        ref={(node) => registerMarker(cluster.id, node)}
                        onPointerDown={() => {
                          pauseRef.current = true;
                        }}
                        onClick={() => {
                          toggleCluster(cluster);
                        }}
                        whileHover={
                          prefersReducedMotion ? undefined : { scale: 1.06 }
                        }
                        whileTap={
                          prefersReducedMotion ? undefined : { scale: 0.94 }
                        }
                        transition={markerTransition}
                        className="group pointer-events-auto relative grid h-11 w-11 place-items-center rounded-full text-[28px] leading-none transition-colors hover:bg-white/55 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 md:text-[34px]"
                        aria-expanded={isOpen}
                        aria-label={`Show ${cluster.entries.length} destinations in this area`}
                      >
                        <span
                          aria-hidden="true"
                          className={`drop-shadow-[0_2px_3px_rgba(15,23,42,0.2)] transition-[opacity,filter] ${
                            isVisited
                              ? ''
                              : 'opacity-60 grayscale-[0.85] group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0'
                          }`}
                        >
                          ⛰️
                        </span>
                        <span
                          aria-hidden="true"
                          className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-gray-950 px-1 font-sans text-[10px] font-semibold leading-none text-white shadow-sm"
                        >
                          {cluster.entries.length}
                        </span>
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {isOpen && !isMobileStage && (
                        <motion.div
                          data-mountain-control
                          data-mountain-selection
                          role="dialog"
                          aria-label={`${cluster.entries.length} destinations in this area`}
                          initial={{ opacity: 0, scale: 0.96, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97, y: 2 }}
                          transition={markerTransition}
                          className={`pointer-events-auto absolute ${horizontalPlacement} ${verticalPlacement} w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl`}
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                              Mountains nearby
                            </p>
                            <button
                              type="button"
                              onClick={() => dismissTransientSelection(true)}
                              className="grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                              aria-label="Close destination list"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="max-h-[min(20rem,48vh)] overflow-y-auto p-1.5">
                            {clusterEntriesForList(cluster).map(({ entry }) => (
                              <button
                                type="button"
                                key={entry.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEntry(
                                    entry,
                                    event.currentTarget,
                                    cluster.id,
                                  );
                                }}
                                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400 ${
                                  entry.status === 'visited'
                                    ? 'bg-amber-50/70 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.1),0_0_16px_rgba(251,191,36,0.1)] hover:bg-amber-50 focus-visible:bg-amber-50'
                                    : 'hover:bg-gray-100 focus-visible:bg-gray-100'
                                }`}
                                aria-label={`Open ${entry.name}, ${COUNTRY_NAMES[entry.countryCode]}, ${entry.status === 'visited' ? 'visited' : 'waiting to be explored'}`}
                              >
                                <span className="min-w-0 truncate">
                                  {entry.name}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="flex shrink-0 items-center gap-2"
                                >
                                  {entry.status === 'visited' && (
                                    <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-amber-900">
                                      Visited
                                    </span>
                                  )}
                                  {countryFlag(entry.countryCode)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const { entry } = anchor;
              const isRevealed =
                selection.kind === 'single' && selection.entryId === entry.id;
              const horizontalLabelPlacement =
                anchor.x < 0.25
                  ? '-translate-x-[15%]'
                  : anchor.x > 0.75
                    ? '-translate-x-[85%]'
                    : '-translate-x-1/2';
              return (
                <div
                  key={entry.id}
                  className={`mountain-anchor pointer-events-none absolute ${isRevealed ? 'z-30' : 'z-10'}`}
                  style={anchorStyle(anchor)}
                >
                  <div
                    className={`${isRevealed ? horizontalLabelPlacement : '-translate-x-1/2'} -translate-y-1/2`}
                  >
                    <AnimatePresence initial={false} mode="wait">
                      {isRevealed ? (
                        <motion.button
                          key="name"
                          type="button"
                          data-mountain-control
                          data-mountain-selection
                          ref={(node) => registerMarker(entry.id, node)}
                          onPointerDown={() => {
                            pauseRef.current = true;
                          }}
                          onClick={(event) =>
                            activateSingleEntry(entry, event.currentTarget)
                          }
                          initial={{
                            opacity: 0,
                            scale: 0.94,
                            filter: 'blur(2px)',
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: 'blur(0px)',
                          }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={markerTransition}
                          className="pointer-events-auto flex h-11 max-w-[min(15rem,80vw)] items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-3 text-sm text-gray-950 shadow-[0_8px_24px_rgba(15,23,42,0.15)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          aria-label={`Open ${entry.name} details`}
                        >
                          <span className="truncate">{entry.name}</span>
                          <span aria-hidden="true" className="shrink-0">
                            {countryFlag(entry.countryCode)}
                          </span>
                        </motion.button>
                      ) : (
                        <motion.button
                          key="emoji"
                          type="button"
                          data-mountain-control
                          data-mountain-selection
                          ref={(node) => registerMarker(entry.id, node)}
                          onPointerDown={() => {
                            pauseRef.current = true;
                          }}
                          onClick={(event) =>
                            activateSingleEntry(entry, event.currentTarget)
                          }
                          initial={{
                            opacity: 0,
                            scale: 0.9,
                            filter: 'blur(2px)',
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: 'blur(0px)',
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.86,
                            filter: 'blur(2px)',
                          }}
                          whileHover={
                            prefersReducedMotion ? undefined : { scale: 1.06 }
                          }
                          whileTap={
                            prefersReducedMotion ? undefined : { scale: 0.94 }
                          }
                          transition={markerTransition}
                          className="group pointer-events-auto grid h-11 w-11 place-items-center rounded-full text-[28px] leading-none transition-colors hover:bg-white/55 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 md:text-[34px]"
                          aria-label={`Show ${entry.name}, ${COUNTRY_NAMES[entry.countryCode]}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`drop-shadow-[0_2px_3px_rgba(15,23,42,0.2)] transition-[opacity,filter] ${
                              entry.status === 'visited'
                                ? ''
                                : 'opacity-60 grayscale-[0.85] group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0'
                            }`}
                          >
                            ⛰️
                          </span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
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
                  {entries.map((entry) => (
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
        </div>
      </div>

      <DialogPrimitive.Root open={Boolean(selectedCluster && isMobileStage)}>
        {selectedCluster && isMobileStage && (
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/15 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              data-mountain-selection
              className="mountain-picker-sheet fixed bottom-2 left-1/2 z-[60] flex max-h-[min(55dvh,25rem)] w-[calc(100%-1rem)] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/[0.98] shadow-[0_24px_70px_rgba(15,23,42,0.24)] focus:outline-none"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                window.requestAnimationFrame(() => {
                  mobileFirstDestinationRef.current?.focus({
                    preventScroll: true,
                  });
                });
              }}
              onCloseAutoFocus={(event) => event.preventDefault()}
              onPointerDownOutside={() => dismissTransientSelection(false)}
              onEscapeKeyDown={(event) => {
                event.preventDefault();
                dismissTransientSelection(true);
              }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 pb-3 pt-4">
                <div>
                  <DialogPrimitive.Title className="text-base font-medium text-gray-950">
                    Mountains nearby
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-0.5 text-xs text-gray-500">
                    Choose a destination to see its details.
                  </DialogPrimitive.Description>
                </div>
                <button
                  type="button"
                  onClick={() => dismissTransientSelection(true)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close destination list</span>
                </button>
              </div>
              <div className="min-h-0 overflow-y-auto p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {clusterEntriesForList(selectedCluster).map(
                  ({ entry }, index) => (
                    <button
                      type="button"
                      key={entry.id}
                      ref={
                        index === 0
                          ? (node) => {
                              mobileFirstDestinationRef.current = node;
                            }
                          : undefined
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        openEntry(
                          entry,
                          event.currentTarget,
                          selectedCluster.id,
                        );
                      }}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-gray-950 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400 ${
                        entry.status === 'visited'
                          ? 'bg-amber-50/70 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.1),0_0_18px_rgba(251,191,36,0.1)] hover:bg-amber-50 focus-visible:bg-amber-50'
                          : 'hover:bg-gray-100 focus-visible:bg-gray-100'
                      }`}
                      aria-label={`Open ${entry.name}, ${COUNTRY_NAMES[entry.countryCode]}, ${entry.status === 'visited' ? 'visited' : 'waiting to be explored'}`}
                    >
                      <span className="min-w-0 truncate">{entry.name}</span>
                      <span
                        aria-hidden="true"
                        className="flex shrink-0 items-center gap-2 text-base"
                      >
                        {entry.status === 'visited' && (
                          <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-amber-900">
                            Visited
                          </span>
                        )}
                        {countryFlag(entry.countryCode)}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </DialogPrimitive.Root>

      <Dialog
        open={selection.kind === 'details'}
        onOpenChange={(open) => {
          if (!open) {
            closeEntry();
          }
        }}
      >
        {selectedEntry && (
          <DialogContent
            ref={modalContentRef}
            forceMount
            onClose={closeEntry}
            overlayClassName={`mountain-modal-overlay !z-[70] bg-gray-950/60 backdrop-blur-[2px] ${
              isModalClosing ? 'is-closing' : ''
            }`}
            closeButtonClassName={
              selectedEntry.image
                ? '!right-3 !top-3 !h-10 !w-10 border border-white/60 bg-white/85 text-gray-700 opacity-100 shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur-sm hover:bg-white'
                : '!right-3 !top-3 !h-10 !w-10 border border-gray-200 bg-white/95 text-gray-700 opacity-100 shadow-[0_4px_16px_rgba(15,23,42,0.08)] hover:border-gray-300 hover:bg-gray-50 sm:!right-4 sm:!top-4'
            }
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              closeEntry();
            }}
            onPointerDownOutside={(event) => {
              event.preventDefault();
              closeEntry();
            }}
            className={`mountain-modal !z-[80] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[26rem] flex-col overflow-hidden rounded-[1.5rem] bg-white p-0 shadow-[0_28px_90px_rgba(0,0,0,0.28)] focus:outline-none sm:rounded-[1.75rem] ${
              selectedEntry.image ? 'border-0' : 'border-gray-200/80'
            } ${isModalClosing ? 'is-closing' : ''}`}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              window.requestAnimationFrame(() => {
                modalContentRef.current?.focus({ preventScroll: true });
              });
            }}
          >
            <div className="min-h-0 overflow-y-auto">
              {selectedEntry.image ? (
                <div className="border-b border-gray-100">
                  <EntryHeroPhoto entry={selectedEntry} />
                </div>
              ) : (
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 pb-4 pt-6 sm:px-7">
                  <span
                    aria-hidden="true"
                    className={`h-8 w-1 shrink-0 rounded-full ${
                      selectedEntry.status === 'visited'
                        ? 'bg-gray-900'
                        : 'bg-gray-300'
                    }`}
                  />
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                    {selectedEntry.type} ·{' '}
                    {selectedEntry.status === 'visited'
                      ? 'Visited · No photograph'
                      : 'Waiting to be explored'}
                  </p>
                </div>
              )}
              <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
                <div className="min-w-0">
                  <DialogHeader className="min-w-0 text-left">
                    {selectedEntry.image && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                        <span>{selectedEntry.type}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {selectedEntry.status === 'visited'
                            ? 'Visited'
                            : 'Waiting to be explored'}
                        </span>
                      </div>
                    )}
                    <DialogTitle className="min-w-0 text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-gray-950 sm:text-[1.7rem]">
                      <span
                        role="img"
                        aria-label={COUNTRY_NAMES[selectedEntry.countryCode]}
                        className="mr-2"
                      >
                        {countryFlag(selectedEntry.countryCode)}
                      </span>
                      {selectedEntry.name}
                    </DialogTitle>
                    {selectedEntry.description ? (
                      <DialogDescription className="whitespace-pre-line pt-2 text-[15px] leading-7 text-gray-600">
                        {selectedEntry.description}
                      </DialogDescription>
                    ) : (
                      <DialogDescription className="sr-only">
                        {`${selectedEntry.name}, ${selectedEntry.status === 'visited' ? 'visited' : 'waiting to be explored'}.`}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  <dl className="mt-5 overflow-hidden rounded-2xl border border-gray-200/90 bg-gray-50/60 text-sm text-gray-700">
                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3 px-4 py-3.5">
                      <dt className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
                        <span
                          aria-hidden="true"
                          className="text-sm leading-none"
                        >
                          ✈️
                        </span>
                        Airport
                      </dt>
                      <dd className="min-w-0 leading-5 text-gray-800">
                        <span className="font-medium">
                          {selectedEntry.gatewayAirport.name} (
                          {selectedEntry.gatewayAirport.code})
                        </span>
                        {selectedEntry.gatewayAirport.note && (
                          <span className="text-gray-500">
                            {' · '}
                            {selectedEntry.gatewayAirport.note}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3 border-t border-gray-200/80 px-4 py-3.5">
                      <dt className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
                        <span
                          aria-hidden="true"
                          className="text-sm leading-none"
                        >
                          🧭
                        </span>
                        Region
                      </dt>
                      <dd className="min-w-0 font-medium leading-5 text-gray-800">
                        {selectedEntry.region}
                      </dd>
                    </div>
                    {selectedEntry.park && (
                      <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3 border-t border-gray-200/80 px-4 py-3.5">
                        <dt className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500">
                          <span
                            aria-hidden="true"
                            className="text-sm leading-none"
                          >
                            🏞️
                          </span>
                          Park / reserve
                        </dt>
                        <dd className="min-w-0 font-medium leading-5 text-gray-800">
                          {selectedEntry.park}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-4">
                    <a
                      href={selectedEntry.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={triggerHaptic}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 text-sm text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-400 hover:bg-white hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                      aria-label={`Open ${selectedEntry.name} in Google Maps`}
                    >
                      <Image
                        src="/images/icons/pin.png"
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] object-contain"
                      />
                      <span>View on Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
