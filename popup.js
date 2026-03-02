const FILTER_KEYS = ["review_count", "rating", "best_seller", "prime", "amazons_choice", "limited_time_deal"];
const THRESHOLD_KEYS = ["review_count", "rating"]; // filters that need a numeric value
const PRO_SORT_VALUES = ["magic_score_desc", "price_desc", "price_asc"];

const enabledEl = document.getElementById("enabled");
const filterSettings = document.getElementById("filterSettings");
const sortByEl = document.getElementById("sortBy");
const statusEl = document.getElementById("status");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userInfoEl = document.getElementById("userInfo");
const userEmailEl = document.getElementById("userEmail");

let debounceTimer = null;
let isSignedIn = false;

// --- Auth ---

function updateAuthUI(user) {
  isSignedIn = !!user;
  if (user) {
    signInBtn.style.display = "none";
    userInfoEl.style.display = "flex";
    userEmailEl.textContent = user.email;
  } else {
    signInBtn.style.display = "flex";
    userInfoEl.style.display = "none";
    userEmailEl.textContent = "";
  }
  updateProOptions();
}

function updateProOptions() {
  for (const option of sortByEl.options) {
    if (PRO_SORT_VALUES.includes(option.value)) {
      option.classList.toggle("locked", !isSignedIn);
      // Update label: add/remove lock prefix
      const cleanText = option.textContent.replace(/^\u{1F512}\s*/u, "");
      option.textContent = isSignedIn ? cleanText : "\u{1F512} " + cleanText;
    }
  }
}

function getRedirectURL() {
  return chrome.identity.getRedirectURL();
}

function signIn() {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const redirectUrl = getRedirectURL();
  const scopes = manifest.oauth2.scopes.join(" ");

  const authUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
    "?client_id=" + encodeURIComponent(clientId) +
    "&response_type=token" +
    "&redirect_uri=" + encodeURIComponent(redirectUrl) +
    "&scope=" + encodeURIComponent(scopes);

  chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
    if (chrome.runtime.lastError || !responseUrl) {
      const err = chrome.runtime.lastError?.message || "Unknown error";
      statusEl.textContent = "Sign-in failed: " + err;
      setTimeout(() => { statusEl.textContent = ""; }, 5000);
      return;
    }
    // Extract access token from redirect URL fragment
    const hashParams = new URLSearchParams(responseUrl.split("#")[1]);
    const token = hashParams.get("access_token");
    if (!token) {
      statusEl.textContent = "Sign-in failed. No token received.";
      setTimeout(() => { statusEl.textContent = ""; }, 3000);
      return;
    }
    // Fetch user profile
    fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(r => r.json())
      .then(profile => {
        const user = { email: profile.email, token };
        chrome.storage.local.set({ user });
        updateAuthUI(user);
      })
      .catch(() => {
        const user = { email: "Signed in", token };
        chrome.storage.local.set({ user });
        updateAuthUI(user);
      });
  });
}

function signOut() {
  chrome.storage.local.get("user", (data) => {
    // Revoke the token so the user has to re-consent next time
    if (data.user?.token) {
      fetch("https://accounts.google.com/o/oauth2/revoke?token=" + data.user.token);
    }
    chrome.storage.local.remove("user");
    updateAuthUI(null);
    // Reset sort to "none" if a pro option was selected
    if (PRO_SORT_VALUES.includes(sortByEl.value)) {
      sortByEl.value = "none";
      saveAndApply();
    }
  });
}

signInBtn.addEventListener("click", signIn);
signOutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  signOut();
});

// --- UI ---

function updateUI() {
  const disabled = !enabledEl.checked;
  filterSettings.classList.toggle("disabled", disabled);

  // Show/hide threshold inputs based on checkbox state
  for (const key of THRESHOLD_KEYS) {
    const cb = document.getElementById(`f_${key}`);
    const thRow = document.getElementById(`th_${key}`);
    thRow.classList.toggle("visible", cb.checked);
  }
}

// Gather current settings from the UI
function gatherSettings() {
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
  return {
    enabled: enabledEl.checked,
    filters,
    sortBy: sortByEl.value,
  };
}

// Save settings and send to content script
function saveAndApply() {
  const settings = gatherSettings();
  chrome.storage.local.set(settings, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "applyFilter", ...settings }, (response) => {
          if (chrome.runtime.lastError) {
            statusEl.textContent = "Reload the Amazon page and try again.";
          } else if (response) {
            if (!settings.enabled) {
              statusEl.textContent = "Filter disabled — all products restored.";
            } else {
              const parts = [];
              if (response.hidden > 0) parts.push(`${response.hidden} hidden`);
              if (response.sorted) parts.push("sorted");
              statusEl.textContent = parts.length ? `Done — ${parts.join(", ")}.` : "Done — no changes.";
            }
          }
          setTimeout(() => { statusEl.textContent = ""; }, 3000);
        });
      }
    });
  });
}

// Debounced version for number inputs (waits for user to stop typing)
function debouncedApply() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(saveAndApply, 400);
}

// Load saved settings
chrome.storage.local.get(["enabled", "filters", "sortBy", "user"], (data) => {
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

  updateAuthUI(data.user || null);
  updateUI();
});

// Toggle: immediate apply
enabledEl.addEventListener("change", () => {
  updateUI();
  saveAndApply();
});

// Filter checkboxes: immediate apply
for (const key of FILTER_KEYS) {
  document.getElementById(`f_${key}`).addEventListener("change", () => {
    updateUI();
    saveAndApply();
  });
}

// Threshold number inputs: debounced apply
for (const key of THRESHOLD_KEYS) {
  document.getElementById(`val_${key}`).addEventListener("input", debouncedApply);
}

// Sort dropdown: gate pro options behind sign-in
sortByEl.addEventListener("change", () => {
  if (PRO_SORT_VALUES.includes(sortByEl.value) && !isSignedIn) {
    sortByEl.value = "none";
    signIn();
    return;
  }
  saveAndApply();
});
