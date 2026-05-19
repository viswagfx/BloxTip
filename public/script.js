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

  function getRobuxHTML(amount) {
    return `<span class="robux-amount" style="display: inline-flex; align-items: center; gap: 3px; font-variant-numeric: tabular-nums; vertical-align: middle;">
      <svg class="robux-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 1.15em; height: 1.15em; flex-shrink: 0; display: inline-block;">
        <path d="M19.4865 5.28457C20.1184 5.64792 20.6433 6.1714 21.0084 6.80227C21.3735 7.43313 21.5658 8.14908 21.566 8.87796V15.1331C21.5652 15.861 21.3725 16.5759 21.0074 17.2056C20.6423 17.8354 20.1178 18.3578 19.4865 18.7203L14.0798 21.852C13.4502 22.2148 12.7363 22.4058 12.0097 22.4058C11.283 22.4058 10.5691 22.2148 9.93952 21.852L4.51408 18.7203C3.8827 18.3579 3.35802 17.8356 2.99293 17.2058C2.62784 16.576 2.43525 15.8611 2.43457 15.1331V8.87796C2.43457 8.14904 2.62682 7.433 2.99193 6.8021C3.35703 6.1712 3.88207 5.64776 4.51408 5.28457L9.9208 2.15491C10.5523 1.78763 11.2698 1.59415 12.0003 1.59415C12.7308 1.59415 13.4483 1.78763 14.0798 2.15491L19.4865 5.28457ZM10.6549 3.57522L5.37292 6.62586C4.96415 6.86186 4.62477 7.20138 4.38894 7.61025C4.15311 8.01912 4.02915 8.4829 4.02955 8.95491V15.052C4.02936 15.524 4.15341 15.9877 4.38922 16.3965C4.62502 16.8053 4.96429 17.1449 5.37292 17.3811L10.6549 20.4296C11.0636 20.6656 11.5273 20.7899 11.9993 20.7899C12.4713 20.7899 12.9349 20.6656 13.3437 20.4296L18.6256 17.3811C19.0343 17.1449 19.3735 16.8053 19.6093 16.3965C19.8451 15.9877 19.9692 15.524 19.969 15.052V8.95491C19.9694 8.4829 19.8454 8.01912 19.6096 7.61025C19.3738 7.20138 19.0344 6.86186 18.6256 6.62586L13.3437 3.57522C12.9349 3.33923 12.4713 3.21499 11.9993 3.21499C11.5273 3.21499 11.0636 3.33923 10.6549 3.57522ZM13.1024 5.28041L17.2615 7.68433C17.5977 7.87844 17.8769 8.15761 18.0711 8.49379C18.2653 8.82997 18.3676 9.21132 18.3678 9.59955V14.4095C18.3679 14.7975 18.2656 15.1786 18.0714 15.5145C17.8772 15.8504 17.5978 16.1292 17.2615 16.3226L13.1024 18.7286C12.7668 18.9226 12.3859 19.0248 11.9982 19.0248C11.6105 19.0248 11.2297 18.9226 10.894 18.7286L6.73499 16.3226C6.3989 16.129 6.11982 15.8502 5.92594 15.5143C5.73207 15.1784 5.63025 14.7973 5.63077 14.4095V9.59955C5.63052 9.21148 5.73243 8.83018 5.92626 8.49398C6.1201 8.15779 6.39902 7.87854 6.73499 7.68433L10.894 5.28041C11.2297 5.08638 11.6105 4.98422 11.9982 4.98422C12.3859 4.98422 12.7668 5.08638 13.1024 5.28041ZM9.60887 14.3949H14.3917V9.61203H9.60887V14.3949Z" />
      </svg>
      <span>${amount}</span>
    </span>`;
  }

  function fmtRobux(n) {
    return Math.floor(n).toLocaleString("en-US");
  }

  function fmtCompact(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
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

    previewPrice.innerHTML = getRobuxHTML(fmtRobux(price));
    previewReceived.innerHTML = getRobuxHTML(fmtRobux(received));
    sendBtn.disabled = false;
    sendBtnText.innerHTML = `Send ${getRobuxHTML(fmtRobux(amount))}`;
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
      resultPriceTag.innerHTML = getRobuxHTML(fmtRobux(data.price));
      resultReceivedTag.innerHTML = getRobuxHTML(fmtRobux(data.received));
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
  
  inputHint.innerHTML = `Min: ${getRobuxHTML(MIN_ROBUX.toLocaleString())} · Max: ${getRobuxHTML(MAX_ROBUX.toLocaleString())}`;
  coverTaxToggle.setAttribute("aria-checked", String(coverTax));

  if (cfg.QuickAmounts && Array.isArray(cfg.QuickAmounts)) {
    quickAmounts.innerHTML = "";
    cfg.QuickAmounts.forEach(amt => {
      const btn = document.createElement("button");
      btn.className = "quick-btn";
      btn.dataset.amount = amt;
      btn.innerHTML = getRobuxHTML(fmtCompact(amt));
      quickAmounts.appendChild(btn);
    });
  }

  updatePreview();
})();
