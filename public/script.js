(() => {
  "use strict";

  const cfg = window.BloxTipConfig || {};
  
  const RECEIVE_NUM = 7;
  const RECEIVE_DEN = 10;
  const MIN_ROBUX = cfg.MinRobux ?? 1;
  const MAX_ROBUX = cfg.MaxRobux ?? 1_000_000_000;

  function computeReceived(price) {
    return Math.max(1, Math.floor((Math.floor(price) * RECEIVE_NUM) / RECEIVE_DEN));
  }

  function computeProductPrice(amount, coverTax) {
    let price = Math.floor(amount);
    if (coverTax) {
      price = Math.floor((price * RECEIVE_DEN + RECEIVE_NUM - 1) / RECEIVE_NUM);
    }
    return Math.max(1, price);
  }

  function fmtRobux(n) {
    return "R$ " + Math.floor(n).toLocaleString("en-US");
  }

  function fmtCompact(n) {
    if (n >= 1_000_000) return "R$" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return "R$" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return "R$" + n;
  }

  const cardTitle = document.getElementById("cardTitle");
  const cardSubtitle = document.getElementById("cardSubtitle");
  const cardIconContainer = document.getElementById("cardIconContainer");
  const amountInput = document.getElementById("amountInput");
  const inputHint = document.getElementById("inputHint");
  const quickAmounts = document.getElementById("quickAmounts");
  const coverTaxToggle = document.getElementById("coverTaxToggle");
  const previewPrice = document.getElementById("previewPrice");
  const previewReceived = document.getElementById("previewReceived");
  const sendBtn = document.getElementById("sendBtn");
  const sendBtnText = document.getElementById("sendBtnText");
  const sendSpinner = document.getElementById("sendSpinner");
  const resultPanel = document.getElementById("result");
  const resultLink = document.getElementById("resultLink");
  const resultProductId = document.getElementById("resultProductId");
  const resultPriceTag = document.getElementById("resultPriceTag");
  const resultReceivedTag = document.getElementById("resultReceivedTag");
  const resetBtn = document.getElementById("resetBtn");
  const errorToast = document.getElementById("errorToast");
  const errorText = document.getElementById("errorText");
  const customFooterP = document.getElementById("customFooterP");
  const githubCorner = document.getElementById("githubCorner");

  const inputGroup = document.getElementById("inputGroup");
  const quickAmountsEl = document.getElementById("quickAmounts");
  const toggleRow = document.getElementById("toggleRow");
  const preview = document.getElementById("preview");

  let coverTax = cfg.DefaultCoverTax ?? true;
  let currentAmount = null;
  let sending = false;
  let errorTimer = null;

  function parseAmount(text) {
    const digits = text.replace(/[^\d]/g, "");
    if (!digits) return null;
    const n = parseInt(digits, 10);
    if (!Number.isFinite(n) || n < MIN_ROBUX) return null;
    return Math.min(n, MAX_ROBUX);
  }

  function showError(msg) {
    errorText.textContent = msg;
    errorToast.hidden = false;
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      errorToast.hidden = true;
    }, 5000);
  }

  function hideError() {
    errorToast.hidden = true;
    clearTimeout(errorTimer);
  }

  function updatePreview() {
    const amount = parseAmount(amountInput.value);
    currentAmount = amount;

    document.querySelectorAll(".quick-btn").forEach((btn) => {
      btn.classList.toggle("active", amount === Number(btn.dataset.amount));
    });

    if (amount == null) {
      previewPrice.textContent = "—";
      previewReceived.textContent = "—";
      sendBtn.disabled = true;
      sendBtnText.textContent = "Enter an amount";
      return;
    }

    const price = computeProductPrice(amount, coverTax);
    const received = computeReceived(price);

    previewPrice.textContent = fmtRobux(price);
    previewReceived.textContent = fmtRobux(received);
    sendBtn.disabled = false;
    sendBtnText.textContent = `Send ${fmtRobux(amount)}`;
  }

  amountInput.addEventListener("input", () => {
    hideError();
    updatePreview();
  });

  amountInput.addEventListener("blur", () => {
    if (currentAmount != null) {
      amountInput.value = currentAmount.toLocaleString("en-US");
    }
  });

  amountInput.addEventListener("focus", () => {
    if (currentAmount != null) {
      amountInput.value = String(currentAmount);
    }
  });

  quickAmounts.addEventListener("click", (e) => {
    const btn = e.target.closest(".quick-btn");
    if (!btn) return;
    const val = Number(btn.dataset.amount);
    amountInput.value = val.toLocaleString("en-US");
    hideError();
    updatePreview();
  });

  coverTaxToggle.addEventListener("click", () => {
    coverTax = !coverTax;
    coverTaxToggle.setAttribute("aria-checked", String(coverTax));
    updatePreview();
  });

  function setLoading(loading) {
    sending = loading;
    sendBtn.disabled = loading;
    sendSpinner.hidden = !loading;
    sendBtnText.style.opacity = loading ? "0" : "1";
    if (loading) sendBtn.classList.add("btn-send--loading");
    else sendBtn.classList.remove("btn-send--loading");
  }

  function showFormSections(show) {
    const display = show ? "" : "none";
    inputGroup.style.display = display;
    quickAmountsEl.style.display = display;
    toggleRow.style.display = display;
    preview.style.display = display;
    sendBtn.style.display = display;
    if (show) {
      resultPanel.hidden = true;
      resultPanel.style.display = "none";
    }
  }

  sendBtn.addEventListener("click", async () => {
    if (sending) return;
    hideError();

    const amount = currentAmount;
    if (amount == null) {
      showError("Enter a Robux amount!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, coverTax }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setLoading(false);
      hideError();
      showFormSections(false);

      resultLink.href = data.productLink;
      resultProductId.textContent = data.productId;
      resultPriceTag.textContent = fmtRobux(data.price);
      resultReceivedTag.textContent = fmtRobux(data.received);
      resultPanel.hidden = false;
      resultPanel.style.display = "";

      // Open the Roblox product purchase link in a new focused tab automatically
      const opened = window.open(data.productLink, "_blank");
      if (!opened) {
        showError("Popup blocked! Click 'Purchase Product' below to open.");
      } else {
        amountInput.value = "";
        currentAmount = null;
        updatePreview();
      }
    } catch (err) {
      showError("Network error — check your connection and try again.");
      setLoading(false);
    }
  });

  resetBtn.addEventListener("click", () => {
    resultPanel.hidden = true;
    resultPanel.style.display = "none";
    hideError();
    showFormSections(true);
    amountInput.value = "";
    currentAmount = null;
    updatePreview();
    amountInput.focus();
  });

  // Apply visual configurations from config.js
  if (cfg.Title) cardTitle.textContent = cfg.Title;
  if (cfg.Username) cardSubtitle.textContent = `Donating robux to ${cfg.Username}`;
  
  const iconType = cfg.IconType || "group";

  if (iconType === "custom" && cfg.CardIconUrl && cardIconContainer) {
    cardIconContainer.innerHTML = `<img src="${cfg.CardIconUrl}" alt="Icon" style="width: 100%; height: 100%; object-fit: contain; border-radius: inherit;" />`;
  } else if (cardIconContainer) {
    const cacheKey = `bloxtip_owner_${iconType}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const owner = JSON.parse(cached);
        if (owner.thumbnailUrl) {
          cardIconContainer.innerHTML = `<img src="${owner.thumbnailUrl}" alt="${owner.name || 'Owner'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" />`;
        }
        if (owner.name && !cfg.Username) {
          cardSubtitle.textContent = `Donating robux to ${owner.name}`;
        }
      }
    } catch (e) {
      console.warn("Could not read owner details from localStorage:", e);
    }

    // Fetch fresh owner details in background to update cache/UI
    fetch(`/api/owner?iconType=${encodeURIComponent(iconType)}`)
      .then(res => res.json())
      .then(owner => {
        if (owner.thumbnailUrl) {
          cardIconContainer.innerHTML = `<img src="${owner.thumbnailUrl}" alt="${owner.name || 'Owner'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" />`;
        }
        if (owner.name && !cfg.Username) {
          cardSubtitle.textContent = `Donating robux to ${owner.name}`;
        }
        try {
          localStorage.setItem(cacheKey, JSON.stringify(owner));
        } catch (e) { }
      })
      .catch(err => console.warn("Could not fetch owner details from backend:", err));
  }

  if (cfg.AccentColor) {
    document.documentElement.style.setProperty('--accent', cfg.AccentColor);
    document.documentElement.style.setProperty('--accent-dim', cfg.AccentColor);
    
    // Remove transparency bytes if present in hex string before appending 1A (10% transparency)
    const baseHex = cfg.AccentColor.length === 9 ? cfg.AccentColor.substring(0, 7) : cfg.AccentColor;
    document.documentElement.style.setProperty('--accent-subtle', `${baseHex}1A`);
  }

  if (cfg.ShowCredits !== false) {
    customFooterP.innerHTML = `<a href="https://x.com/Vis3d_" target="_blank" rel="noopener">Made with ❤️ by Viswa</a>`;
  } else {
    customFooterP.style.display = "none";
  }

  if (cfg.ShowGithub !== false) {
    githubCorner.href = "https://github.com/viswagfx/BloxTip";
    githubCorner.hidden = false;
  } else {
    githubCorner.hidden = true;
  }
  
  inputHint.textContent = `Min: R$${MIN_ROBUX.toLocaleString()} · Max: R$${MAX_ROBUX.toLocaleString()}`;
  coverTaxToggle.setAttribute("aria-checked", String(coverTax));

  if (cfg.QuickAmounts && Array.isArray(cfg.QuickAmounts)) {
    quickAmounts.innerHTML = "";
    cfg.QuickAmounts.forEach(amt => {
      const btn = document.createElement("button");
      btn.className = "quick-btn";
      btn.dataset.amount = amt;
      btn.textContent = fmtCompact(amt);
      quickAmounts.appendChild(btn);
    });
  }

  updatePreview();
})();
