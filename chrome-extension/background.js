// Background Service Worker
console.log('Background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);

  if (details.reason === 'install') {
    // First time installation
    chrome.storage.sync.set({ count: 0 });
    console.log('Extension installed for the first time');
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated');
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);

  if (request.action === 'buttonClicked') {
    console.log('Button was clicked! Count:', request.count);

    // Send response back
    sendResponse({
      success: true,
      message: 'Background script received your message'
    });
  }

  // Return true to indicate async response
  return true;
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

// Listen for browser action clicks (optional, if you want to handle icon clicks without popup)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

