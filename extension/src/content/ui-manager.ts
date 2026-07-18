import { Settings, LyricsData, PlaybackState, TrackMetadata, DisplayMode } from '../common/types';
import { getSettings } from '../common/settings';
import { LyricsSynchronizer } from './lyrics-sync';
import { OverlayView } from './ui/overlay';
import { SidebarView } from './ui/sidebar';
import { FullscreenView } from './ui/fullscreen';
import { stylesText } from './styles';

export class UIManager {
  private host: HTMLElement;
  private container: HTMLDivElement;
  private settings: Settings;
  private synchronizer: LyricsSynchronizer;
  
  private overlayView: OverlayView;
  private sidebarView: SidebarView;
  private fullscreenView: FullscreenView;
  private pipView: OverlayView | null = null;

  private currentTrack: TrackMetadata | null = null;
  private lyricsData: LyricsData | null = null;
  private coverUrl: string = '';
  private activeIndex: number = -1;
  private isInstrumental: boolean = false;
  
  private isExtensionActive = false;
  private isFullscreenActive = false;
  private isLoading = false;
  private searchFailed = false;

  constructor(host: HTMLElement, container: HTMLDivElement, settings: Settings) {
    this.host = host;
    this.container = container;
    this.settings = settings;
    
    this.synchronizer = new LyricsSynchronizer();
    this.overlayView = new OverlayView(this.container, this.settings, () => this.toggleActive(), () => this.toggleFullscreen(), () => this.togglePip());
    this.sidebarView = new SidebarView(this.container, this.settings, () => this.toggleActive(), () => this.toggleFullscreen(), () => this.togglePip());
    this.fullscreenView = new FullscreenView(this.container, this.settings, () => this.toggleFullscreen());

    this.init();
  }

  private async init() {
    // Read extension active state from local storage
    return new Promise<void>((resolve) => {
      chrome.storage.local.get(['extension_active'], (res) => {
        this.isExtensionActive = res.extension_active !== false; // Default to true if not set
        this.isFullscreenActive = false; // Always start as false on page load
        chrome.storage.local.set({ fullscreen_active: false }); // Reset in storage
        this.updateViewVisibility();
        resolve();
      });
    });
  }

  public updateSettings(settings: Settings) {
    // 1. Destroy old views first to prevent stacking/duplication
    this.overlayView.destroy();
    this.sidebarView.destroy();
    this.fullscreenView.destroy();

    const modeChanged = this.settings.mode !== settings.mode;
    const sidebarPosChanged = this.settings.sidebarPosition !== settings.sidebarPosition;
    
    this.settings = settings;
    
    // Refresh theme attribute on shadow host
    this.host.setAttribute('theme', settings.theme === 'adaptive' ? this.detectYTMusicTheme() : settings.theme);

    // Recreate views with new settings references and callbacks
    this.overlayView = new OverlayView(this.container, this.settings, () => this.toggleActive(), () => this.toggleFullscreen(), () => this.togglePip());
    this.sidebarView = new SidebarView(this.container, this.settings, () => this.toggleActive(), () => this.toggleFullscreen(), () => this.togglePip());
    this.fullscreenView = new FullscreenView(this.container, this.settings, () => this.toggleFullscreen());

    if (modeChanged || sidebarPosChanged) {
      this.updateViewVisibility();
    } else {
      // Just re-render active view to apply styling settings (font size, opacity, etc.)
      this.renderActiveView();
    }
  }

  private detectYTMusicTheme(): 'light' | 'dark' {
    // YouTube Music is dark by default, check html style
    const isLight = document.documentElement.hasAttribute('style') && 
                    document.documentElement.getAttribute('style')?.includes('--ytmusic-background-color: #ffffff');
    return isLight ? 'light' : 'dark';
  }

  public toggleActive() {
    this.isExtensionActive = !this.isExtensionActive;
    chrome.storage.local.set({ extension_active: this.isExtensionActive });
    this.updateViewVisibility();
  }

  public toggleFullscreen() {
    this.isFullscreenActive = !this.isFullscreenActive;
    chrome.storage.local.set({ fullscreen_active: this.isFullscreenActive });
    this.updateViewVisibility();
  }

