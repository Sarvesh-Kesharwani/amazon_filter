# Amazon Product Filter — Chrome Extension

A lightweight Chrome extension that filters and sorts Amazon product search results. Apply multiple filters at once — review count, rating, best seller status, and Prime eligibility — then sort the remaining results. Products that don't meet your criteria are removed from the page.

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
4. Check one or more filters (combine as needed):
   - **Review Count** — set a minimum number of reviews (e.g. 100).
   - **Rating** — set a minimum star rating (e.g. 4.0).
   - **Best Seller** — keeps only items with a Best Seller badge.
   - **Prime Only** — keeps only Prime-eligible items.
5. Optionally pick a **Sort By** option:
   - Review Count (high to low / low to high)
   - Rating (high to low / low to high)
6. Click **Apply**. Products that fail any active filter are hidden; the rest are reordered by your chosen sort.

Settings are saved automatically and re-applied on future page loads.

## Project Structure

```
amazon_filter/
├── manifest.json    # Extension manifest (Manifest V3)
├── popup.html       # Popup UI
├── popup.css        # Beige & black theme styles
├── popup.js         # Popup logic, multi-filter state & Chrome messaging
├── content.js       # Content script — parses, filters & sorts product cards
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
