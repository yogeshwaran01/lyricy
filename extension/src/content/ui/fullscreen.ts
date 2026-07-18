import { Settings, LyricsData, PlaybackState } from '../../common/types';

export class FullscreenView {
  private container: HTMLElement;
  private element: HTMLDivElement | null = null;
  private settings: Settings;
  private lyricsData: LyricsData | null = null;
  private activeIndex: number = -1;
  private isInstrumental: boolean = false;
  private currentCoverUrl: string = '';

  private onCloseCallback: () => void;

  constructor(container: HTMLElement, settings: Settings, onClose: () => void) {
    this.container = container;
    this.settings = settings;
    this.onCloseCallback = onClose;
  }

  public render(lyricsData: LyricsData | null, coverUrl: string = '', searchFailed: boolean = false) {
    this.lyricsData = lyricsData;
    this.destroy();

    const fullscreen = document.createElement('div');
    fullscreen.className = 'lyrics-fullscreen';
    fullscreen.style.setProperty('--lyrics-font-size', '36px'); // Default large fullscreen font size

    // Background blurred containers
    const bgContainer = document.createElement('div');
    bgContainer.className = 'fullscreen-bg';
    
    const bgImg1 = document.createElement('img');
    bgImg1.className = 'fullscreen-bg-blur bg-image-1';
    
    const bgImg2 = document.createElement('img');
    bgImg2.className = 'fullscreen-bg-blur bg-image-2';

    bgContainer.appendChild(bgImg1);
    bgContainer.appendChild(bgImg2);

    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';

    // Header showing currently playing track info
    const header = document.createElement('div');
    header.className = 'fullscreen-header';
    
    const artImg = document.createElement('img');
    artImg.className = 'fullscreen-art';
    artImg.src = coverUrl || 'https://music.youtube.com/img/on_platform_logo_dark.svg';
    
    const trackInfo = document.createElement('div');
    trackInfo.className = 'fullscreen-track-info';
    
    const title = document.createElement('div');
    title.className = 'fullscreen-title';
    title.textContent = lyricsData ? lyricsData.title : 'No Music Playing';
    
    const artist = document.createElement('div');
    artist.className = 'fullscreen-artist';
    artist.textContent = lyricsData ? lyricsData.artist : 'YouTube Music';

    trackInfo.appendChild(title);
    trackInfo.appendChild(artist);
    header.appendChild(artImg);
    header.appendChild(trackInfo);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fullscreen-close';
    closeBtn.title = 'Exit Fullscreen (Esc)';
    closeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>
      </svg>
    `;

    // Lyrics content area
    const content = document.createElement('div');
    content.className = 'fullscreen-content';
    
    const lyricsContent = document.createElement('div');
    lyricsContent.className = 'lyrics-content';
    
    const scroller = document.createElement('div');
    scroller.className = 'lyrics-scroller';
    
    lyricsContent.appendChild(scroller);
    content.appendChild(lyricsContent);

    fullscreen.appendChild(bgContainer);
    fullscreen.appendChild(overlay);
    fullscreen.appendChild(header);
    fullscreen.appendChild(closeBtn);
    fullscreen.appendChild(content);

    // Inject custom animation styles for breathing background
    const style = document.createElement('style');
    style.id = 'fullscreen-animation-styles';
    style.textContent = `
      @keyframes slowPan {
        0% { transform: scale(1.1) translate(0, 0) rotate(0deg); }
        33% { transform: scale(1.18) translate(-3%, 2%) rotate(1.5deg); }
        66% { transform: scale(1.12) translate(2%, -3%) rotate(-1.5deg); }
        100% { transform: scale(1.1) translate(0, 0) rotate(0deg); }
      }
      .fullscreen-bg-blur.active {
        animation: slowPan 45s ease-in-out infinite alternate;
      }
    `;
    fullscreen.appendChild(style);

    this.element = fullscreen;
    this.container.appendChild(fullscreen);

    // Update background blur image
    this.updateBackgroundBlur(coverUrl);
    
    this.buildLyricsList(searchFailed);
    this.setupEvents();
  }

  private buildLyricsList(searchFailed: boolean) {
    if (!this.element) return;
    const scroller = this.element.querySelector('.lyrics-scroller');
    if (!scroller) return;

    scroller.innerHTML = '';

    if (!this.lyricsData || this.lyricsData.lines.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'state-container';
      emptyState.innerHTML = `
        <div class="state-message">${searchFailed ? 'No lyrics found for this track. Try searching manually in the extension popup.' : 'No music playing. Start playback on YouTube Music.'}</div>
      `;
      scroller.appendChild(emptyState);
      return;
    }

    const lines = this.lyricsData.lines;
    const isSynced = this.lyricsData.synced;

    lines.forEach((line, idx) => {
      const el = document.createElement('div');
      el.className = `lyric-line ${this.settings.animationSpeed}`;
      if (!isSynced) {
        el.classList.add('unsynced');
      }
      el.textContent = line.text;
      el.dataset.index = String(idx);

      if (isSynced && line.time !== -1) {
        el.addEventListener('click', () => {
          const video = document.querySelector('video');
          if (video) {
            video.currentTime = line.time;
          }
        });
      }

      scroller.appendChild(el);
    });
  }

  private setupEvents() {
    if (!this.element) return;

    // 1. Close button click
    const closeBtn = this.element.querySelector('.fullscreen-close');
    closeBtn?.addEventListener('click', () => {
      this.exitFullscreen();
    });

    // 2. Keyboard shortcut escape
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.exitFullscreen();
    }
  };

  private exitFullscreen() {
    this.onCloseCallback();
  }

  public updateBackgroundBlur(coverUrl: string) {
    if (!this.element) return;
    
    const defaultCover = 'https://music.youtube.com/img/on_platform_logo_dark.svg';
    const urlToLoad = coverUrl || defaultCover;
    
    if (this.currentCoverUrl === urlToLoad) return;
    this.currentCoverUrl = urlToLoad;

    const img1 = this.element.querySelector('.bg-image-1') as HTMLImageElement;
    const img2 = this.element.querySelector('.bg-image-2') as HTMLImageElement;
    
    if (!img1 || !img2) return;

    const activeImg = img1.classList.contains('active') ? img1 : img2;
    const inactiveImg = activeImg === img1 ? img2 : img1;

    let transitionTriggered = false;
    const triggerTransition = () => {
      if (transitionTriggered) return;
      transitionTriggered = true;
      activeImg.classList.remove('active');
      inactiveImg.classList.add('active');
    };

    inactiveImg.onload = triggerTransition;
    inactiveImg.onerror = () => {
      if (inactiveImg.src !== defaultCover) {
        inactiveImg.src = defaultCover;
      } else {
        triggerTransition();
      }
    };

    inactiveImg.src = urlToLoad;
    
    if (inactiveImg.complete) {
      triggerTransition();
    }
  }

  public updateSyncState(activeIndex: number, isInstrumental: boolean) {
    if (!this.element || !this.lyricsData || !this.lyricsData.synced) return;
    
    if (this.activeIndex === activeIndex && this.isInstrumental === isInstrumental) return;
    
    this.activeIndex = activeIndex;
    this.isInstrumental = isInstrumental;

    const lines = this.element.querySelectorAll('.lyric-line');
    
    // Reset active state
    lines.forEach(line => line.classList.remove('active'));

    if (isInstrumental) {
      let instrumentalLine = this.element.querySelector('.lyric-line.instrumental') as HTMLDivElement;
      if (!instrumentalLine) {
        instrumentalLine = document.createElement('div');
        instrumentalLine.className = 'lyric-line instrumental active';
        instrumentalLine.textContent = '• • •';
        
        const scroller = this.element.querySelector('.lyrics-scroller');
        if (scroller) {
          if (activeIndex >= 0 && activeIndex < lines.length) {
            lines[activeIndex].after(instrumentalLine);
          } else {
            scroller.prepend(instrumentalLine);
          }
        }
      }
      instrumentalLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      this.element.querySelectorAll('.lyric-line.instrumental').forEach(el => el.remove());
      
      if (activeIndex >= 0 && activeIndex < lines.length) {
        const activeLine = lines[activeIndex] as HTMLElement;
        activeLine.classList.add('active');
        
        // Smoothly center the active line
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
