# How to Export Chrome Web Store Assets

Each `.html` file renders at the exact required dimensions. To export as PNG:

## Option 1: Browser Screenshot (Easiest)
1. Open the `.html` file in Chrome
2. Press `F12` → open DevTools
3. Click the device toolbar icon (or `Ctrl+Shift+M`)
4. Set dimensions to the exact size listed below
5. Right-click the page → "Capture screenshot" or use DevTools: `Ctrl+Shift+P` → type "screenshot" → "Capture full size screenshot"

## Option 2: Chrome DevTools Command
1. Open the `.html` file in Chrome
2. Press `F12` → DevTools Console
3. Press `Ctrl+Shift+P` → type "screenshot" → "Capture full size screenshot"

## Asset Dimensions

| File | Size | Purpose |
|------|------|---------|
| `icon128.svg` | 128x128 | Store icon (save as PNG) |
| `screenshot1.html` | 1280x800 | Screenshot — Filters overview |
| `screenshot2.html` | 1280x800 | Screenshot — Sorting features |
| `screenshot3.html` | 1280x800 | Screenshot — Supported domains |
| `small_promo.html` | 440x280 | Small promo tile |
| `marquee_promo.html` | 1400x560 | Marquee promo tile |

## For the SVG icon
Open `icon128.html` in Chrome, right-click the icon → "Save Image As" → save as PNG.
Or use any SVG-to-PNG converter at 128x128.
