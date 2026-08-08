// QuickVault Content Script - Live DOM & Storage Sync Bridge with P0 Origin Validation

function extractAndSyncVault() {
  try {
    const bridge = document.getElementById('__quickvault_bridge');
    if (bridge) {
      const rawSets = bridge.getAttribute('data-sets');
      const rawEntries = bridge.getAttribute('data-entries');

      if (rawSets || rawEntries) {
        const sets = rawSets ? JSON.parse(rawSets) : [];
        const entries = rawEntries ? JSON.parse(rawEntries) : [];

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            quickvault_sets: sets,
            quickvault_entries: entries
          });
        }
      }
    }
  } catch (err) {
    // safe fallback
  }
}

// P0 Security Fix: Origin Validation on Window PostMessage
window.addEventListener('message', (event) => {
  // Discard any message from untrusted origins
  const trustedOrigins = [
    window.location.origin,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  if (!trustedOrigins.includes(event.origin) && !event.origin.startsWith('chrome-extension://')) {
    return;
  }

  if (event.data && event.data.type === 'QUICKVAULT_EXTENSION_SYNC') {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        quickvault_sets: event.data.sets || [],
        quickvault_entries: event.data.entries || []
      });
    }
  }
});

// Initial sync & periodic check
extractAndSyncVault();
setInterval(extractAndSyncVault, 1200);

// Message responder to popup
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
      } catch (e) {
        // fallback
      }
      sendResponse({ sets: [], entries: [] });
    }
    return true;
  });
}