  private updateViewVisibility() {
    // Clear container HTML completely to prevent stacking
    this.container.innerHTML = '';

    // Clear all rendering
    this.overlayView.destroy();
    this.sidebarView.destroy();
    this.fullscreenView.destroy();

    // Reset layout shifts of YouTube Music body to make room for sidebar
    document.body.style.marginLeft = '0px';
    document.body.style.marginRight = '0px';
    document.body.style.transition = 'margin 0.3s ease';

    if (this.pipView) {
      return;
    }

    if (this.isFullscreenActive) {
      this.fullscreenView.render(this.lyricsData, this.coverUrl, this.searchFailed);
      if (this.isLoading) this.showLoadingState();
      this.updateSync();
      return;
    }

    if (!this.isExtensionActive) {
      return;
    }

    if (this.settings.mode === 'overlay') {
      this.overlayView.render(this.lyricsData, this.searchFailed);
    } else if (this.settings.mode === 'sidebar') {
      this.sidebarView.render(this.lyricsData, this.searchFailed);
      
      // Shift YouTube music player view to avoid overlaying essential buttons
      const margin = `${this.settings.sidebarWidth}px`;
      if (this.settings.sidebarPosition === 'right') {
        document.body.style.marginRight = margin;
      } else {
        document.body.style.marginLeft = margin;
      }
    }

    if (this.isLoading) {
      this.showLoadingState();
    } else {
      this.updateSync();
    }
  }

  private renderActiveView() {
    if (this.pipView) {
      this.pipView.render(this.lyricsData, this.searchFailed);
      return;
    }

    if (this.isFullscreenActive) {
      this.fullscreenView.render(this.lyricsData, this.coverUrl, this.searchFailed);
    } else if (this.isExtensionActive) {
      if (this.settings.mode === 'overlay') {
        this.overlayView.render(this.lyricsData, this.searchFailed);
      } else if (this.settings.mode === 'sidebar') {
        this.sidebarView.render(this.lyricsData, this.searchFailed);
      }
    }
    this.updateSync();
  }

  public async setTrack(metadata: TrackMetadata) {
    this.currentTrack = metadata;
    this.coverUrl = metadata.coverUrl;
    this.lyricsData = null;
    this.isLoading = true;
    this.searchFailed = false;
    
    // Set theme on shadow root based on YT Music state
    this.host.setAttribute('theme', this.settings.theme === 'adaptive' ? this.detectYTMusicTheme() : this.settings.theme);

    // Pre-render layout showing loading state
    this.renderActiveView();
    this.showLoadingState();

    // Request lyrics from background script
    chrome.runtime.sendMessage(
      {
        action: 'fetch-lyrics',
        artist: metadata.artist,
        title: metadata.title,
        duration: metadata.duration,
        album: metadata.album
      },
      (response) => {
        this.isLoading = false;
        if (response && response.success && response.lyrics) {
          this.searchFailed = false;
          this.setLyrics(response.lyrics);
        } else {
          // Lyrics not found
          this.searchFailed = true;
          this.setLyrics(null);
        }
      }
    );
  }

  public setLyrics(lyrics: LyricsData | null) {
    this.lyricsData = lyrics;
    if (lyrics) {
      this.searchFailed = false;
      this.synchronizer.setLyrics(lyrics);
    }
    this.renderActiveView();
  }

  private showLoadingState() {
    const scroller = this.container.shadowRoot?.querySelector('.lyrics-scroller');
    if (scroller) {
      scroller.innerHTML = `
        <div class="state-container">
          <div class="spinner"></div>
          <div class="state-message">Searching synchronized lyrics...</div>
        </div>
      `;
    }

    if (this.pipView && this.pipView.elementRef) {
      const pipScroller = this.pipView.elementRef.querySelector('.lyrics-scroller');
      if (pipScroller) {
        pipScroller.innerHTML = `
          <div class="state-container">
            <div class="spinner"></div>
            <div class="state-message">Searching synchronized lyrics...</div>
          </div>
        `;
      }
    }
  }

  public updatePlaybackState(state: PlaybackState) {
    if (!this.lyricsData || !this.lyricsData.synced) return;

    // Call lyrics-sync engine to find current positions
    const { activeIndex, isInstrumental } = this.synchronizer.syncTime(state.currentTime);
    
    this.activeIndex = activeIndex;
    this.isInstrumental = isInstrumental;

    this.updateSync();
  }

