// Popup JavaScript for Mood Board Extension
document.addEventListener('DOMContentLoaded', function() {
  const clearAllBtn = document.getElementById('clearAllBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportImagesBtn = document.getElementById('exportImagesBtn');
  const statusDiv = document.getElementById('status');
  const imageCountDisplay = document.getElementById('imageCount');
  const moodBoardContainer = document.getElementById('moodBoard');
  const saveAsToggle = document.getElementById('saveAsToggle');

  // Load settings
  loadSettings();

  // Load and display mood board
  loadMoodBoard();

  // Save settings when toggle changes
  saveAsToggle.addEventListener('change', async function() {
    await chrome.storage.sync.set({ saveAsEnabled: saveAsToggle.checked });
    console.log('Save-as setting:', saveAsToggle.checked);
  });

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['saveAsEnabled']);
      saveAsToggle.checked = result.saveAsEnabled || false;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Listen for mood board updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'moodBoardUpdated') {
      loadMoodBoard();
    }
  });

  // Load mood board from storage
  async function loadMoodBoard() {
    try {
      const result = await chrome.storage.local.get(['moodBoard']);
      const moodBoard = result.moodBoard || [];

      // Update count
      imageCountDisplay.textContent = moodBoard.length;

      // Display images
      displayMoodBoard(moodBoard);
    } catch (error) {
      console.error('Error loading mood board:', error);
      showStatus('Error loading mood board', 'error');
    }
  }

  // Display mood board images
  function displayMoodBoard(images) {
    if (images.length === 0) {
      moodBoardContainer.innerHTML = `
        <div class="empty-state">
          <p>No images captured yet!</p>
          <p class="hint">Visit any website and hover over images to start capturing.</p>
        </div>
      `;
      return;
    }

    // Sort by timestamp (newest first)
    const sortedImages = [...images].sort((a, b) => b.timestamp - a.timestamp);

    moodBoardContainer.innerHTML = sortedImages.map((img, index) => `
      <div class="mood-board-item" data-index="${index}">
        <img src="${img.src}" alt="${img.alt}" loading="lazy">
        <div class="mood-board-item-overlay">
          <button class="delete-btn" data-src="${img.src}" title="Remove from mood board">
            <span>×</span>
          </button>
          <div class="image-info">
            <p class="image-source" title="${img.pageUrl}">${truncateText(img.pageTitle, 30)}</p>
          </div>
        </div>
      </div>
    `).join('');

    // Add delete button listeners
    const deleteButtons = moodBoardContainer.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const src = btn.getAttribute('data-src');
        await removeImage(src);
      });
    });

    // Add click to view full image
    const items = moodBoardContainer.querySelectorAll('.mood-board-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn') && e.target.tagName !== 'SPAN') {
          const img = item.querySelector('img');
          const index = parseInt(item.getAttribute('data-index'));
          const imageData = sortedImages[index];
          openImageInNewTab(imageData);
        }
      });
    });
  }

  // Remove image from mood board
  async function removeImage(src) {
    try {
      const result = await chrome.storage.local.get(['moodBoard']);
      const moodBoard = result.moodBoard || [];

      const updatedBoard = moodBoard.filter(img => img.src !== src);

      await chrome.storage.local.set({ moodBoard: updatedBoard });

      showStatus('Image removed', 'success');
      loadMoodBoard();
    } catch (error) {
      console.error('Error removing image:', error);
      showStatus('Error removing image', 'error');
    }
  }

  // Clear all images
  clearAllBtn.addEventListener('click', async function() {
    if (confirm('Are you sure you want to clear all images from your mood board?')) {
      try {
        await chrome.storage.local.set({ moodBoard: [] });
        showStatus('Mood board cleared!', 'success');
        loadMoodBoard();
      } catch (error) {
        console.error('Error clearing mood board:', error);
        showStatus('Error clearing mood board', 'error');
      }
    }
  });

  // Export mood board as JSON
  exportJsonBtn.addEventListener('click', async function() {
    try {
      const result = await chrome.storage.local.get(['moodBoard']);
      const moodBoard = result.moodBoard || [];

      if (moodBoard.length === 0) {
        showStatus('No images to export', 'info');
        return;
      }

      // Create exportable data
      const exportData = {
        exported: new Date().toISOString(),
        images: moodBoard.map(img => ({
          src: img.src,
          alt: img.alt,
          pageTitle: img.pageTitle,
          pageUrl: img.pageUrl,
          capturedAt: new Date(img.timestamp).toISOString()
        }))
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mood-board-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showStatus('JSON exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      showStatus('Error exporting JSON', 'error');
    }
  });

  // Export individual images
  exportImagesBtn.addEventListener('click', async function() {
    try {
      const result = await chrome.storage.local.get(['moodBoard']);
      const moodBoard = result.moodBoard || [];

      if (moodBoard.length === 0) {
        showStatus('No images to export', 'info');
        return;
      }

      // Get saveAs setting
      const settingsResult = await chrome.storage.sync.get(['saveAsEnabled']);
      const saveAsEnabled = settingsResult.saveAsEnabled || false;

      if (saveAsEnabled && moodBoard.length > 1) {
        showStatus(`Downloading ${moodBoard.length} images - you'll be prompted for each location...`, 'info');
      } else {
        showStatus(`Downloading ${moodBoard.length} images...`, 'info');
      }

      // Download each image
      let downloaded = 0;
      for (let i = 0; i < moodBoard.length; i++) {
        const img = moodBoard[i];

        try {
          // Create a filename from the source URL or use index
          const urlParts = img.src.split('/');
          const filename = urlParts[urlParts.length - 1].split('?')[0] || `image-${i + 1}`;
          const cleanFilename = sanitizeFilename(filename);

          // Use Chrome downloads API to save each image
          await chrome.downloads.download({
            url: img.src,
            filename: saveAsEnabled ? cleanFilename : `mood-board/${cleanFilename}`,
            saveAs: saveAsEnabled,
            conflictAction: 'uniquify'
          });

          downloaded++;

          // Small delay to prevent overwhelming the download manager
          // Longer delay if prompting for location
          if (i < moodBoard.length - 1) {
            await new Promise(resolve => setTimeout(resolve, saveAsEnabled ? 500 : 100));
          }
        } catch (err) {
          console.error(`Failed to download image ${i}:`, err);
        }
      }

      showStatus(`Successfully downloaded ${downloaded} of ${moodBoard.length} images!`, 'success');
    } catch (error) {
      console.error('Error exporting images:', error);
      showStatus('Error exporting images', 'error');
    }
  });

  // Sanitize filename for download
  function sanitizeFilename(filename) {
    // Remove or replace invalid filename characters
    let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure it has an extension, add .jpg if missing
    if (!sanitized.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      sanitized += '.jpg';
    }

    // Limit length
    if (sanitized.length > 100) {
      const ext = sanitized.split('.').pop();
      sanitized = sanitized.substring(0, 95) + '.' + ext;
    }

    return sanitized;
  }

  // Show status message
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    const colors = {
      success: '#4CAF50',
      error: '#FF5722',
      info: '#2196F3'
    };

    statusDiv.style.color = colors[type] || colors.info;

    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // Truncate text helper
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Open image in new tab
  function openImageInNewTab(imageData) {
    chrome.tabs.create({ url: imageData.src });
  }
});
