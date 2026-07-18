# 🎼 YouTube Music Synchronized Lyrics Browser Extension

A modern, high-performance browser extension for Google Chrome and Brave that overlays **synchronized, time-synced lyrics** directly on the active **YouTube Music** tab. 

Designed with a premium macOS-inspired **Liquid Glass (glassmorphic)** aesthetic, it blends seamlessly with YouTube Music's interface while providing rich features like floating Picture-in-Picture overlays and immersive fullscreen visualization.

---

## ✨ Key Features

* 🪟 **Liquid Glass Layouts**:
  * **Floating Overlay**: A translucent glassmorphic panel that you can drag, resize, and position anywhere on the screen.
  * **Docked Sidebar**: Slides out on the left or right, shifting the main player canvas slightly so no controls are obscured.
* 📺 **Picture-in-Picture (PiP) Window**:
  * Spawns a native, floating, always-on-top lyrics window (using the modern **Document Picture-in-Picture API**).
  * Hovering/focusing stays active and synced even when you minimize Chrome or work in other desktop applications.
* 🌌 **Immersive Fullscreen View**:
  * Crossfades blurred album cover art in the background.
  * Displays large, centered typography with glowing active lyrics.
* 🖱️ **Click-Through Mode**:
  * Fades the panel header controls out and passes all mouse click interactions directly to the video player behind the lyrics.
  * Hovering near the top fades the controls back in so you can adjust them.
* ⚡ **High Performance & Low Latency**:
  * Queries multiple lyric sources (LrcLib, BetterLyrics API) concurrently.
* 🔍 **Manual Search Panel**:
  * Easily search for lyrics manually inside the extension popup if the auto-detection needs correction.

---

## 🛠️ Technology Stack

* **Core Language**: TypeScript / ESNext
* **Bundler & Compiler**: Vite, esbuild (modules target: `browser`)
* **Styling**: Isolated Shadow DOM CSS with CSS Variables for theme responsiveness (Dark, Light, Adaptive matching YT Music)
* **API Targets**: Manifest V3, Chrome Extensions API, Chrome Storage Sync, HTML5 Video Elements, Document Picture-in-Picture API

---

## 🚀 Installation (Developer Load Mode)

To run the extension locally in developer mode:

### 1. Build the Extension
1. Open your terminal and navigate to the `extension/` folder:
   ```bash
   cd extension
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Compile the typescript code and bundle the extension assets:
   ```bash
   npm run build
   ```
   This will output a clean compiled folder inside `extension/dist/`.

### 2. Load into Chrome or Brave
1. Launch Chrome/Brave and navigate to `chrome://extensions/`.
2. Toggle the **Developer mode** switch in the top-right corner to **ON**.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the **`extension/dist`** folder.

---

## ⌨️ Development Script Commands

Run these npm scripts inside the `extension/` folder:

* **`npm install`** - Install node package dependencies.
* **`npm run dev`** - Run development mode (watches and rebuilds popup and options pages).
* **`npm run build`** - Clean the build folder and bundle all extension files (`background.js`, `content.js`, `popup/`, `options/`) into the `dist/` directory.
* **`npm run clean`** - Clean up the `dist/` build directory.
