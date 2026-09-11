// Vendored from the roomwalk plugin (skills/roomwalk/web/scroll_frames.js).
// Scrubs a numbered frame sequence onto a <canvas> as the page scrolls.

export interface ScrollFramesTimelineStep {
  to: number;
  scroll: number;
}

export interface ScrollFramesOptions {
  canvas: HTMLCanvasElement;
  scroller?: HTMLElement | null;
  dir: string;
  manifest: string;
  mobileStride?: number;
  mobileQuery?: string;
  respectReducedMotion?: boolean;
  timeline?: ScrollFramesTimelineStep[] | null;
  ease?: boolean;
  fit?: "cover" | "contain";
  zoom?: number;
  pingpong?: boolean;
  offsetX?: number;
  offsetY?: number;
  onFrame?: ((progress: number, slot: number) => void) | null;
}

export default class ScrollFrames {
  constructor(options: ScrollFramesOptions);
  start(): Promise<void>;
  onScroll(): void;
  /** Scroll fraction 0..1 of the scroller through its sticky range. */
  progress(): number;
  /** Maps a scroll fraction through the timeline to a frame fraction 0..1. */
  curve(p: number): number;
  /** Draw a given slot index onto the canvas. */
  draw(slot: number): void;
  redraw(): void;
  destroy(): void;
  zoom: number;
  /** The slot indices the scrubber walks (length reflects mobile stride). */
  indices: number[];
  /** Requested slot after the last draw, or -1 if nothing has been drawn. */
  current: number;
  /** Slot actually blitted after the last draw, or -1 if no frame was available. */
  drawn: number;
}
