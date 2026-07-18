import { UIManager } from './ui-manager';
import { YTMusicObserver } from './ytmusic';
import { getSettings } from '../common/settings';
import { stylesText } from './styles';

let uiManager: UIManager | null = null;
let observer: YTMusicObserver | null = null;

async function bootstrap() {
  console.log('YouTube Music Synchronized Lyrics extension bootstrapping...');

  // 1. Create Shadow DOM Host
  const host = document.createElement('ytm-lyrics-overlay-host');
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // 2. Inject CSS styles
  const styleEl = document.createElement('style');
  styleEl.textContent = stylesText;
  shadow.appendChild(styleEl);

  // 3. Create main container element inside shadow root
  const container = document.createElement('div');
  container.id = 'lyrics-extension-container';
  shadow.appendChild(container);

  // 4. Load initial settings
  const settings = await getSettings();

  // 5. Initialize UI Manager
  uiManager = new UIManager(host, container, settings);

  // 6. Initialize YouTube Music Player Observer
  observer = new YTMusicObserver(
    // onTrackChanged callback
    async (metadata) => {
      // 1. Relayout the UI
      uiManager?.setTrack(metadata);

      // 2. Inform background service worker (for pre-fetching and caching)
      chrome.runtime.sendMessage({
        action: 'track-changed',
        metadata
      }).catch(() => {});
    },
    // onPlaybackStateChanged callback
    (state) => {
      // 1. Sync scrolling / active line highlighting
      uiManager?.updatePlaybackState(state);

      // 2. Inform background service worker (keeps popup in sync)
      chrome.runtime.sendMessage({
        action: 'playback-state-changed',
        state
      }).catch(() => {});
    }
  );

  // 7. Watch for incoming messages from Popup, Options, or Keyboard shortcuts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggle-overlay') {
      uiManager?.toggleActive();
      sendResponse({ success: true });
    }
    
    else if (message.action === 'toggle-fullscreen') {
      uiManager?.toggleFullscreen();
      sendResponse({ success: true });
    }
    
    else if (message.action === 'settings-updated') {
      getSettings().then((newSettings) => {
        uiManager?.updateSettings(newSettings);
      });
      sendResponse({ success: true });
    }

    else if (message.action === 'manual-lyrics-selected') {
      if (message.lyrics) {
        uiManager?.handleManualSearchResult(message.lyrics);
      }
      sendResponse({ success: true });
    }

    else if (message.action === 'request-current-track-force') {
      observer?.forceTriggerUpdate();
      sendResponse({ success: true });
    }
  });

  console.log('YouTube Music Synchronized Lyrics extension bootstrapped.');
}

// Start bootstrap when document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
