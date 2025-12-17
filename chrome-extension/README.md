# Mood Board Capture Extension

A Chrome extension that lets you capture and save images from any website to your personal mood board. Perfect for designers, artists, and anyone collecting visual inspiration!

## Features

✨ **Easy Image Capture** - Hover over any medium/large image on a webpage and click the "Cap!" button
🎨 **Beautiful Mood Board** - View all your captured images in a stunning gallery
📁 **Smart Storage** - Images are saved with metadata (source URL, page title, capture date)
🗑️ **Easy Management** - Remove individual images or clear your entire board
💾 **Dual Export Options** - Export as JSON metadata OR download all images as individual files
🎯 **Smart Detection** - Only shows capture buttons on medium/large images (no icons or tiny images)

## Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.js           # Popup logic
├── background.js      # Background service worker
├── content.js         # Content script (runs on web pages)
├── styles.css         # Popup styles
├── content.css        # Styles injected into web pages
└── icons/             # Extension icons (you need to add these)
```

## Technical Features

- ✅ Manifest V3 compliant
- ✅ Modern ES6+ JavaScript
- ✅ Beautiful, gradient UI design with responsive grid
- ✅ Background service worker
- ✅ Dynamic content scripts with MutationObserver
- ✅ Chrome Storage API integration (local storage for images)
- ✅ Message passing between popup, content, and background scripts
- ✅ Smart image detection with size filtering
- ✅ Hover-activated circular capture buttons

## Getting Started

### 1. Add Icons

Create an `icons/` directory and add three PNG icons:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create simple icons using any image editor or online tools.

### 2. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. The extension should now appear in your extensions list

### 3. Test the Extension

1. Visit any website with images (e.g., Pinterest, Unsplash, news sites)
2. Hover over medium or large images on the page
3. You'll see a circular "Cap!" button appear in the bottom-right of each image
4. Click "Cap!" to save the image to your mood board
5. Click the extension icon to view your captured images
6. Click on any captured image to open it in a new tab
7. Use the "×" button to remove individual images
8. Use "Clear All" to reset your mood board

## How It Works

### Image Detection
The content script (`content.js`) automatically:
1. Scans all images on the page when it loads
2. Checks if each image is at least 150×150 pixels
3. Wraps qualifying images with a container
4. Adds a "Cap!" button that appears on hover
5. Watches for dynamically added images using MutationObserver

### Image Capture
When you click "Cap!":
1. Image metadata (URL, dimensions, source page) is collected
2. Data is saved to Chrome's local storage
3. A notification confirms the capture
4. The popup updates automatically if open

### Mood Board Display
The popup (`popup.html` and `popup.js`) provides:
- Grid view of all captured images
- Image count statistics
- Individual image removal
- Bulk operations (clear all, export)
- Click to view full-size image

## Development

### Modifying the Extension

- **Popup UI**: Edit `popup.html` and `styles.css`
- **Popup Logic & Mood Board**: Edit `popup.js`
- **Background Tasks**: Edit `background.js`
- **Image Capture & Button**: Edit `content.js` and `content.css`
- **Minimum Image Size**: Change `MIN_IMAGE_SIZE` in `content.js` (default: 150px)
- **Permissions**: Update `manifest.json`

### Reloading Changes

After making changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension card
3. Reopen the popup or reload the page you're testing on

### Debugging

- **Popup**: Right-click popup → Inspect
- **Background Script**: Click "Inspect views: service worker" on extension card
- **Content Script**: Use regular page DevTools (F12)

## Key Components

### manifest.json

The manifest defines your extension's properties, permissions, and components.

### popup.html/js

The popup appears when users click your extension icon. It can interact with:
- Chrome Storage API
- Background script
- Content scripts in active tabs

### background.js

The background service worker:
- Runs in the background
- Handles long-running tasks
- Listens for browser events
- Manages extension lifecycle

### content.js

Content scripts:
- Run on web pages matching the patterns in manifest.json
- Can access and modify page DOM
- Have limited access to Chrome APIs
- Can communicate with popup and background scripts

## Chrome APIs Used

- `chrome.storage` - Store and retrieve data
- `chrome.runtime` - Message passing
- `chrome.tabs` - Interact with browser tabs
- `chrome.action` - Control extension icon and popup

## Settings

### Download Location Prompt

By default, images are downloaded to your `Downloads/mood-board/` folder automatically. To choose the location for each image:

1. Open the extension popup
2. Check the box "Prompt for download location"
3. Click "Export Images"
4. You'll be prompted to choose a location for each image

**Note:** When enabled with many images, you'll need to approve each download location individually.

## Customization

### Change Button Appearance

In `content.js`, modify the `createCapButton()` function:

```javascript
// Change button size
width: 50px;
height: 50px;

// Change button color/gradient
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Change button text
button.textContent = 'Save!'; // or '📌' or any emoji
```

### Adjust Image Size Threshold

In `content.js`, change the minimum size:

```javascript
const MIN_IMAGE_SIZE = 150; // Change to 200, 300, etc.
```

### Customize Popup Size

In `styles.css`:

```css
body {
  width: 600px;  /* Change width */
  max-height: 700px;  /* Change height */
}
```

## Common Tasks

### Access Your Mood Board Data

The mood board is stored in Chrome's local storage:

```javascript
chrome.storage.local.get(['moodBoard'], (result) => {
  console.log(result.moodBoard);
});
```

### Export Your Mood Board

You have two export options:

**1. Export JSON** - Download metadata as a JSON file containing:
- Image URLs
- Source page URLs and titles
- Capture timestamps
- Image dimensions

**2. Export Images** - Download all captured images as individual files:
- By default, images are saved to a `mood-board/` folder in your Downloads
- Enable "Prompt for download location" to choose where to save each image
- Original filenames are preserved when possible
- Automatic filename sanitization for compatibility
- Duplicate filenames are handled automatically (numbered)

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

## License

MIT
