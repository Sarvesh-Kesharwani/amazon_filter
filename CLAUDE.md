# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Chrome extension (Manifest V3) that filters and sorts Amazon search results in place. Plain vanilla JS/HTML/CSS — no build step, no package.json, no test suite, no linter.

## Project rules (from `rulesToFollow_forClaud.md`)

- Commit after each quantifiable change.
- Update `release_notes.md` before every commit that changes the project.

## Development

- Load: `chrome://extensions/` → Developer mode → **Load unpacked** → select this repo folder.
- After editing, click reload on the extension card. Changes to `content.js` also need the Amazon tab reloaded, otherwise the popup shows "Reload the Amazon page and try again." (`chrome.tabs.sendMessage` has no receiver).
- Verify manually on a search results page of a supported domain (amazon.com / .in / .co.uk / .de / .ca — the `content_scripts.matches` list in `manifest.json`).
- Store assets: `assets/*.html` render at Chrome Web Store sizes; `node assets/export.js` screenshots them to JPEG/PNG (requires `puppeteer` installed ad hoc). See `assets/HOW_TO_EXPORT.md`.

## Architecture

Two runtime contexts share state through `chrome.storage.local` and one message type.

**Storage shape** (written only by the popup):
```js
{
  enabled: boolean,
  filters: { review_count: { active, value }, rating: { active, value }, best_seller: { active, value }, ... },
  sortBy: "none" | "review_count_desc" | "rating_desc" | "magic_score_desc" | "price_desc" | "price_asc",
  user: { email, token }   // Google sign-in
}
```
Only checked filters are present in `filters`; `value` matters only for `review_count` and `rating`.

**`popup.js`** — no Apply button: every toggle/checkbox/sort change calls `saveAndApply()` immediately (threshold inputs are debounced 400 ms). It writes storage, then sends `{ action: "applyFilter", ...settings }` to the active tab and shows the `{ hidden, sorted }` response.

**`content.js`** — `applyFilter(settings)`:
1. Un-hides everything previously hidden (cards and wrapper rows tagged `data-hidden-by-filter`), so disabling restores the page.
2. Hides cards failing any active filter (`passesFilters` — AND of all active filters). It also hides the card's closest wrapper row so orphaned "Add to Cart" buttons don't remain.
3. Sorts visible cards by re-appending them to their parent (`sortCards`). `magic_score` = rating × review_count, normalized 0–100 against the max visible score.

The content script also re-applies saved settings on page load. Every Amazon new search, back/forward, and refresh is a full page load, so without this the page comes up unfiltered while the popup still shows enabled. This was once removed (b3d0280) under the mistaken belief it flipped the toggle — the content script never writes `enabled`, so keep it.

**Adding a filter or sort** touches several places that must agree on the key: the `f_<key>` / `val_<key>` / `th_<key>` element IDs in `popup.html`, `FILTER_KEYS` / `THRESHOLD_KEYS` / `PRO_SORT_VALUES` in `popup.js`, and `passesFilters` / `fieldGetters` in `content.js`.

**DOM parsing is the fragile part.** `getProductCards`, `parseReviewCount` (handles `1K`/`2.5K+` shorthand via `parseShortNumber`), `parseRating`, `parsePrice` (US vs EU decimal formats), and the `is*` badge detectors each use fallback chains of Amazon selectors and text regexes. Unparseable numeric values return `0`, so such cards fail numeric filters. When Amazon changes markup, fix it here.

## Google sign-in (pro sorts)

Magic Score and Price sorts are gated behind Google sign-in (`PRO_SORT_VALUES`). Auth uses `chrome.identity.launchWebAuthFlow` (implicit token flow) because `getAuthToken` doesn't work for unpublished extensions. `manifest.json` `oauth2.client_id` is still the placeholder `YOUR_GOOGLE_OAUTH_CLIENT_ID...`, so sign-in fails until a real client ID is set.

## Other files

- `landing/` and `privacy-policy.html` — static pages for the Chrome Web Store listing, not part of the extension runtime.
- `todo.md` — the maintainer's backlog.
- Version: `manifest.json` says `1.0.0` while `release_notes.md` is at v1.2.1; bump the manifest when releasing.
