const FILTER_KEYS = ["review_count", "rating", "best_seller", "prime"];
const THRESHOLD_KEYS = ["review_count", "rating"]; // filters that need a numeric value

const enabledEl = document.getElementById("enabled");
const filterSettings = document.getElementById("filterSettings");
const sortByEl = document.getElementById("sortBy");
const applyBtn = document.getElementById("applyBtn");
const statusEl = document.getElementById("status");

function updateUI() {
  const disabled = !enabledEl.checked;
  filterSettings.classList.toggle("disabled", disabled);
  applyBtn.disabled = disabled;

  // Show/hide threshold inputs based on checkbox state
  for (const key of THRESHOLD_KEYS) {
    const cb = document.getElementById(`f_${key}`);
    const thRow = document.getElementById(`th_${key}`);
    thRow.classList.toggle("visible", cb.checked);
  }
}

// Load saved settings
chrome.storage.local.get(["enabled", "filters", "sortBy"], (data) => {
  enabledEl.checked = data.enabled ?? false;
  sortByEl.value = data.sortBy ?? "none";

  const filters = data.filters ?? {};
  for (const key of FILTER_KEYS) {
    const cb = document.getElementById(`f_${key}`);
    cb.checked = !!filters[key]?.active;
    const valEl = document.getElementById(`val_${key}`);
    if (valEl && filters[key]?.value != null) {
      valEl.value = filters[key].value;
    }
  }
  updateUI();
});

enabledEl.addEventListener("change", updateUI);
for (const key of FILTER_KEYS) {
  document.getElementById(`f_${key}`).addEventListener("change", updateUI);
}

applyBtn.addEventListener("click", () => {
  // Build filters object
  const filters = {};
  for (const key of FILTER_KEYS) {
    const cb = document.getElementById(`f_${key}`);
    if (!cb.checked) continue;
    const valEl = document.getElementById(`val_${key}`);
    filters[key] = {
      active: true,
      value: valEl ? parseFloat(valEl.value) || 0 : 0,
    };
  }

  const settings = {
    enabled: enabledEl.checked,
    filters,
    sortBy: sortByEl.value,
  };

  chrome.storage.local.set(settings, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "applyFilter", ...settings }, (response) => {
          if (chrome.runtime.lastError) {
            statusEl.textContent = "Reload the Amazon page and try again.";
          } else if (response) {
            const parts = [];
            if (response.hidden > 0) parts.push(`${response.hidden} hidden`);
            if (response.sorted) parts.push("sorted");
            statusEl.textContent = parts.length ? `Done — ${parts.join(", ")}.` : "Done — no changes.";
          }
          setTimeout(() => { statusEl.textContent = ""; }, 3000);
        });
      }
    });
  });
});
