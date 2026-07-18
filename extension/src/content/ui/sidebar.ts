import { Settings, LyricsData, PlaybackState } from '../../common/types';
import { saveSettings } from '../../common/settings';

export class SidebarView {
  private container: HTMLElement;
  private element: HTMLDivElement | null = null;
  private settings: Settings;
  private lyricsData: LyricsData | null = null;
  private activeIndex: number = -1;
  private isInstrumental: boolean = false;

  private isResizing = false;
  private startX = 0;
  private startWidth = 0;

  private onCloseCallback: () => void;
  private onFullscreenCallback: () => void;
  private onPipCallback: () => void;

  constructor(container: HTMLElement, settings: Settings, onClose: () => void, onFullscreen: () => void, onPip: () => void) {
    this.container = container;
    this.settings = settings;
    this.onCloseCallback = onClose;
    this.onFullscreenCallback = onFullscreen;
    this.onPipCallback = onPip;
  }

  public render(lyricsData: LyricsData | null, searchFailed: boolean = false) {
    this.lyricsData = lyricsData;
    this.destroy();

    const sidebar = document.createElement('div');
    sidebar.className = `glass-panel lyrics-sidebar ${this.settings.sidebarPosition}`;
    sidebar.style.width = `${this.settings.sidebarWidth}px`;
    sidebar.style.opacity = String(this.settings.opacity);
    sidebar.style.setProperty('--lyrics-font-size', `${this.settings.fontSize}px`);

    const header = document.createElement('div');
    header.className = 'panel-header';
    // Sidebar header doesn't need dragging, just titles and close
    header.innerHTML = `
      <div class="panel-title">${lyricsData ? lyricsData.title : 'No Music Playing'}</div>
      <div class="panel-controls">
        <button class="btn-icon btn-fullscreen" title="Toggle fullscreen mode">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
        <button class="btn-icon btn-pip" title="Open floating PiP window">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <rect x="13" y="13" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <button class="btn-icon btn-close" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    const content = document.createElement('div');
    content.className = 'lyrics-content';
    
    const scroller = document.createElement('div');
    scroller.className = 'lyrics-scroller';
    content.appendChild(scroller);

    sidebar.appendChild(header);
    sidebar.appendChild(content);

    // Create resize border handle
    const resizeBorder = document.createElement('div');
    resizeBorder.className = 'sidebar-resize-handle';
    // Style the resize handle
    Object.assign(resizeBorder.style, {
      position: 'absolute',
      top: '0',
      bottom: '0',
      width: '6px',
      cursor: 'col-resize',
      zIndex: '10',
      background: 'transparent',
      transition: 'background 0.2s'
    });

    if (this.settings.sidebarPosition === 'right') {
      resizeBorder.style.left = '0';
    } else {
      resizeBorder.style.right = '0';
    }

    sidebar.appendChild(resizeBorder);
    
    this.element = sidebar;
    this.container.appendChild(sidebar);

    this.buildLyricsList(searchFailed);
    this.setupEvents(resizeBorder);
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

  private setupEvents(resizeHandle: HTMLDivElement) {
    if (!this.element) return;

    // 1. Sidebar Resize Events
    resizeHandle.addEventListener('pointerdown', this.onResizeStart);
    resizeHandle.addEventListener('mouseenter', () => {
      resizeHandle.style.background = 'rgba(255, 255, 255, 0.15)';
    });
    resizeHandle.addEventListener('mouseleave', () => {
      resizeHandle.style.background = 'transparent';
    });

    // 2. Close button
    const closeBtn = this.element.querySelector('.btn-close');
    closeBtn?.addEventListener('click', () => {
      this.onCloseCallback();
    });

    // 2b. Fullscreen button
    const fullscreenBtn = this.element.querySelector('.btn-fullscreen');
    fullscreenBtn?.addEventListener('click', () => {
      this.onFullscreenCallback();
    });

    // 2c. PiP button
    const pipBtn = this.element.querySelector('.btn-pip');
    pipBtn?.addEventListener('click', () => {
      this.onPipCallback();
    });
  }

  private onResizeStart = (e: PointerEvent) => {
    if (e.button !== 0) return;

    this.isResizing = true;
    this.startX = e.clientX;
    this.startWidth = parseFloat(this.element!.style.width);
    
    this.element!.setPointerCapture(e.pointerId);
    this.element!.addEventListener('pointermove', this.onResizeMove);
    this.element!.addEventListener('pointerup', this.onResizeEnd);
    
    e.preventDefault();
  };

  private onResizeMove = (e: PointerEvent) => {
    if (!this.isResizing || !this.element) return;

    const dx = e.clientX - this.startX;
    let newWidth = this.startWidth;

    if (this.settings.sidebarPosition === 'right') {
      newWidth = this.startWidth - dx;
    } else {
      newWidth = this.startWidth + dx;
    }

    // Restrict sidebar size
    newWidth = Math.max(250, Math.min(newWidth, window.innerWidth * 0.5));
    
    this.element.style.width = `${newWidth}px`;
  };

  private onResizeEnd = (e: PointerEvent) => {
    if (!this.isResizing) return;
    this.isResizing = false;

    if (this.element) {
      this.element.releasePointerCapture(e.pointerId);
      this.element.removeEventListener('pointermove', this.onResizeMove);
      this.element.removeEventListener('pointerup', this.onResizeEnd);

      const finalWidth = Math.round(parseFloat(this.element.style.width));
      this.settings.sidebarWidth = finalWidth;
      saveSettings({ sidebarWidth: finalWidth });
    }
  };

  public updateSyncState(activeIndex: number, isInstrumental: boolean) {
    if (!this.element || !this.lyricsData || !this.lyricsData.synced) return;
    
    if (this.activeIndex === activeIndex && this.isInstrumental === isInstrumental) return;
    
    this.activeIndex = activeIndex;
    this.isInstrumental = isInstrumental;

    const lines = this.element.querySelectorAll('.lyric-line');
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
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  public destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
