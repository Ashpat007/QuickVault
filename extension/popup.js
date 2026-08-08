// QuickVault Chrome Extension - Instant Popup Sync Controller

let currentSets = [{ id: 'set-personal', name: 'Personal' }];
let currentActiveSetId = 'set-personal';
let allEntries = [];

const profileTabsContainer = document.getElementById('profileTabsContainer');
const searchInput = document.getElementById('searchInput');
const entriesList = document.getElementById('entriesList');
const toastBox = document.getElementById('toastBox');
const toastText = document.getElementById('toastText');

// Icon SVG helper
function getIconSVG(type) {
  switch (type) {
    case 'github':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;
    case 'linkedin':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`;
    case 'email':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    case 'phone':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    default:
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  }
}

// Show Toast
function showToast(msg) {
  toastText.textContent = msg;
  toastBox.classList.add('show');
  setTimeout(() => toastBox.classList.remove('show'), 2000);
}

// Render Profile Tabs
function renderProfileTabs() {
  profileTabsContainer.innerHTML = '';
  if (currentSets.length <= 1) {
    profileTabsContainer.style.display = 'none';
    return;
  }
  profileTabsContainer.style.display = 'flex';
  currentSets.forEach((set) => {
    const isSelected = set.id === currentActiveSetId;
    const tab = document.createElement('button');
    tab.className = `profile-tab-pill ${isSelected ? 'active' : ''}`;
    tab.textContent = `${set.name} Profile`;
    tab.onclick = () => {
      currentActiveSetId = set.id;
      renderProfileTabs();
      renderEntries();
    };
    profileTabsContainer.appendChild(tab);
  });
}

// Render Entries
function renderEntries() {
  const query = searchInput.value.toLowerCase().trim();
  
  const currentSetEntries = allEntries.filter(e => e.set_id === currentActiveSetId || !e.set_id);
  const filtered = currentSetEntries.filter(e => 
    (e.label && e.label.toLowerCase().includes(query)) ||
    (e.value && e.value.toLowerCase().includes(query)) ||
    (e.entry_type && e.entry_type.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    entriesList.innerHTML = `
      <div class="empty-state">
        <p style="font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">No items in this vault yet.</p>
        <p style="font-size: 0.78rem;">Click <strong>+ Add New Entry</strong> below to add your links!</p>
      </div>
    `;
    return;
  }

  entriesList.innerHTML = '';
  filtered.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'entry-card';

    card.innerHTML = `
      <div class="entry-icon-box">
        ${getIconSVG(entry.entry_type)}
      </div>
      <div class="entry-details">
        <div class="entry-header-row">
          <span class="entry-title">${entry.label}</span>
          <span class="entry-tag">${entry.entry_type || 'link'}</span>
        </div>
        <div class="entry-snippet" title="${entry.value}">${entry.value}</div>
      </div>
      <button class="copy-btn" id="btn-${entry.id}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>Copy</span>
      </button>
    `;

    const copyBtn = card.querySelector(`#btn-${entry.id}`);
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(entry.value);
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `<span>Copied!</span>`;
        showToast(`Copied "${entry.label}"!`);
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Copy</span>
          `;
        }, 1800);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    };

    entriesList.appendChild(card);
  });
}

function readFromChromeStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['quickvault_sets', 'quickvault_entries'], (result) => {
      if (result && result.quickvault_sets && result.quickvault_sets.length > 0) {
        currentSets = result.quickvault_sets;
        currentActiveSetId = currentSets[0].id;
      }
      if (result && result.quickvault_entries && result.quickvault_entries.length > 0) {
        allEntries = result.quickvault_entries;
      }
      renderProfileTabs();
      renderEntries();
    });
  } else {
    renderProfileTabs();
    renderEntries();
  }
}

// 1-Step Sync Controller with safe lastError handling
function syncDataNow() {
  readFromChromeStorage();

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({}, (tabs) => {
      // Safely ignore if no tabs
      if (chrome.runtime.lastError) return;

      const qvTab = tabs.find(t => t.url && (t.url.includes('127.0.0.1:5173') || t.url.includes('localhost:5173')));
      if (qvTab && qvTab.id) {
        chrome.tabs.sendMessage(qvTab.id, { action: 'GET_LIVE_VAULT' }, (response) => {
          // Catch and consume lastError gracefully
          if (chrome.runtime.lastError) {
            readFromChromeStorage();
            return;
          }
          if (response && response.entries && response.entries.length > 0) {
            if (response.sets && response.sets.length > 0) {
              currentSets = response.sets;
              currentActiveSetId = currentSets[0].id;
            }
            allEntries = response.entries;
            renderProfileTabs();
            renderEntries();
          }
        });
      }
    });
  }
}

searchInput.addEventListener('input', renderEntries);
syncDataNow();
