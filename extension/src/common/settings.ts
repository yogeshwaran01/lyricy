import { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  mode: 'overlay',
  theme: 'adaptive',
  fontSize: 20,
  opacity: 0.85,
  providerPriority: ['lrclib', 'betterlyrics'],
  animationSpeed: 'smooth',
  clickThrough: false,
  sidebarPosition: 'right',
  sidebarWidth: 360,
  fullscreenArtAnimation: true,
  overlayPosition: {
    x: 30,
    y: 80,
    width: 380,
    height: 500
  }
};

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_SETTINGS);
      return;
    }

    chrome.storage.sync.get('settings', (result) => {
      if (result && result.settings) {
        resolve({ ...DEFAULT_SETTINGS, ...result.settings });
      } else {
        // Try local storage fallback
        chrome.storage.local.get('settings', (localResult) => {
          if (localResult && localResult.settings) {
            resolve({ ...DEFAULT_SETTINGS, ...localResult.settings });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        });
      }
    });
  });
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...settings };

  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }

    chrome.storage.sync.set({ settings: updatedSettings }, () => {
      // Keep local in sync
      chrome.storage.local.set({ settings: updatedSettings }, () => {
        resolve();
      });
    });
  });
}
