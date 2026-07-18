import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../common/settings';
import { Settings, ProviderType } from '../common/types';

let currentSettings: Settings;

document.addEventListener('DOMContentLoaded', async () => {
  currentSettings = await getSettings();
  
  populateUI();
  setupEventListeners();
  setupDragAndDrop();
});

// Fill UI controls with stored settings values
function populateUI() {
  // Theme
  const themeInput = document.getElementById('setting-theme') as HTMLSelectElement;
  themeInput.value = currentSettings.theme;

  // Font Size
  const fontSizeInput = document.getElementById('setting-fontSize') as HTMLInputElement;
  fontSizeInput.value = String(currentSettings.fontSize);
  updateLabel('fontSize-value', `${currentSettings.fontSize}px`);

  // Opacity
  const opacityInput = document.getElementById('setting-opacity') as HTMLInputElement;
  opacityInput.value = String(currentSettings.opacity);
  updateLabel('opacity-value', `${Math.round(currentSettings.opacity * 100)}%`);

  // Sidebar Position
  const sidebarPosInput = document.getElementById('setting-sidebarPos') as HTMLSelectElement;
  sidebarPosInput.value = currentSettings.sidebarPosition;

  // Animation Speed
  const animSpeedInput = document.getElementById('setting-animSpeed') as HTMLSelectElement;
  animSpeedInput.value = currentSettings.animationSpeed;

  // Fullscreen breathing art checkbox
  const fullscreenArtInput = document.getElementById('setting-fullscreenArt') as HTMLInputElement;
  fullscreenArtInput.checked = currentSettings.fullscreenArtAnimation;

  // Click-through checkbox
  const clickthroughInput = document.getElementById('setting-clickthrough') as HTMLInputElement;
  clickthroughInput.checked = currentSettings.clickThrough;

  // Populate provider priority list order
  arrangeProvidersList(currentSettings.providerPriority);
}

// Order provider DOM nodes according to saved priorities
function arrangeProvidersList(priority: ProviderType[]) {
  const container = document.getElementById('providers-list');
  if (!container) return;

  const items = Array.from(container.children) as HTMLDivElement[];
  
  // Clear container
  container.innerHTML = '';
  
  // Re-append items in saved order
  priority.forEach(provName => {
    const matched = items.find(item => item.getAttribute('data-provider') === provName);
    if (matched) {
      container.appendChild(matched);
    }
  });
  
  // Append any missing items just in case
  items.forEach(item => {
    if (!container.contains(item)) {
      container.appendChild(item);
    }
  });
}

function updateLabel(id: string, text: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setupEventListeners() {
  const saveAndNotify = async (changedSettings: Partial<Settings>) => {
    await saveSettings(changedSettings);
    showSavedNotification();
    
    // Notify all active YTM tabs
    const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'settings-updated' }).catch(() => {});
      }
    }
  };

  // Theme change
  document.getElementById('setting-theme')?.addEventListener('change', (e) => {
    saveAndNotify({ theme: (e.target as HTMLSelectElement).value as any });
  });

  // Font size slider
  const fontSizeInput = document.getElementById('setting-fontSize') as HTMLInputElement;
  fontSizeInput.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    updateLabel('fontSize-value', `${val}px`);
  });
  fontSizeInput.addEventListener('change', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    saveAndNotify({ fontSize: val });
  });

  // Opacity slider
  const opacityInput = document.getElementById('setting-opacity') as HTMLInputElement;
  opacityInput.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    updateLabel('opacity-value', `${Math.round(val * 100)}%`);
  });
  opacityInput.addEventListener('change', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    saveAndNotify({ opacity: val });
  });

  // Sidebar Position change
  document.getElementById('setting-sidebarPos')?.addEventListener('change', (e) => {
    saveAndNotify({ sidebarPosition: (e.target as HTMLSelectElement).value as any });
  });

  // Animation Speed change
  document.getElementById('setting-animSpeed')?.addEventListener('change', (e) => {
    saveAndNotify({ animationSpeed: (e.target as HTMLSelectElement).value as any });
  });

  // Checkbox full screen backdrop animation
  document.getElementById('setting-fullscreenArt')?.addEventListener('change', (e) => {
    saveAndNotify({ fullscreenArtAnimation: (e.target as HTMLInputElement).checked });
  });

  // Checkbox overlay click-through
  document.getElementById('setting-clickthrough')?.addEventListener('change', (e) => {
    saveAndNotify({ clickThrough: (e.target as HTMLInputElement).checked });
  });

  // Reset positions button
  document.getElementById('btn-reset-layout')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset panel locations and sizes back to default?')) {
      const resetCoords = {
        overlayPosition: DEFAULT_SETTINGS.overlayPosition,
        sidebarWidth: DEFAULT_SETTINGS.sidebarWidth
      };
      
      // Update local storage
      await saveSettings(resetCoords);
      
      // Reflect in UI
      currentSettings.overlayPosition = DEFAULT_SETTINGS.overlayPosition;
      currentSettings.sidebarWidth = DEFAULT_SETTINGS.sidebarWidth;
      
      showSavedNotification();
      
      // Notify active tab
      const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' });
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'settings-updated' }).catch(() => {});
        }
      }
    }
  });
}

// Drag and drop sorting mechanics
function setupDragAndDrop() {
  const container = document.getElementById('providers-list');
  if (!container) return;

  let dragSourceEl: HTMLElement | null = null;

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    const item = target.closest('.provider-item') as HTMLElement;
    if (!item) return;

    dragSourceEl = item;
    item.classList.add('dragging');
    e.dataTransfer!.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!dragSourceEl) return;

    const target = e.target as HTMLElement;
    const item = target.closest('.provider-item') as HTMLElement;
    if (!item || item === dragSourceEl) return;

    // Determine position of mouse relative to target element
    const rect = item.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    
    if (e.clientY < midPoint) {
      container.insertBefore(dragSourceEl, item);
    } else {
      container.insertBefore(dragSourceEl, item.nextSibling);
    }
  };

  const handleDragEnd = async () => {
    if (dragSourceEl) {
      dragSourceEl.classList.remove('dragging');
      dragSourceEl = null;

      // Extract new order list
      const items = Array.from(container.children) as HTMLElement[];
      const newOrder = items.map(item => item.getAttribute('data-provider') as ProviderType);
      
      // Save priorities
      await saveSettings({ providerPriority: newOrder });
      showSavedNotification();
      
      // Notify tab
      const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' });
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'settings-updated' }).catch(() => {});
        }
      }
    }
  };

  // Add listeners
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragend', handleDragEnd);
}

// Save visual popover indicator
let statusTimeout: any = null;
function showSavedNotification() {
  const statusEl = document.getElementById('status-message');
  if (!statusEl) return;

  statusEl.classList.add('show');
  
  if (statusTimeout) clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    statusEl.classList.remove('show');
  }, 1500);
}
