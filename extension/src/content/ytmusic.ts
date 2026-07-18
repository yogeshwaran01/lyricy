import { TrackMetadata, PlaybackState } from '../common/types';

export class YTMusicObserver {
  private trackCallback: (metadata: TrackMetadata) => void;
  private playbackCallback: (state: PlaybackState) => void;
  
  private currentTrack: TrackMetadata | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private observer: MutationObserver | null = null;
  private playbackInterval: any = null;

  constructor(
    onTrackChanged: (metadata: TrackMetadata) => void,
    onPlaybackStateChanged: (state: PlaybackState) => void
  ) {
    this.trackCallback = onTrackChanged;
    this.playbackCallback = onPlaybackStateChanged;
    this.init();
  }

  private init() {
    this.observeMetadata();
    this.findVideoElement();

    // Periodically re-verify video element attachment in case YT Music changes page states
    setInterval(() => {
      this.findVideoElement();
    }, 2000);
  }

  private observeMetadata() {
    const target = document.querySelector('ytmusic-player-bar');
    if (!target) {
      // Player bar might not be loaded yet, retry
      setTimeout(() => this.observeMetadata(), 1000);
      return;
    }

    console.log('YTMusicObserver: Observing ytmusic-player-bar');

    this.observer = new MutationObserver(() => {
      this.checkTrackChange();
    });

    this.observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['src', 'title']
    });

    // Run initial check
    this.checkTrackChange();
  }

  private findVideoElement() {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video && video !== this.videoElement) {
      this.videoElement = video;
      console.log('YTMusicObserver: Found HTML5 video player element');
      this.setupVideoListeners();
    }
  }

  private setupVideoListeners() {
    if (!this.videoElement) return;

    const events = ['play', 'pause', 'seeking', 'seeked', 'durationchange', 'timeupdate'];
    events.forEach(event => {
      this.videoElement!.removeEventListener(event, this.handlePlaybackUpdate);
      this.videoElement!.addEventListener(event, this.handlePlaybackUpdate);
    });

    // Start a smooth requestAnimationFrame loop for fluid scrolling when playing
    if (this.playbackInterval) clearInterval(this.playbackInterval);
    
    this.playbackInterval = setInterval(() => {
      if (this.videoElement && !this.videoElement.paused) {
        this.handlePlaybackUpdate();
      }
    }, 150); // Fetch position every 150ms for smooth synchronization
  }

  private handlePlaybackUpdate = () => {
    if (!this.videoElement) return;

    const state: PlaybackState = {
      currentTime: this.videoElement.currentTime,
      duration: this.videoElement.duration || 0,
      paused: this.videoElement.paused,
      timestamp: Date.now()
    };

    this.playbackCallback(state);
  };

  private checkTrackChange() {
    const titleEl = document.querySelector('.title.ytmusic-player-bar');
    const bylineEl = document.querySelector('.byline.ytmusic-player-bar');
    const coverEl = document.querySelector('ytmusic-player-bar img.image') || 
                      document.querySelector('.thumbnail-image-wrapper img') ||
                      document.querySelector('ytmusic-player-bar #thumbnail img');

    if (!titleEl || !titleEl.textContent) return;

    const title = titleEl.textContent.trim();
    const byline = bylineEl ? bylineEl.textContent || '' : '';
    
    // Parse byline: "Artist1, Artist2 • Album Name • Year"
    const parts = byline.split(/•|·/).map(p => p.trim());
    const artist = parts[0] || '';
    const album = parts[1] || '';

    const coverUrl = coverEl ? coverEl.getAttribute('src') || '' : '';
    const duration = this.videoElement ? this.videoElement.duration || 0 : 0;

    // Check if track metadata actually changed to prevent loop notifications
    if (
      !this.currentTrack ||
      this.currentTrack.title !== title ||
      this.currentTrack.artist !== artist ||
      this.currentTrack.coverUrl !== coverUrl
    ) {
      this.currentTrack = {
        title,
        artist,
        album,
        duration,
        coverUrl
      };

      console.log('YTMusicObserver: Track changed:', this.currentTrack);
      this.trackCallback(this.currentTrack);
    }
  }

  public forceTriggerUpdate() {
    if (this.currentTrack) {
      this.trackCallback(this.currentTrack);
    }
    this.handlePlaybackUpdate();
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
    }
    if (this.videoElement) {
      const events = ['play', 'pause', 'seeking', 'seeked', 'durationchange', 'timeupdate'];
      events.forEach(event => {
        this.videoElement!.removeEventListener(event, this.handlePlaybackUpdate);
      });
    }
  }
}
