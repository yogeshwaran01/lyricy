import { Settings, LyricsData, PlaybackState, LyricLine } from '../../common/types';
import { saveSettings } from '../../common/settings';

export class OverlayView {
  private container: HTMLElement;
  private element: HTMLDivElement | null = null;
  private settings: Settings;

  public get elementRef(): HTMLDivElement | null {
    return this.element;
  }
  private lyricsData: LyricsData | null = null;
  private activeIndex: number = -1;
  private isInstrumental: boolean = false;
  
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private elementStartX = 0;
  private elementStartY = 0;
  private hideControlsTimeout: any = null;

  private isResizing = false;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private elementStartWidth = 0;
  private elementStartHeight = 0;

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

    const overlay = document.createElement('div');
    overlay.className = 'glass-panel lyrics-overlay';
    
    // Set position and size from settings (detect PiP window context)
    const isPip = this.container.ownerDocument.defaultView !== window;
    if (isPip) {
      overlay.style.left = '0px';
      overlay.style.top = '0px';
      overlay.style.width = '100%';
      overlay.style.height = '100vh';
      overlay.style.position = 'relative';
    } else {
      const pos = this.settings.overlayPosition;
      overlay.style.left = `${pos.x}px`;
      overlay.style.top = `${pos.y}px`;
      overlay.style.width = `${pos.width}px`;
      overlay.style.height = `${pos.height}px`;
      overlay.style.position = 'absolute';
      overlay.style.resize = 'both';
      overlay.style.overflow = 'hidden';
    }
    overlay.style.opacity = String(this.settings.opacity);
    overlay.style.setProperty('--lyrics-font-size', `${this.settings.fontSize}px`);

    if (this.settings.clickThrough) {
      overlay.classList.add('overlay-click-through');
    }

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <div class="panel-title">${lyricsData ? lyricsData.title : 'No Music Playing'}</div>
      <div class="panel-controls">
        <button class="btn-icon btn-clickthrough" title="Toggle click-through mode">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12h20M12 2v20"/>
          </svg>
        </button>
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

    overlay.appendChild(header);
    overlay.appendChild(content);
    
    // Resize handle indicator (optional overlay style)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    overlay.appendChild(resizeHandle);

    this.element = overlay;
    this.container.appendChild(overlay);

    this.buildLyricsList(searchFailed);
    this.setupEvents();
    this.resetControlsTimeout();
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
          // Seek video player to line time
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

    const isPip = this.container.ownerDocument.defaultView !== window;

    // 1. Dragging handler
    const header = this.element.querySelector('.panel-header') as HTMLElement;
    if (!isPip) {
      header.addEventListener('pointerdown', this.onDragStart);
    }

    // 2. Resize dragging
    const resizeHandle = this.element.querySelector('.resize-handle') as HTMLElement;
    if (!isPip) {
      resizeHandle?.addEventListener('pointerdown', this.onResizeStart);
    }

    // 3. Click-through toggle button
    const clickthroughBtn = this.element.querySelector('.btn-clickthrough');
    clickthroughBtn?.addEventListener('click', () => {
      this.settings.clickThrough = !this.settings.clickThrough;
      if (this.settings.clickThrough) {
        this.element!.classList.add('overlay-click-through');
      } else {
        this.element!.classList.remove('overlay-click-through');
      }
      saveSettings({ clickThrough: this.settings.clickThrough });
    });

    // 4. Close button
    const closeBtn = this.element.querySelector('.btn-close');
    closeBtn?.addEventListener('click', () => {
      this.onCloseCallback();
    });

    // 4b. Fullscreen button
    const fullscreenBtn = this.element.querySelector('.btn-fullscreen');
    fullscreenBtn?.addEventListener('click', () => {
      this.onFullscreenCallback();
    });

    // 4c. PiP button
    const pipBtn = this.element.querySelector('.btn-pip');
    pipBtn?.addEventListener('click', () => {
      this.onPipCallback();
    });

