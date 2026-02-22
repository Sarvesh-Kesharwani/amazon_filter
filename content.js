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
  // Amazon shows review count as e.g. "1,234" or "(1,234)"
  const reviewLink = card.querySelector('[data-csa-c-slot-id="alf-reviews"]') ||
    card.querySelector('.a-size-base.s-underline-text') ||
    card.querySelector('span.a-size-base:not(.a-color-price)');

  if (!reviewLink) return 0;

  // Look for the count near the star rating
  const parent = card.querySelector('.a-row.a-size-small') || card;
  const spans = parent.querySelectorAll('span.a-size-base');
  for (const span of spans) {
    const text = span.textContent.trim().replace(/[(),]/g, "");
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Broader search: any aria-label with count
  const ariaEl = card.querySelector('a[href*="customerReviews"] span, a[href*="#reviews"] span');
  if (ariaEl) {
    const num = parseInt(ariaEl.textContent.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) return num;
  }

  return 0;
}

function parseRating(card) {
  // Rating is in aria-label like "4.5 out of 5 stars"
  const ratingEl = card.querySelector('i.a-icon-star-small, i.a-icon-star, [data-cy="reviews-ratings-slot"] i');
  if (ratingEl) {
    const label = ratingEl.getAttribute("aria-label") || ratingEl.textContent;
    const match = label.match(/([\d.]+)\s*(out of|\/)/);
    if (match) return parseFloat(match[1]);
  }

  // Fallback: look for the span with class a-icon-alt
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

function applyFilter(settings) {
  const { enabled, filterType, threshold } = settings;
  const cards = getProductCards();
  let hidden = 0;

  for (const card of cards) {
    // Reset visibility first
    card.style.display = "";

    if (!enabled) continue;

    let shouldHide = false;

    switch (filterType) {
      case "review_count":
        shouldHide = parseReviewCount(card) < threshold;
        break;
      case "rating":
        shouldHide = parseRating(card) < threshold;
        break;
      case "best_seller":
        shouldHide = !isBestSeller(card);
        break;
      case "prime":
        shouldHide = !isPrime(card);
        break;
    }

    if (shouldHide) {
      card.style.display = "none";
      hidden++;
    }
  }

  return hidden;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "applyFilter") {
    const hidden = applyFilter(message);
    sendResponse({ hidden });
  }
  return true;
});

// Auto-apply saved filter on page load
chrome.storage.local.get(["enabled", "filterType", "threshold"], (data) => {
  if (data.enabled) {
    applyFilter(data);
  }
});
