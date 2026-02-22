const HINTS = {
  review_count: "Products with fewer reviews will be hidden.",
  rating: "Products rated below this value will be hidden.",
  best_seller: "Only Best Seller badges will be kept.",
  prime: "Only Prime-eligible products will be kept.",
};

const enabledEl = document.getElementById("enabled");
const filterTypeEl = document.getElementById("filterType");
const thresholdEl = document.getElementById("threshold");
const thresholdGroup = document.getElementById("thresholdGroup");
const hintText = document.getElementById("hintText");
const filterSettings = document.getElementById("filterSettings");
const applyBtn = document.getElementById("applyBtn");
const statusEl = document.getElementById("status");

function updateUI() {
  const disabled = !enabledEl.checked;
  filterSettings.classList.toggle("disabled", disabled);
  applyBtn.disabled = disabled;

  const type = filterTypeEl.value;
  const isBool = type === "best_seller" || type === "prime";
  thresholdGroup.style.display = isBool ? "none" : "flex";
  thresholdGroup.style.flexDirection = "column";
  thresholdGroup.style.gap = "6px";
  hintText.textContent = HINTS[type];

  if (type === "review_count") {
    thresholdEl.placeholder = "e.g. 100";
    thresholdEl.min = 0;
    thresholdEl.step = 1;
  } else if (type === "rating") {
    thresholdEl.placeholder = "e.g. 4.0";
    thresholdEl.min = 0;
    thresholdEl.max = 5;
    thresholdEl.step = 0.1;
  }
}

// Load saved settings
chrome.storage.local.get(["enabled", "filterType", "threshold"], (data) => {
  enabledEl.checked = data.enabled ?? false;
  filterTypeEl.value = data.filterType ?? "review_count";
  thresholdEl.value = data.threshold ?? "";
  updateUI();
});

enabledEl.addEventListener("change", updateUI);
filterTypeEl.addEventListener("change", updateUI);

applyBtn.addEventListener("click", () => {
  const settings = {
    enabled: enabledEl.checked,
    filterType: filterTypeEl.value,
    threshold: parseFloat(thresholdEl.value) || 0,
  };

  chrome.storage.local.set(settings, () => {
    // Send message to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "applyFilter", ...settings }, (response) => {
          if (chrome.runtime.lastError) {
            statusEl.textContent = "Reload the Amazon page and try again.";
          } else if (response) {
            statusEl.textContent = `Done — ${response.hidden} product(s) hidden.`;
          }
          setTimeout(() => { statusEl.textContent = ""; }, 3000);
        });
      }
    });
  });
});