  private updateSync() {
    if (this.pipView) {
      this.pipView.updateSyncState(this.activeIndex, this.isInstrumental);
      return;
    }

    if (this.isFullscreenActive) {
      this.fullscreenView.updateSyncState(this.activeIndex, this.isInstrumental);
      this.fullscreenView.updateBackgroundBlur(this.coverUrl);
    } else if (this.isExtensionActive) {
      if (this.settings.mode === 'overlay') {
        this.overlayView.updateSyncState(this.activeIndex, this.isInstrumental);
      } else if (this.settings.mode === 'sidebar') {
        this.sidebarView.updateSyncState(this.activeIndex, this.isInstrumental);
      }
    }
  }

  public handleManualSearchResult(lyrics: LyricsData) {
    this.searchFailed = false;
    this.setLyrics(lyrics);
  }

  public async togglePip() {
    if (!('documentPictureInPicture' in window)) {
      alert('Document Picture-in-Picture is not supported in this browser. Please use Chrome 116+');
      return;
    }

    const dpip = (window as any).documentPictureInPicture;

    if (dpip.window) {
      dpip.window.close();
      return;
    }

    try {
      const pipWindow = await dpip.requestWindow({
        width: 480,
        height: 600
      });

      // Set window title to current song
      if (this.lyricsData) {
        pipWindow.document.title = `${this.lyricsData.title} - ${this.lyricsData.artist}`;
      } else {
        pipWindow.document.title = 'Lyrics';
      }

      // Create style tag inside the PiP window document
      const style = pipWindow.document.createElement('style');
      const processedCSS = stylesText
        .replace(/:host\((.*?)\)/g, 'body$1')
        .replace(/:host/g, 'body')
        .replace(/html/g, 'body') + `
        /* PiP overrides to hide unnecessary controls */
        .btn-pip, .btn-clickthrough, .btn-fullscreen, .resize-handle { display: none !important; }
        .panel-header { cursor: default !important; background: rgba(255, 255, 255, 0.02) !important; border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; padding: 10px 15px !important; }
        .panel-title { font-size: 12px !important; font-weight: 500 !important; color: rgba(255, 255, 255, 0.7) !important; max-width: 100% !important; text-align: center; }
        .glass-panel { border-radius: 0 !important; border: none !important; box-shadow: none !important; height: 100vh !important; background: transparent !important; backdrop-filter: none !important; }
        
        /* Premium Centered Lyrics Layout */
        .lyrics-content { display: flex !important; flex-direction: column !important; height: calc(100vh - 38px) !important; }
        .lyrics-scroller { 
          display: flex !important; 
          flex-direction: column !important; 
          align-items: center !important; 
          padding: 50px 24px !important;
          text-align: center !important;
        }
        .lyric-line {
          padding: 16px 12px !important;
          font-size: 19px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          opacity: 0.3 !important;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
          width: 100% !important;
          text-align: center !important;
          border-radius: 8px !important;
        }
        .lyric-line.active {
          opacity: 1 !important;
          font-size: 24px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.45) !important;
          transform: scale(1.04);
        }
        .lyric-line:not(.active):hover {
          opacity: 0.6 !important;
        }
      `;
      style.textContent = processedCSS;
      pipWindow.document.head.appendChild(style);

      const theme = this.settings.theme === 'adaptive' ? this.detectYTMusicTheme() : this.settings.theme;
      pipWindow.document.body.setAttribute('theme', theme);
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.padding = '0';
      
      // Modern radial gradient background
      if (theme === 'light') {
        pipWindow.document.body.style.background = 'radial-gradient(circle at center, #ffffff 0%, #f3f4f6 100%)';
      } else {
        pipWindow.document.body.style.background = 'radial-gradient(circle at center, #1c1c21 0%, #070708 100%)';
      }

      this.pipView = new OverlayView(
        pipWindow.document.body,
        this.settings,
        () => dpip.window?.close(),
        () => {},
        () => {}
      );
      
      this.pipView.render(this.lyricsData, this.searchFailed);
      this.pipView.updateSyncState(this.activeIndex, this.isInstrumental);

      // Hide standard page layouts
      this.updateViewVisibility();

      pipWindow.addEventListener('pagehide', () => {
        this.pipView?.destroy();
        this.pipView = null;
        this.updateViewVisibility();
      });

    } catch (err) {
      console.error('Failed to enter Document PiP:', err);
    }
  }
}
