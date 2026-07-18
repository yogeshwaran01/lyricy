export type DisplayMode = 'overlay' | 'sidebar' | 'fullscreen';
export type Theme = 'light' | 'dark' | 'adaptive';
export type ProviderType = 'lrclib' | 'betterlyrics';
export type AnimationSpeed = 'smooth' | 'fast' | 'off';

export interface OverlayPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Settings {
  mode: DisplayMode;
  theme: Theme;
  fontSize: number; // in pixels
  opacity: number;  // 0.0 to 1.0
  providerPriority: ProviderType[];
  animationSpeed: AnimationSpeed;
  clickThrough: boolean;
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  fullscreenArtAnimation: boolean;
  overlayPosition: OverlayPosition;
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
  translation?: string;
}

export interface LyricsData {
  lines: LyricLine[];
  synced: boolean;
  title: string;
  artist: string;
  provider: string;
  rawLrc?: string;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
}

export interface PlaybackState {
  currentTime: number;
  duration: number;
  paused: boolean;
  timestamp: number; // Date.now() when captured
}
