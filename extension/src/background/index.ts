import { LyricsProviderManager } from '../common/providers';
import { getSettings } from '../common/settings';
import { TrackMetadata, PlaybackState, LyricsData, ProviderType } from '../common/types';

// Helper for session storage access with local fallback
async function getSessionData(key: string): Promise<any> {
  return new Promise((resolve) => {
    const storage = chrome.storage.session || chrome.storage.local;
    storage.get(key, (res) => {
      resolve(res ? res[key] : null);
    });
  });
}

async function setSessionData(key: string, value: any): Promise<void> {
  return new Promise((resolve) => {
    const storage = chrome.storage.session || chrome.storage.local;
    storage.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// Helper to normalize cache key
function getCacheKey(artist: string, title: string): string {
  const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `lyrics_cache_${clean(artist)}_${clean(title)}`;
}

// Background script message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'track-changed') {
        const metadata = message.metadata as TrackMetadata;
        await setSessionData('currentTrack', metadata);
        
        // Clear old playback state
        await setSessionData('playbackState', null);
        
        // Broadcast track change to all extension pages (like popup)
        chrome.runtime.sendMessage({ action: 'track-updated', metadata }).catch(() => {});
        
        // Auto-fetch lyrics in background to cache them
        const cacheKey = getCacheKey(metadata.artist, metadata.title);
        const cached = await chrome.storage.local.get(cacheKey);
        if (!cached[cacheKey]) {
          console.log('Pre-fetching lyrics for:', metadata.title);
          const settings = await getSettings();
          const providersResults = await LyricsProviderManager.searchLyrics(
            metadata.title,
            metadata.artist,
            metadata.duration,
            metadata.album,
            settings.providerPriority
          );
          
          if (providersResults.length > 0) {
            // Take the first result from the highest priority provider
            const bestProvider = providersResults[0].provider;
            const bestResult = providersResults[0].results[0];
            const lyricsText = await LyricsProviderManager.getLyrics(bestResult.link, bestProvider);
            
            if (lyricsText) {
              const lyricsData: LyricsData = {
                lines: parseLrc(lyricsText),
                synced: isSyncedLrc(lyricsText),
                title: bestResult.title,
                artist: metadata.artist,
                provider: bestProvider,
                rawLrc: lyricsText
              };
              await chrome.storage.local.set({ [cacheKey]: lyricsData });
              console.log('Lyrics cached successfully for:', metadata.title);
            }
          }
        }
        
        sendResponse({ success: true });
      }
      
      else if (message.action === 'playback-state-changed') {
        const state = message.state as PlaybackState;
        await setSessionData('playbackState', state);
        
        // Broadcast playback update to popup
        chrome.runtime.sendMessage({ action: 'playback-updated', state }).catch(() => {});
        sendResponse({ success: true });
      }
      
      else if (message.action === 'get-active-track') {
        const metadata = await getSessionData('currentTrack');
        const state = await getSessionData('playbackState');
        sendResponse({ metadata, state });
      }
      
      else if (message.action === 'fetch-lyrics') {
        const { artist, title, duration, album } = message;
        const cacheKey = getCacheKey(artist, title);
        
        // Check cache first
        const cached = await chrome.storage.local.get(cacheKey);
        if (cached[cacheKey]) {
          sendResponse({ success: true, lyrics: cached[cacheKey] });
          return;
        }

        const settings = await getSettings();
        const providersResults = await LyricsProviderManager.searchLyrics(
          title,
          artist,
          duration,
          album,
          settings.providerPriority
        );

        if (providersResults.length > 0) {
          const bestProvider = providersResults[0].provider;
          const bestResult = providersResults[0].results[0];
          const lyricsText = await LyricsProviderManager.getLyrics(bestResult.link, bestProvider);
          
          if (lyricsText) {
            const lyricsData: LyricsData = {
              lines: parseLrc(lyricsText),
              synced: isSyncedLrc(lyricsText),
              title: bestResult.title,
              artist,
              provider: bestProvider,
              rawLrc: lyricsText
            };
            
            // Cache it
            await chrome.storage.local.set({ [cacheKey]: lyricsData });
            sendResponse({ success: true, lyrics: lyricsData });
            return;
          }
        }
        
        sendResponse({ success: false, error: 'Lyrics not found' });
      }

      else if (message.action === 'search-lyrics-manual') {
        const { query } = message;
        const settings = await getSettings();
        const results = await LyricsProviderManager.searchLyrics(
          query,
          '',
          -1,
          '',
          settings.providerPriority
        );
        sendResponse({ success: true, results });
      }

      else if (message.action === 'fetch-lyrics-by-link') {
        const { link, provider, artist, title } = message;
        const lyricsText = await LyricsProviderManager.getLyrics(link, provider);
        
        if (lyricsText) {
          const lyricsData: LyricsData = {
            lines: parseLrc(lyricsText),
            synced: isSyncedLrc(lyricsText),
            title: title || 'Selected Lyrics',
            artist: artist || '',
            provider,
            rawLrc: lyricsText
          };

          // Cache it if we have artist & title
          if (artist && title) {
            const cacheKey = getCacheKey(artist, title);
            await chrome.storage.local.set({ [cacheKey]: lyricsData });
          }

          sendResponse({ success: true, lyrics: lyricsData });
        } else {
          sendResponse({ success: false, error: 'Could not fetch lyrics' });
        }
      }
    } catch (e: any) {
      console.error('Background worker handler error:', e);
      sendResponse({ success: false, error: e.message || 'Unknown error' });
    }
  })();
  return true; // Keep message channel open for async responses
});

