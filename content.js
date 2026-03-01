// Selectors for Amazon search result items — order matters, first match wins
const PRODUCT_SELECTORS = [
  '[data-component-type="s-search-result"]',
  '.s-result-item[data-asin]:not([data-asin=""])',
  '.sg-col-inner .s-result-item',
];

function getProductCards() {
  // Collect all cards, deduplicating by element reference
  const seen = new Set();
  const results = [];
  for (const selector of PRODUCT_SELECTORS) {
    for (const card of document.querySelectorAll(selector)) {
      if (!seen.has(card)) {
        seen.add(card);
        results.push(card);
      }
    }
  }

  // Also grab sponsored / thematic cards that live outside the main grid
  // These are typically inside div[data-component-type="sp-sponsored-result"] or similar
  const sponsored = document.querySelectorAll(
    '[data-component-type*="sp_"], [data-component-type*="sponsored"], ' +
    '.AdHolder [data-asin], .s-shopping-adviser [data-asin]'
  );
  for (const card of sponsored) {
    if (!seen.has(card)) {
      seen.add(card);
      results.push(card);
    }
  }

  return results;
}

// Parse shorthand numbers: "1K" -> 1000, "2.5K+" -> 2500, "1,234" -> 1234, "15" -> 15
function parseShortNumber(text) {
  const cleaned = text.trim().replace(/[(),\s+]/g, "");
  // Match patterns like "2.5K", "10K", "1.2M"
  const shortMatch = cleaned.match(/^([\d,.]+)\s*([KkMm])/);
  if (shortMatch) {
    const base = parseFloat(shortMatch[1].replace(/,/g, ""));
    const multiplier = shortMatch[2].toLowerCase() === "k" ? 1000 : 1000000;
    return Math.round(base * multiplier);
  }
  // Plain number with possible commas: "1,234"
  const num = parseInt(cleaned.replace(/,/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

function parseReviewCount(card) {
  // Try links that point to reviews section — the text inside is the count
  const reviewLinks = card.querySelectorAll(
    'a[href*="#customerReviews"], a[href*="#reviews"], a[href*="product-reviews"]'
  );
  for (const link of reviewLinks) {
    const num = parseShortNumber(link.textContent);
    if (num > 0) return num;
  }

  // Look in the ratings row for a plain number span
  const row = card.querySelector('.a-row.a-size-small, [data-cy="reviews-ratings-slot"]') || card;
  const spans = row.querySelectorAll('span.a-size-base, span.a-size-small');
  for (const span of spans) {
    const num = parseShortNumber(span.textContent);
    if (num > 0) return num;
  }

  // aria-label fallback: "1,234 ratings" or "2K ratings"
  const allLinks = card.querySelectorAll('a');
  for (const a of allLinks) {
    const label = a.getAttribute("aria-label") || "";
    const match = label.match(/([\d,.]+[KkMm]?\+?)\s*(rating|review|customer)/i);
    if (match) return parseShortNumber(match[1]);
  }

  // Last resort: scan all text nodes for a number near "ratings" or "reviews"
  const fullText = card.textContent;
  const m = fullText.match(/([\d,.]+[KkMm]?\+?)\s*(ratings|reviews)/i);
  if (m) return parseShortNumber(m[1]);

  return 0;
}

function parseRating(card) {
  // Primary: .a-icon-alt text like "4.5 out of 5 stars"
  const altEls = card.querySelectorAll('.a-icon-alt, i.a-icon-star-small span, i.a-icon-star span');
  for (const el of altEls) {
    const match = el.textContent.match(/([\d.]+)\s*(out of|\/|von|sur|su|中)/);
    if (match) return parseFloat(match[1]);
  }

  // aria-label on star icons
  const starIcons = card.querySelectorAll(
    'i[class*="a-icon-star"], [data-cy="reviews-ratings-slot"] i, span[class*="a-icon-star"]'
  );
  for (const icon of starIcons) {
    const label = icon.getAttribute("aria-label") || "";
    const match = label.match(/([\d.]+)\s*(out of|\/|von|sur|su|中)/);
    if (match) return parseFloat(match[1]);
    // class-based: "a-star-small-4-5" means 4.5
    const cls = icon.className || "";
    const classMatch = cls.match(/a-star(?:-small)?-([\d])(?:-([\d]))?/);
    if (classMatch) return parseFloat(classMatch[1] + (classMatch[2] ? "." + classMatch[2] : ""));
  }

  // Fallback: any element with aria-label containing star rating
  const allSpans = card.querySelectorAll('[aria-label*="star"], [aria-label*="Star"]');
  for (const el of allSpans) {
    const match = el.getAttribute("aria-label").match(/([\d.]+)/);
    if (match) return parseFloat(match[1]);
  }

  return 0;
}

function isBestSeller(card) {
  if (card.querySelector('.a-badge-text, [data-a-badge-type], .a-badge-label, span.a-badge-text')) {
    const badgeText = (card.querySelector('.a-badge-text, .a-badge-label') || {}).textContent || "";
    if (/best\s*seller/i.test(badgeText)) return true;
  }
  const text = card.textContent.toLowerCase();
  return text.includes("best seller") || text.includes("bestseller") ||
    text.includes("#1 best");
}

function isAmazonsChoice(card) {
  if (card.querySelector('.a-badge-text, [data-a-badge-type], .a-badge-label')) {
    const badgeText = (card.querySelector('.a-badge-text, .a-badge-label') || {}).textContent || "";
    if (/amazon.?s\s*choice/i.test(badgeText)) return true;
  }
  const text = card.textContent.toLowerCase();
  return text.includes("amazon's choice") || text.includes("amazons choice");
}

function isLimitedTimeDeal(card) {
  const dealBadge = card.querySelector(
    '.a-color-price .a-text-bold, [data-a-badge-type="deal"], .dealBadge, ' +
    'span[data-deal-badge], .s-coupon-highlight-color'
  );
  if (dealBadge) {
    const text = dealBadge.textContent.toLowerCase();
    if (text.includes("limited time deal") || text.includes("deal")) return true;
  }
  const text = card.textContent.toLowerCase();
  return text.includes("limited time deal");
}

function isPrime(card) {
  return !!card.querySelector(
    'i.a-icon-prime, i.a-icon-prime-tp, ' +
    'span[aria-label="Amazon Prime"], ' +
    '[data-a-icon-type="prime"], ' +
    '.aok-relative .a-icon-prime, ' +
    'span.a-declarative i[aria-label*="Prime"]'
  );
}

// Check if a card passes ALL active filters
function passesFilters(card, filters) {
  if (filters.review_count?.active && parseReviewCount(card) < filters.review_count.value) {
    return false;
  }
  if (filters.rating?.active && parseRating(card) < filters.rating.value) {
    return false;
  }
  if (filters.best_seller?.active && !isBestSeller(card)) {
    return false;
  }
  if (filters.prime?.active && !isPrime(card)) {
    return false;
  }
  if (filters.amazons_choice?.active && !isAmazonsChoice(card)) {
    return false;
  }
  if (filters.limited_time_deal?.active && !isLimitedTimeDeal(card)) {
    return false;
  }
  return true;
}

// Sort visible cards in-place within the DOM
function sortCards(cards, sortBy) {
  if (sortBy === "none") return false;

  const lastUnderscore = sortBy.lastIndexOf("_");
  const field = sortBy.substring(0, lastUnderscore);
  const direction = sortBy.substring(lastUnderscore + 1);

  const getValue = field === "review_count" ? parseReviewCount : parseRating;
  const multiplier = direction === "asc" ? 1 : -1;

  const visibleCards = cards.filter(c => c.style.display !== "none");
  if (visibleCards.length === 0) return false;

  const parent = visibleCards[0].parentNode;

  const sorted = [...visibleCards].sort((a, b) => {
    return (getValue(a) - getValue(b)) * multiplier;
  });

  for (const card of sorted) {
    parent.appendChild(card);
  }

  return true;
}

function applyFilter(settings) {
  const { enabled, filters = {}, sortBy = "none" } = settings;
  const cards = getProductCards();
  let hidden = 0;

  const hasActiveFilter = Object.values(filters).some(f => f.active);

  // Reset any previously hidden wrapper rows
  for (const el of document.querySelectorAll('[data-hidden-by-filter="true"]')) {
    el.style.display = "";
    delete el.dataset.hiddenByFilter;
  }

  for (const card of cards) {
    // Always reset visibility first
    card.style.display = "";

    if (!enabled) continue;

    if (hasActiveFilter && !passesFilters(card, filters)) {
      card.style.display = "none";
      // Also hide the closest wrapper row so sibling elements like
      // "Add to Cart" buttons don't remain visible (see todo #2)
      const wrapper = card.closest('.s-main-slot > div, .s-result-list > div, .sg-col-inner');
      if (wrapper && wrapper !== card) {
        wrapper.style.display = "none";
        wrapper.dataset.hiddenByFilter = "true";
      }
      hidden++;
    }
  }

  let sorted = false;
  if (enabled && sortBy !== "none") {
    sorted = sortCards(cards, sortBy);
  }

  return { hidden, sorted };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "applyFilter") {
    const result = applyFilter(message);
    sendResponse(result);
  }
  return true;
});

// NOTE: No auto-apply on page load. The filter only runs when the user
// clicks Apply or toggles enabled in the popup. This prevents the toggle
// from appearing to auto-enable on every page reload.
