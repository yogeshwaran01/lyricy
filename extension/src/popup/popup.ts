import { getSettings, saveSettings } from '../common/settings';
import { TrackMetadata, PlaybackState, ProviderType, BaseLyrics } from '../common/types';

let currentTrack: TrackMetadata | null = null;
let currentSettings: any = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  currentSettings = await getSettings();
  
  // Initialize controls
  setupUI();
  
  // Get active track metadata from background
  chrome.runtime.sendMessage({ action: 'get-active-track' }, (response) => {
    if (response) {
      if (response.metadata) {
        updateTrackCard(response.metadata);
      }
      if (response.state) {
        updatePlaybackState(response.state);
      }
    }
  });

  // Query YTM tab to force-refresh metadata in case it's stale
  forceRefreshYTMData();
});

// Setup event listeners
function setupUI() {
  // 1. Toggle extension visibility
  const toggleActive = document.getElementById('toggle-active') as HTMLInputElement;
  chrome.storage.local.get('extension_active', (res) => {
    toggleActive.checked = res.extension_active !== false; // default true
  });

  toggleActive.addEventListener('change', async () => {
    const active = toggleActive.checked;
    await chrome.storage.local.set({ extension_active: active });
    sendTabMessage({ action: 'toggle-overlay' });
  });

  // 2. Display mode buttons
  const modeButtons = document.querySelectorAll('.mode-btn');

  modeButtons.forEach(btn => {
    const mode = btn.getAttribute('data-mode');
    if (mode === currentSettings.mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', async () => {
      const isCurrentlyActive = btn.classList.contains('active');
      
      if (isCurrentlyActive) {
        if (mode === 'fullscreen') {
          sendTabMessage({ action: 'toggle-fullscreen' });
        } else {
          // Toggle the active state of the extension (show/hide)
          const toggleActive = document.getElementById('toggle-active') as HTMLInputElement;
          toggleActive.checked = !toggleActive.checked;
          const active = toggleActive.checked;
          await chrome.storage.local.set({ extension_active: active });
          sendTabMessage({ action: 'toggle-overlay' });
        }
        return;
      }

      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Ensure extension is active when switching modes
      const toggleActive = document.getElementById('toggle-active') as HTMLInputElement;
      if (!toggleActive.checked) {
        toggleActive.checked = true;
        await chrome.storage.local.set({ extension_active: true });
        sendTabMessage({ action: 'toggle-overlay' });
      }

      const newMode = mode as any;
      currentSettings.mode = newMode;
      await saveSettings({ mode: newMode });

      if (newMode === 'fullscreen') {
        // Trigger fullscreen directly
        sendTabMessage({ action: 'toggle-fullscreen' });
      } else {
        // If switching between overlay/sidebar, disable fullscreen if active
        chrome.storage.local.set({ fullscreen_active: false });
        sendTabMessage({ action: 'settings-updated' });
      }
    });
  });

  // 3. Settings gear button
  document.getElementById('btn-options')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 4. Manual search
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchSubmit = document.getElementById('search-submit');
  const searchResults = document.getElementById('search-results');

  const executeSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    searchSubmit!.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div>';
    
    chrome.runtime.sendMessage({ action: 'search-lyrics-manual', query }, (response) => {
      searchSubmit!.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      `;

      if (response && response.success && response.results) {
        renderSearchResults(response.results);
      }
    });
  };

  searchSubmit?.addEventListener('click', executeSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSearch();
  });
}

// Render manual search results in popup
function renderSearchResults(providersResults: { provider: ProviderType; results: BaseLyrics[] }[]) {
  const container = document.getElementById('search-results') as HTMLDivElement;
  container.innerHTML = '';
  container.classList.remove('hidden');

  let totalItems = 0;

  providersResults.forEach(item => {
    item.results.forEach(result => {
      totalItems++;
      const itemEl = document.createElement('div');
      itemEl.className = 'search-result-item';
      itemEl.innerHTML = `
        <div class="result-title">${result.title}</div>
        <div class="result-sample">${result.sample_lyrics || 'Click to select this lyrics'}</div>
      `;

      itemEl.addEventListener('click', () => {
        // Fetch full lyrics and send back to YTM Content Script
        itemEl.style.opacity = '0.5';
        
        chrome.runtime.sendMessage({
          action: 'fetch-lyrics-by-link',
          link: result.link,
          provider: item.provider,
          artist: currentTrack ? currentTrack.artist : '',
          title: currentTrack ? currentTrack.title : ''
        }, (res) => {
          if (res && res.success && res.lyrics) {
            // Relayer to YTM content script
            sendTabMessage({
              action: 'manual-lyrics-selected',
              lyrics: res.lyrics
            });
            
            // Close search list
            container.classList.add('hidden');
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            searchInput.value = '';
          } else {
            alert('Failed to load selected lyrics.');
            itemEl.style.opacity = '1';
          }
        });
      });

      container.appendChild(itemEl);
    });
  });

  if (totalItems === 0) {
    container.innerHTML = '<div style="padding:10px;text-align:center;font-size:11px;color:var(--text-muted);">No lyrics matches found.</div>';
  }
}

// Background updates listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'track-updated') {
    updateTrackCard(message.metadata);
  } else if (message.action === 'playback-updated') {
    updatePlaybackState(message.state);
  }
});

function updateTrackCard(metadata: TrackMetadata) {
  currentTrack = metadata;

  const titleEl = document.getElementById('track-title');
  const artistEl = document.getElementById('track-artist');
  const artEl = document.getElementById('track-art') as HTMLImageElement;
  const providerEl = document.getElementById('track-provider');

  if (titleEl) titleEl.textContent = metadata.title;
  if (artistEl) artistEl.textContent = metadata.artist;
  if (artEl) {
    artEl.src = metadata.coverUrl || 'https://music.youtube.com/img/on_platform_logo_dark.svg';
  }

  // Get provider info if cached
  if (providerEl) {
    providerEl.textContent = 'Active';
    // Look up cache status or check if we loaded lyrics
    const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `lyrics_cache_${clean(metadata.artist)}_${clean(metadata.title)}`;
    chrome.storage.local.get(key, (res) => {
      if (res && res[key]) {
        providerEl.textContent = `Provider: ${res[key].provider.toUpperCase()} (${res[key].synced ? 'Synced' : 'Plain'})`;
      } else {
        providerEl.textContent = 'Searching...';
      }
    });
  }
}

function updatePlaybackState(state: PlaybackState) {
  // If paused, we can reflect it on YTM lyrics logo animation, etc.
}

async function forceRefreshYTMData() {
  sendTabMessage({ action: 'request-current-track-force' });
}

// Send runtime message to the active YouTube Music tab
async function sendTabMessage(msg: any) {
  const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
    }
  }
}
