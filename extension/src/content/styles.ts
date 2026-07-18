export const stylesText = `
:host {
  --glass-bg-dark: rgba(20, 20, 20, 0.45);
  --glass-border-dark: rgba(255, 255, 255, 0.08);
  --text-active-dark: #ffffff;
  --text-inactive-dark: rgba(255, 255, 255, 0.35);
  
  --glass-bg-light: rgba(255, 255, 255, 0.45);
  --glass-border-light: rgba(0, 0, 0, 0.08);
  --text-active-light: #0d0d0d;
  --text-inactive-light: rgba(0, 0, 0, 0.35);
  
  --primary-glow: rgba(255, 255, 255, 0.15);
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  /* Current theme variables */
  --glass-bg: var(--glass-bg-dark);
  --glass-border: var(--glass-border-dark);
  --text-active: var(--text-active-dark);
  --text-inactive: var(--text-inactive-dark);
  --text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

:host([theme="light"]) {
  --glass-bg: var(--glass-bg-light);
  --glass-border: var(--glass-border-light);
  --text-active: var(--text-active-light);
  --text-inactive: var(--text-inactive-light);
  --text-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* Base elements */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background 0.3s ease, border 0.3s ease;
}

/* Header UI elements */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--glass-border);
  cursor: move;
  user-select: none;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-active);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-inactive);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-active);
}

:host([theme="light"]) .btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Lyrics Display area */
.lyrics-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 24px;
  scroll-behavior: smooth;
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
}

/* Hide scrollbar */
.lyrics-content::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.lyrics-scroller {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 100px 0; /* Creates scroll centering headroom */
  text-align: center;
}

/* Lyric Lines styling */
.lyric-line {
  font-size: var(--lyrics-font-size, 20px);
  font-weight: 600;
  color: var(--text-inactive);
  line-height: 1.45;
  transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  cursor: pointer;
  transform: scale(0.96);
  transform-origin: center;
  padding: 6px 0;
  user-select: none;
}

.lyric-line:hover {
  color: var(--text-active);
  transform: scale(0.99);
}

.lyric-line.active {
  color: var(--text-active);
  transform: scale(1.05);
  text-shadow: var(--text-shadow);
}

/* Smooth line transitions based on speed preference */
.lyric-line.smooth {
  transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}
.lyric-line.fast {
  transition: all 0.15s ease-out;
}
.lyric-line.off {
  transition: none;
}

/* Instrumental sections styling */
.lyric-line.instrumental {
  font-style: italic;
  font-weight: 400;
  opacity: 0.6;
  font-size: 0.85em;
  letter-spacing: 2px;
}

.lyric-line.unsynced {
  transform: none;
  text-align: center;
  margin-bottom: 8px;
}

/* Overlay specific */
.lyrics-overlay {
  position: absolute;
  z-index: 10000;
  min-width: 250px;
  min-height: 300px;
}

.overlay-click-through {
  pointer-events: none !important;
}

.overlay-click-through .panel-header,
.overlay-click-through .panel-controls {
  pointer-events: auto !important;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  background: transparent;
  z-index: 10001;
  transition: opacity 0.3s ease;
}

/* Sidebar specific */
.lyrics-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 9999;
  height: 100vh;
  border-radius: 0;
  border-top: none;
  border-bottom: none;
}

.lyrics-sidebar.right {
  right: 0;
  border-right: none;
}

.lyrics-sidebar.left {
  left: 0;
  border-left: none;
}

/* Fullscreen Immersive Mode */
.lyrics-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100000;
  background: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* Animated Blurred Canvas Backdrop */
.fullscreen-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.fullscreen-bg-blur {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  object-fit: cover;
  filter: blur(90px) saturate(160%) brightness(0.65);
  transform: scale(1.1);
  transition: opacity 1.5s ease-in-out;
  opacity: 0;
}

.fullscreen-bg-blur.active {
  opacity: 1;
}

/* Gradient overlay to darken fullscreen */
.fullscreen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  background: radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%);
}

/* Fullscreen content wrapper */
.fullscreen-content {
  position: relative;
  z-index: 3;
  width: 90%;
  max-width: 900px;
  height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fullscreen-content .lyrics-content {
  mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
}

.fullscreen-content .lyrics-scroller {
  padding: 250px 0;
}

.fullscreen-content .lyric-line {
  font-size: var(--lyrics-font-size, 38px);
  padding: 16px 0;
  text-align: center;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fullscreen-content .lyric-line.active {
  color: #fff;
  transform: scale(1.06);
  text-shadow: 0 4px 20px rgba(255,255,255,0.25);
}

.fullscreen-content .lyric-line:not(.active) {
  opacity: 0.3;
}

/* Track Metadata Display in Fullscreen */
.fullscreen-header {
  position: absolute;
  top: 40px;
  left: 5%;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 20px;
  animation: fadeIn 1s ease;
}

.fullscreen-art {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  object-fit: cover;
}

.fullscreen-track-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fullscreen-title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.fullscreen-artist {
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  font-weight: 500;
}

.fullscreen-close {
  position: absolute;
  top: 40px;
  right: 5%;
  z-index: 4;
  background: rgba(255,255,255,0.1);
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.fullscreen-close:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
}

/* Loading & Empty states */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: 15px;
  color: var(--text-active);
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--text-inactive);
  border-top-color: var(--text-active);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.state-message {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-inactive);
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
