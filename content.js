// Selectors for Amazon search result items
const PRODUCT_SELECTORS = [
  '[data-component-type="s-search-result"]',            // main search results
  '.s-result-item[data-asin]:not([data-asin=""])',      // fallback
];

function getProductCards() {
  for (const selector of PRODUCT_SELECTORS) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) return Array.from(cards);
  }
  return [];
}

function parseReviewCount(card) {
  const parent = card.querySelector('.a-row.a-size-small') || card;
  const spans = parent.querySelectorAll('span.a-size-base');
  for (const span of spans) {
    const text = span.textContent.trim().replace(/[(),]/g, "");
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  const ariaEl = card.querySelector('a[href*="customerReviews"] span, a[href*="#reviews"] span');
  if (ariaEl) {
    const num = parseInt(ariaEl.textContent.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) return num;
  }

  return 0;
}

function parseRating(card) {
  const ratingEl = card.querySelector('i.a-icon-star-small, i.a-icon-star, [data-cy="reviews-ratings-slot"] i');
  if (ratingEl) {
    const label = ratingEl.getAttribute("aria-label") || ratingEl.textContent;
    const match = label.match(/([\d.]+)\s*(out of|\/)/);
    if (match) return parseFloat(match[1]);
  }

  const altEl = card.querySelector('.a-icon-alt');
  if (altEl) {
    const match = altEl.textContent.match(/([\d.]+)/);
    if (match) return parseFloat(match[1]);
  }

  return 0;
}

function isBestSeller(card) {
  const text = card.textContent.toLowerCase();
  return text.includes("best seller") || text.includes("bestseller") ||
    !!card.querySelector('.a-badge-text, [data-a-badge-type="deal"]');
}

function isPrime(card) {
  return !!card.querySelector('.a-icon-prime, [aria-label="Amazon Prime"], i.a-icon-prime-tp');
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

  const [field, direction] = sortBy.split("_").length === 3
    ? [sortBy.substring(0, sortBy.lastIndexOf("_")), sortBy.substring(sortBy.lastIndexOf("_") + 1)]
    : [sortBy, "desc"];

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