// Watch keyboard command shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Keyboard shortcut command received:', command);
  
  // Find active YouTube Music tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const ytmTab = tabs.find(t => t.url && t.url.includes('music.youtube.com'));
  
  if (ytmTab && ytmTab.id) {
    if (command === 'toggle-fullscreen') {
      chrome.tabs.sendMessage(ytmTab.id, { action: 'toggle-fullscreen' }).catch(() => {});
    } else if (command === 'toggle-overlay') {
      chrome.tabs.sendMessage(ytmTab.id, { action: 'toggle-overlay' }).catch(() => {});
    }
  } else {
    // If not in current window, search all windows
    const allTabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' });
    if (allTabs.length > 0 && allTabs[0].id) {
      if (command === 'toggle-fullscreen') {
        chrome.tabs.sendMessage(allTabs[0].id, { action: 'toggle-fullscreen' }).catch(() => {});
      } else if (command === 'toggle-overlay') {
        chrome.tabs.sendMessage(allTabs[0].id, { action: 'toggle-overlay' }).catch(() => {});
      }
    }
  }
});

// Helper functions for LRC parsing in background script (used for caching)
function isSyncedLrc(text: string): boolean {
  return /\[\d+:\d+[\.:]\d+\]/.test(text);
}

function parseLrc(text: string): { time: number; text: string }[] {
  if (!text) return [];
  const lines = text.split('\n');
  const result: { time: number; text: string }[] = [];
  
  // Matches [mm:ss.xx] or [mm:ss:xx] or [mm:ss]
  const timeRegex = /\[(\d+):(\d+)(?:[\.:](\d+))?\]/g;
  
  for (const line of lines) {
    timeRegex.lastIndex = 0;
    const match = timeRegex.exec(line);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const msStr = match[3] || '0';
      // Pad ms string to make it consistent (e.g. .3 -> 300ms, .03 -> 30ms)
      const ms = parseInt((msStr + '00').slice(0, 3), 10);
      
      const time = min * 60 + sec + ms / 1000;
      const lyricText = line.replace(/\[\d+:\d+(?:[\.:]\d+)?\]/g, '').trim();
      
      result.push({ time, text: lyricText });
    } else if (line.trim() && !line.startsWith('[')) {
      // If it's a line without time but it's not metadata, keep it with time 0 (unsynced)
      result.push({ time: -1, text: line.trim() });
    }
  }
  
  // Sort lines by time
  return result.sort((a, b) => a.time - b.time);
}
