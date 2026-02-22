// Selectors for Amazon search result items
const PRODUCT_SELECTORS = [
  '[data-component-type="s-search-result"]',            // main search results
  '.s-result-item[data-asin]:not([data-asin=""])',      // fallback
  '.sg-col-inner .s-result-item',                       // grid layout fallback
];

function getProductCards() {
  for (const selector of PRODUCT_SELECTORS) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) return Array.from(cards);
  }
  return [];
}

function parseReviewCount(card) {
  // Try links that point to reviews section — the text inside is the count
  const reviewLinks = card.querySelectorAll('a[href*="#customerReviews"], a[href*="#reviews"], a[href*="product-reviews"]');
  for (const link of reviewLinks) {
    const text = link.textContent.trim().replace(/[(),.\s]/g, "").replace(/,/g, "");
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Look in the ratings row for a plain number span
  const row = card.querySelector('.a-row.a-size-small, [data-cy="reviews-ratings-slot"]') || card;
  const spans = row.querySelectorAll('span.a-size-base, span.a-size-small');
  for (const span of spans) {
    const text = span.textContent.trim().replace(/[(),.\s]/g, "").replace(/,/g, "");
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // aria-label fallback: "1,234 ratings"
  const allLinks = card.querySelectorAll('a');
  for (const a of allLinks) {
    const label = a.getAttribute("aria-label") || "";
    const match = label.match(/([\d,]+)\s*(rating|review|customer)/i);
    if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  }

  return 0;
}

function parseRating(card) {
  // Primary: .a-icon-alt text like "4.5 out of 5 stars"
  const altEls = card.querySelectorAll('.a-icon-alt, i.a-icon-star-small span, i.a-icon-star span');
  for (const el of altEls) {
    const match = el.textContent.match(/([\d.]+)\s*(out of|\/|von|sur|su)/);
    if (match) return parseFloat(match[1]);
  }

  // aria-label on star icons: "4.5 out of 5 stars"
  const starIcons = card.querySelectorAll('i[class*="a-icon-star"], [data-cy="reviews-ratings-slot"] i, span[class*="a-icon-star"]');
  for (const icon of starIcons) {
    const label = icon.getAttribute("aria-label") || icon.className || "";
    const match = label.match(/([\d.]+)\s*(out of|\/|von|sur|su)/);
    if (match) return parseFloat(match[1]);
    // class-based: "a-star-small-4-5" means 4.5
    const classMatch = label.match(/a-star(?:-small)?-([\d])(?:-([\d]))?/);
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
  // Badge text, badge images, or textual mentions
  if (card.querySelector('.a-badge-text, [data-a-badge-type], .a-badge-label, span.a-badge-text')) {
    const badgeText = (card.querySelector('.a-badge-text, .a-badge-label') || {}).textContent || "";
    if (/best\s*seller/i.test(badgeText)) return true;
  }
  // Fallback: plain text scan
  const text = card.textContent.toLowerCase();
  return text.includes("best seller") || text.includes("bestseller") ||
    text.includes("#1 best") || text.includes("amazon's choice");
}

function isPrime(card) {
  // Multiple selectors for Prime badge across Amazon regions
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
  return true;
}

// Sort visible cards in-place within the DOM
function sortCards(cards, sortBy) {
  if (sortBy === "none") return false;

  // sortBy format: "review_count_desc", "rating_asc", etc.
  const lastUnderscore = sortBy.lastIndexOf("_");
  const field = sortBy.substring(0, lastUnderscore);
  const direction = sortBy.substring(lastUnderscore + 1);

  const getValue = field === "review_count" ? parseReviewCount : parseRating;
  const multiplier = direction === "asc" ? 1 : -1;

  // Only sort visible cards
  const visibleCards = cards.filter(c => c.style.display !== "none");
  if (visibleCards.length === 0) return false;

  const parent = visibleCards[0].parentNode;

  // Store original order data attributes for potential reset
  visibleCards.forEach((card, i) => {
    if (!card.dataset.originalOrder) {
      card.dataset.originalOrder = i;
    }
  });

  const sorted = [...visibleCards].sort((a, b) => {
    return (getValue(a) - getValue(b)) * multiplier;
  });

  // Re-append in sorted order (hidden cards stay in place at the end)
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

  for (const card of cards) {
    card.style.display = "";

    if (!enabled) continue;

    if (hasActiveFilter && !passesFilters(card, filters)) {
      card.style.display = "none";
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

// Auto-apply saved settings on page load
chrome.storage.local.get(["enabled", "filters", "sortBy"], (data) => {
  if (data.enabled) {
    applyFilter(data);
  }
});
