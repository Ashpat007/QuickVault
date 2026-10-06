// QuickVault Content Script - Direct Storage, Message Bridge & Smart Form Autofill

// Strict list of trusted QuickVault application origins.
// NEVER include window.location.origin here, as content scripts execute on arbitrary 3rd party web pages!
const TRUSTED_ORIGINS = [
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

/**
 * Smart DOM Form Scanner & Autofiller
 * Matches webpage form fields against QuickVault entries and populates values.
 */
function scanAndAutofillActiveForm(entries = []) {
  if (!entries || entries.length === 0) return 0;

  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  let filledCount = 0;

  inputs.forEach((input) => {
    // 1. Gather all descriptive labels for this element
    const fieldText = [
      input.getAttribute('name') || '',
      input.getAttribute('id') || '',
      input.getAttribute('placeholder') || '',
      input.getAttribute('aria-label') || '',
      input.getAttribute('autocomplete') || ''
    ].join(' ').toLowerCase();

    let associatedLabelText = '';
    if (input.id) {
      const labelEl = document.querySelector(`label[for="${input.id}"]`);
      if (labelEl) associatedLabelText = labelEl.textContent.toLowerCase();
    }
    if (!associatedLabelText && input.closest('label')) {
      associatedLabelText = input.closest('label').textContent.toLowerCase();
    }

    const combinedMeta = `${fieldText} ${associatedLabelText}`.trim();
    if (!combinedMeta) return;

    // 2. Find best matching vault entry
    let matchedEntry = null;

    if (combinedMeta.includes('github') || combinedMeta.includes('repo')) {
      matchedEntry = entries.find(e => e.entry_type === 'github');
    } else if (combinedMeta.includes('linkedin')) {
      matchedEntry = entries.find(e => e.entry_type === 'linkedin');
    } else if (combinedMeta.includes('email') || combinedMeta.includes('e-mail')) {
      matchedEntry = entries.find(e => e.entry_type === 'email');
    } else if (combinedMeta.includes('phone') || combinedMeta.includes('mobile') || combinedMeta.includes('tel')) {
      matchedEntry = entries.find(e => e.entry_type === 'phone');
    } else if (combinedMeta.includes('portfolio') || combinedMeta.includes('website') || combinedMeta.includes('url')) {
      matchedEntry = entries.find(e => e.entry_type === 'link');
    } else if (combinedMeta.includes('name') || combinedMeta.includes('applicant')) {
      matchedEntry = entries.find(e => e.entry_type === 'text' && (e.label.toLowerCase().includes('name') || e.label.toLowerCase().includes('user')));
    }

    // Generic fallback match by label / title
    if (!matchedEntry) {
      matchedEntry = entries.find(e => {
        const lbl = (e.label || '').toLowerCase();
        return lbl && combinedMeta.includes(lbl);
      });
    }

    // 3. Fill value and dispatch synthetic events
    if (matchedEntry && matchedEntry.value) {
      input.value = matchedEntry.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      filledCount++;
    }
  });

  return filledCount;
}

// 1. Reactive PostMessage Listener with Strict Origin Validation
window.addEventListener('message', (event) => {
  // Reject arbitrary website origins. Only accept trusted QuickVault app origins or chrome-extension scheme.
  if (!TRUSTED_ORIGINS.includes(event.origin) && !event.origin.startsWith('chrome-extension://')) {
    return;
  }

  if (event.data && event.data.type === 'QUICKVAULT_EXTENSION_SYNC') {
    handleVaultSync(event.data.sets, event.data.entries);
  }
});

// 2. Initial Bridge Read on Tab Load (Only executes on trusted QuickVault app origin tabs)
if (TRUSTED_ORIGINS.includes(window.location.origin)) {
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
}

// 3. Message Listener for Extension Popup Actions
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
    } else if (request.action === 'AUTOFILL_PAGE_FORM') {
      const filled = scanAndAutofillActiveForm(request.entries || []);
      sendResponse({ success: true, count: filled });
    }
    return true;
  });
}
