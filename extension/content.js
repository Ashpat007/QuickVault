// QuickVault Content Script - Streamlined Direct Storage & Message Bridge

const TRUSTED_ORIGINS = [
  window.location.origin,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

/**
 * Validates origin and safely stores vault sync payloads
 */
function handleVaultSync(sets, entries) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({
      quickvault_sets: sets || [],
      quickvault_entries: entries || [],
      quickvault_last_sync: Date.now()
    });
  }
}

// 1. Reactive PostMessage Listener with Strict Origin Validation
window.addEventListener('message', (event) => {
  // Reject untrusted origins
  if (!TRUSTED_ORIGINS.includes(event.origin) && !event.origin.startsWith('chrome-extension://')) {
    return;
  }

  if (event.data && event.data.type === 'QUICKVAULT_EXTENSION_SYNC') {
    handleVaultSync(event.data.sets, event.data.entries);
  }
});

// 2. Initial Bridge Read on Tab Load
try {
  const bridge = document.getElementById('__quickvault_bridge');
  if (bridge) {
    const rawSets = bridge.getAttribute('data-sets');
    const rawEntries = bridge.getAttribute('data-entries');
    if (rawSets || rawEntries) {
      handleVaultSync(
        rawSets ? JSON.parse(rawSets) : [],
        rawEntries ? JSON.parse(rawEntries) : []
      );
    }
  }
} catch {
  // safe fallback
}

// 3. Direct Message Responder for Extension Popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_LIVE_VAULT') {
      try {
        const bridge = document.getElementById('__quickvault_bridge');
        if (bridge) {
          const rawSets = bridge.getAttribute('data-sets');
          const rawEntries = bridge.getAttribute('data-entries');
          sendResponse({
            sets: rawSets ? JSON.parse(rawSets) : [],
            entries: rawEntries ? JSON.parse(rawEntries) : []
          });
          return true;
        }
      } catch {
        // fallback
      }
      sendResponse({ sets: [], entries: [] });
    }
    return true;
  });
}
