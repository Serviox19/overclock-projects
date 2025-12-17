// Content Script - Runs on web pages
console.log('Content script loaded on:', window.location.href);

// Minimum size for images to get the capture button (in pixels)
const MIN_IMAGE_SIZE = 150;

// Track which images have buttons to avoid duplicates
const processedImages = new WeakSet();

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.action === 'highlightPage') {
    // Example: Add a temporary highlight effect to the page
    const originalBg = document.body.style.backgroundColor;
    document.body.style.transition = 'background-color 0.5s';
    document.body.style.backgroundColor = '#fff3cd';

    setTimeout(() => {
      document.body.style.backgroundColor = originalBg;
    }, 1000);

    sendResponse({ success: true, message: 'Page highlighted' });
  }

  return true; // Keep message channel open for async response
});

// Show notification when image is captured
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#FF5722'};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = 'opacity 0.5s';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Check if image is large enough to warrant a capture button
function isImageLargeEnough(img) {
  const rect = img.getBoundingClientRect();
  const width = rect.width || img.naturalWidth;
  const height = rect.height || img.naturalHeight;

  return width >= MIN_IMAGE_SIZE && height >= MIN_IMAGE_SIZE;
}

// Create the circular "Cap!" button
function createCapButton(img) {
  const button = document.createElement('button');
  button.className = 'extension-cap-button';
  button.textContent = 'Cap!';
  button.title = 'Add to mood board';

  // Style the button
  button.style.cssText = `
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 2px solid white;
    font-size: 11px;
    font-weight: bold;
    font-family: Arial, sans-serif;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.3s, transform 0.2s;
    pointer-events: auto;
  `;

  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  // Handle click to capture image
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    await captureImage(img);
  });

  return button;
}

// Capture image and add to mood board
async function captureImage(img) {
  try {
    const imageData = {
      src: img.src || img.currentSrc,
      alt: img.alt || 'Captured image',
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      pageUrl: window.location.href,
      pageTitle: document.title,
      timestamp: Date.now()
    };

    // Get existing mood board
    const result = await chrome.storage.local.get(['moodBoard']);
    const moodBoard = result.moodBoard || [];

    // Check if image already exists
    const exists = moodBoard.some(item => item.src === imageData.src);

    if (exists) {
      showNotification('Image already in mood board!', 'info');
      return;
    }

    // Add new image to mood board
    moodBoard.push(imageData);

    // Save to storage
    await chrome.storage.local.set({ moodBoard });

    console.log('Image added to mood board:', imageData);
    showNotification('Added to mood board! 🎨');

    // Send message to popup to update if it's open
    chrome.runtime.sendMessage({
      action: 'moodBoardUpdated',
      count: moodBoard.length
    });

  } catch (error) {
    console.error('Error capturing image:', error);
    showNotification('Failed to capture image', 'error');
  }
}

// Create a wrapper for the image to position the button
function wrapImageWithButton(img) {
  try {
    // Skip if already processed
    if (processedImages.has(img)) {
      return;
    }

    // Check if image has a parent node
    if (!img.parentNode) {
      console.log('Image has no parent node, skipping');
      return;
    }

    // Check if image is large enough
    if (!isImageLargeEnough(img)) {
      console.log('Image too small:', img.src, 'Size:', img.getBoundingClientRect().width, 'x', img.getBoundingClientRect().height);
      return;
    }

    processedImages.add(img);

    // Check if image already has a wrapper
    const parent = img.parentElement;
    if (parent && parent.classList.contains('extension-image-wrapper')) {
      return;
    }

    console.log('Adding Cap button to image:', img.src);

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'extension-image-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      line-height: 0;
    `;

    // Insert wrapper
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    // Create and add button
    const button = createCapButton(img);
    wrapper.appendChild(button);

    // Show button on hover
    wrapper.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
    });

    wrapper.addEventListener('mouseleave', () => {
      button.style.opacity = '0';
    });

    console.log('Successfully added Cap button to image');
  } catch (error) {
    console.error('Error wrapping image with button:', error, img);
  }
}

// Process all images on the page
function processImages() {
  console.log('Processing images on page...');
  const images = document.querySelectorAll('img');
  console.log(`Found ${images.length} images on page`);

  images.forEach(img => {
    // Wait for image to load to get accurate dimensions
    if (img.complete && img.naturalWidth > 0) {
      wrapImageWithButton(img);
    } else {
      img.addEventListener('load', () => {
        wrapImageWithButton(img);
      }, { once: true });

      // Also add error handler
      img.addEventListener('error', () => {
        console.log('Image failed to load:', img.src);
      }, { once: true });
    }
  });
}

// Initialize: Process images when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - processing images');
    processImages();

    // Re-process after a delay to catch lazy-loaded images
    setTimeout(() => {
      console.log('Re-processing images after 2s delay');
      processImages();
    }, 2000);
  });
} else {
  console.log('Document already loaded - processing images immediately');
  processImages();

  // Re-process after a delay to catch lazy-loaded images
  setTimeout(() => {
    console.log('Re-processing images after 2s delay');
    processImages();
  }, 2000);
}

// Watch for new images added dynamically
function startObserver() {
  if (!document.body) {
    console.log('document.body not ready, waiting...');
    setTimeout(startObserver, 100);
    return;
  }

  console.log('Starting MutationObserver');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'IMG') {
          if (node.complete && node.naturalWidth > 0) {
            wrapImageWithButton(node);
          } else {
            node.addEventListener('load', () => {
              wrapImageWithButton(node);
            }, { once: true });
          }
        } else if (node.querySelectorAll) {
          const images = node.querySelectorAll('img');
          images.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
              wrapImageWithButton(img);
            } else {
              img.addEventListener('load', () => {
                wrapImageWithButton(img);
              }, { once: true });
            }
          });
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

startObserver();

console.log('Mood board capture extension initialized!');
