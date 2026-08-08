// QuickVault Manifest V3 Service Worker

chrome.runtime.onInstalled.addListener(() => {
  // Create Context Menu for 1-click web saving
  chrome.contextMenus.create({
    id: 'save_to_quickvault',
    title: 'Save to QuickVault',
    contexts: ['selection', 'link']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save_to_quickvault') {
    const textToSave = info.selectionText || info.linkUrl;
    if (!textToSave) return;

    chrome.storage.local.get(['quickvault_entries'], (result) => {
      const existing = result.quickvault_entries || [];
      const newEntry = {
        id: `ext-${Date.now()}`,
        set_id: 'set-personal',
        label: textToSave.length > 25 ? `${textToSave.substring(0, 22)}...` : textToSave,
        value: textToSave,
        entry_type: 'link',
        created_at: new Date().toISOString()
      };

      existing.unshift(newEntry);
      chrome.storage.local.set({ quickvault_entries: existing });
    });
  }
});
