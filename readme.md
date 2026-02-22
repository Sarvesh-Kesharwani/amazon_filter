# Amazon Product Filter — Chrome Extension

A lightweight Chrome extension that filters Amazon product search results by review count, rating, best seller status, or Prime eligibility. Products that don't meet your criteria are removed from the page.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `amazon_filter` folder.
5. The extension icon will appear in your toolbar.

## Usage

1. Search for a product on any supported Amazon site.
2. Click the extension icon to open the popup.
3. Toggle **Enable Filter** on.
4. Select a filter type from the dropdown:
   - **Review Count** — set a minimum number of reviews (e.g. 100).
   - **Rating** — set a minimum star rating (e.g. 4.0).
   - **Best Seller** — keeps only items with a Best Seller badge.
   - **Prime Only** — keeps only Prime-eligible items.
5. Click **Apply Filter**. Matching products stay; the rest are hidden.

Settings are saved automatically and re-applied on future page loads.

## Project Structure

```
amazon_filter/
├── manifest.json    # Extension manifest (Manifest V3)
├── popup.html       # Popup UI
├── popup.css        # Beige & black theme styles
├── popup.js         # Popup logic & Chrome messaging
├── content.js       # Content script — parses & filters product cards
├── icons/           # Extension icons (16, 48, 128px)
├── readme.md
└── release_notes.md
```

## Supported Amazon Domains

- amazon.com
- amazon.in
- amazon.co.uk
- amazon.de
- amazon.ca