    // 5. Auto hide controls on mouse inactivity (listen on both element and header for click-through support)
    const hoverElements = [this.element, header];
    hoverElements.forEach(el => {
      el.addEventListener('pointerenter', () => {
        this.showControls();
        this.resetControlsTimeout();
      });

      el.addEventListener('pointerleave', () => {
        this.hideControlsTimeout = setTimeout(() => this.hideControls(), 1500);
      });

      el.addEventListener('pointermove', () => {
        this.showControls();
        this.resetControlsTimeout();
      });
    });
  }

  private onDragStart = (e: PointerEvent) => {
    // Only drag with left click
    if (e.button !== 0) return;
    
    // Ignore drag if clicking on buttons or controls
    const target = e.target as HTMLElement;
    if (target.closest('.panel-controls') || target.closest('button')) {
      return;
    }
    
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    
    const rect = this.element!.getBoundingClientRect();
    this.elementStartX = rect.left;
    this.elementStartY = rect.top;
    
    this.element!.setPointerCapture(e.pointerId);
    this.element!.addEventListener('pointermove', this.onDragMove);
    this.element!.addEventListener('pointerup', this.onDragEnd);
    
    e.preventDefault();
  };

  private onDragMove = (e: PointerEvent) => {
    if (!this.isDragging || !this.element) return;
    
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    
    let newX = this.elementStartX + dx;
    let newY = this.elementStartY + dy;
    
    // Bound positions within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = this.element.getBoundingClientRect();
    
    newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
    newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
    
    this.element.style.left = `${newX}px`;
    this.element.style.top = `${newY}px`;
  };

  private onDragEnd = (e: PointerEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    if (this.element) {
      this.element.releasePointerCapture(e.pointerId);
      this.element.removeEventListener('pointermove', this.onDragMove);
      this.element.removeEventListener('pointerup', this.onDragEnd);
      
      // Save new coordinates
      const rect = this.element.getBoundingClientRect();
      this.settings.overlayPosition.x = Math.round(rect.left);
      this.settings.overlayPosition.y = Math.round(rect.top);
      saveSettings({ overlayPosition: this.settings.overlayPosition });
    }
  };

  private onResizeStart = (e: PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    
    this.isResizing = true;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    
    const rect = this.element!.getBoundingClientRect();
    this.elementStartWidth = rect.width;
    this.elementStartHeight = rect.height;
    
    this.element!.setPointerCapture(e.pointerId);
    this.element!.addEventListener('pointermove', this.onResizeMove);
    this.element!.addEventListener('pointerup', this.onResizeEnd);
    
    e.preventDefault();
    e.stopPropagation();
  };

  private onResizeMove = (e: PointerEvent) => {
    if (!this.isResizing || !this.element) return;
    
    const dx = e.clientX - this.resizeStartX;
    const dy = e.clientY - this.resizeStartY;
    
    const newWidth = Math.max(250, this.elementStartWidth + dx);
    const newHeight = Math.max(300, this.elementStartHeight + dy);
    
    this.element.style.width = `${newWidth}px`;
    this.element.style.height = `${newHeight}px`;
  };

  private onResizeEnd = (e: PointerEvent) => {
    if (!this.isResizing) return;
    this.isResizing = false;
    
    if (this.element) {
      this.element.releasePointerCapture(e.pointerId);
      this.element.removeEventListener('pointermove', this.onResizeMove);
      this.element.removeEventListener('pointerup', this.onResizeEnd);
      
      const rect = this.element.getBoundingClientRect();
      this.settings.overlayPosition.width = Math.round(rect.width);
      this.settings.overlayPosition.height = Math.round(rect.height);
      saveSettings({ overlayPosition: this.settings.overlayPosition });
    }
  };

  private resetControlsTimeout() {
    if (this.hideControlsTimeout) clearTimeout(this.hideControlsTimeout);
    this.hideControlsTimeout = setTimeout(() => this.hideControls(), 3000);
  }

  private hideControls() {
    if (this.element && !this.isDragging && !this.isResizing) {
      const header = this.element.querySelector('.panel-header') as HTMLElement;
      if (header) {
        header.style.opacity = '0';
        header.style.transition = 'opacity 0.5s ease';
      }
      const resizeHandle = this.element.querySelector('.resize-handle') as HTMLElement;
      if (resizeHandle) {
        resizeHandle.style.opacity = '0';
        resizeHandle.style.transition = 'opacity 0.5s ease';
        resizeHandle.style.pointerEvents = 'none';
      }
    }
  }

  private showControls() {
    if (this.element) {
      const header = this.element.querySelector('.panel-header') as HTMLElement;
      if (header) {
        header.style.opacity = '1';
        header.style.transition = 'opacity 0.2s ease';
      }
      const resizeHandle = this.element.querySelector('.resize-handle') as HTMLElement;
      if (resizeHandle) {
        resizeHandle.style.opacity = '1';
        resizeHandle.style.transition = 'opacity 0.2s ease';
        resizeHandle.style.pointerEvents = 'auto';
      }
    }
  }

  public updateSyncState(activeIndex: number, isInstrumental: boolean) {
    if (!this.element || !this.lyricsData || !this.lyricsData.synced) return;
    
    // Avoid double updates if unchanged
    if (this.activeIndex === activeIndex && this.isInstrumental === isInstrumental) return;
    
    this.activeIndex = activeIndex;
    this.isInstrumental = isInstrumental;

    const lines = this.element.querySelectorAll('.lyric-line');
    
    // Clear previous active states
    lines.forEach(line => line.classList.remove('active'));

    const content = this.element.querySelector('.lyrics-content') as HTMLDivElement;
    
    if (isInstrumental) {
      // Find or insert instrumental indicator
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
      
      // Scroll to instrumental line
      instrumentalLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Remove any temporary instrumental lines
      this.element.querySelectorAll('.lyric-line.instrumental').forEach(el => el.remove());
      
      if (activeIndex >= 0 && activeIndex < lines.length) {
        const activeLine = lines[activeIndex] as HTMLElement;
        activeLine.classList.add('active');
        
        // Smoothly center the active line in container
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  public destroy() {
    if (this.hideControlsTimeout) clearTimeout(this.hideControlsTimeout);
    if (this.element) {
      const isPip = this.container.ownerDocument.defaultView !== window;
      if (!isPip) {
        const header = this.element.querySelector('.panel-header');
        header?.removeEventListener('pointerdown', this.onDragStart);
        const resizeHandle = this.element.querySelector('.resize-handle');
        resizeHandle?.removeEventListener('pointerdown', this.onResizeStart);
      }
      this.element.remove();
      this.element = null;
    }
  }
}
