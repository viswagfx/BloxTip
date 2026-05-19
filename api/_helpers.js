const fs = require("fs");
const path = require("path");

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;
const PRODUCT_NAME_TEMPLATE = process.env.PRODUCT_NAME_TEMPLATE || "Donate {receiving} Robux";
const PRODUCT_DESCRIPTION_TEMPLATE = process.env.PRODUCT_DESCRIPTION_TEMPLATE || "Donated {receiving} Robux via BloxTip.";

const MIN_ROBUX = 1;
const MAX_ROBUX = 1_000_000_000;
const RECEIVE_NUM = 7;
const RECEIVE_DEN = 10;
const PAGE_LIMIT = 100;
const MAX_RETRIES = 2;
const OC_BASE = "https://apis.rotunnel.com/developer-products/v2";

let PRODUCT_ICON = null;
try {
  const iconPath = path.join(__dirname, "..", "public", "Cash.png");
  PRODUCT_ICON = fs.readFileSync(iconPath);
  console.log(`[helpers] Loaded product icon: ${iconPath} (${PRODUCT_ICON.length} bytes)`);
} catch (e) {
  console.warn("[helpers] No product icon found at public/Cash.png — products will have no icon");
}

let cachedProducts = null;
let lastCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

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

function fmtInt(n) {
  return Math.floor(n).toLocaleString("en-US");
}

function fillTemplate(tpl, amount, price) {
  return tpl
    .replace(/\{amount\}/g, fmtInt(amount))
    .replace(/\{price\}/g, fmtInt(price))
    .replace(/\{receiving\}/g, fmtInt(computeReceived(price)));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Builds multipart/form-data payload required by the Roblox developer-products API (which supports binary icons)
function buildMultipart(fields, files) {
  const boundary = "WDBoundary" + Date.now();
  const parts = [];

  for (const [name, value] of Object.entries(fields)) {
    if (value != null) {
      parts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`)
      );
    }
  }

  if (files) {
    for (const [name, { buffer, filename, contentType }] of Object.entries(files)) {
      parts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`)
      );
      parts.push(buffer);
      parts.push(Buffer.from("\r\n"));
    }
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function robloxRequest(method, urlPath, fields, files) {
  const url = `${OC_BASE}${urlPath}`;
  const headers = { "x-api-key": ROBLOX_API_KEY, Accept: "application/json" };
  const opts = { method, headers };

  if (fields) {
    const { body, contentType } = buildMultipart(fields, files);
    headers["Content-Type"] = contentType;
    opts.body = body;
  }

  console.log(`[roblox] ${method} ${url}`);

  const maxAttempts = method === "POST" ? 1 : MAX_RETRIES;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, opts);
      console.log(`[roblox] Response: ${res.status} ${res.statusText}`);
      if (res.ok) {
        const text = await res.text();
        return { ok: true, data: text ? JSON.parse(text) : {} };
      }
      const errText = await res.text().catch(() => "");
      console.warn(`[roblox] ERROR ${res.status}:`, errText.substring(0, 500));
      if (res.status !== 429 && res.status < 500)
        return { ok: false, error: errText, retryable: false };
      if (attempt < maxAttempts) {
        const ra = res.headers.get("retry-after");
        await sleep(ra ? Math.min(parseFloat(ra) * 1000, 30000) : 500 * 2 ** (attempt - 1));
      }
    } catch (e) {
      console.error(`[roblox] FETCH ERROR:`, e.message);
      if (attempt < maxAttempts) await sleep(500 * 2 ** (attempt - 1));
    }
  }
  return { ok: false, error: "Request failed after retries", retryable: true };
}

function extractId(entry) {
  const raw = entry?.productId ?? entry?.id ?? entry?.Id ?? entry?.path;
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return null;
  const n = parseInt(raw, 10);
  if (!isNaN(n)) return n;
  const m = raw.match(/developer-?[Pp]roducts\/(\d+)/) || raw.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

function extractPrice(entry) {
  const pi = entry?.priceInformation;
  if (pi) {
    const p = pi.defaultPriceInRobux ?? pi.priceInRobux;
    if (p != null) return Math.floor(Number(p));
  }
  const p = entry?.priceInRobux ?? entry?.PriceInRobux ?? entry?.basePrice ?? entry?.price ?? entry?.Price;
  return p != null ? Math.floor(Number(p)) : null;
}

function readProduct(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = extractId(entry);
  const price = extractPrice(entry);
  if (id == null || price == null) return null;
  return {
    id, priceInRobux: price,
    name: String(entry.name || entry.displayName || entry.Name || ""),
    description: String(entry.description || entry.Description || ""),
    isForSale: entry.isForSale === true || entry.IsForSale === true,
    storePageEnabled: entry.storePageEnabled === true,
    hasIcon: entry.iconImageAssetId != null && entry.iconImageAssetId !== null,
    isRegionalPricingEnabled: entry.isRegionalPricingEnabled === true ||
      entry.priceConfiguration?.isRegionalPricingEnabled === true,
  };
}

async function findExisting(price) {
  const now = Date.now();
  if (cachedProducts && (now - lastCacheTime < CACHE_TTL)) {
    console.log(`[cache] findExisting hit in-memory cache for price ${price}`);
    const found = cachedProducts.find(p => p.priceInRobux === price);
    if (found) return found;
  }

  console.log(`[cache] Cache miss or expired for price ${price}. Fetching fresh list from Roblox...`);
  const freshList = [];
  let cursor = null;
  do {
    let url = `/universes/${UNIVERSE_ID}/developer-products/creator?pageSize=${PAGE_LIMIT}`;
    if (cursor) url += `&pageToken=${encodeURIComponent(cursor)}`;
    const r = await robloxRequest("GET", url);
    if (!r.ok || !r.data) return null;
    const items = r.data.developerProducts || r.data.developer_products || r.data.data || [];
    for (const e of Array.isArray(items) ? items : Object.values(items)) {
      const p = readProduct(e);
      if (p) freshList.push(p);
    }
    cursor = r.data.nextPageToken || null;
  } while (cursor);

  cachedProducts = freshList;
  lastCacheTime = now;
  console.log(`[cache] Loaded ${freshList.length} developer products into cache`);

  return cachedProducts.find(p => p.priceInRobux === price) || null;
}

async function createProduct(amount, price) {
  const name = fillTemplate(PRODUCT_NAME_TEMPLATE, amount, price);
  const desc = fillTemplate(PRODUCT_DESCRIPTION_TEMPLATE, amount, price);

  const fields = {
    name,
    description: desc,
    price,
    isForSale: true,
    storePageEnabled: true,
  };

  const files = PRODUCT_ICON ? {
    imageFile: {
      buffer: PRODUCT_ICON,
      filename: "Cash.png",
      contentType: "image/png",
    },
  } : null;

  const r = await robloxRequest("POST", `/universes/${UNIVERSE_ID}/developer-products`, fields, files);
  if (!r.ok || !r.data) return { product: null, shouldRecover: r.retryable !== false };
  let product = readProduct(r.data);
  if (!product) {
    const id = extractId(r.data);
    if (id != null) product = { id, priceInRobux: price, name, description: desc, isForSale: true, storePageEnabled: true, hasIcon: !!PRODUCT_ICON, isRegionalPricingEnabled: false };
  }

  if (product && product.priceInRobux === price && cachedProducts) {
    cachedProducts.push(product);
  }

  return product?.priceInRobux === price
    ? { product, shouldRecover: false }
    : { product: null, shouldRecover: true };
}

function patchBody(product, amount) {
  const expName = fillTemplate(PRODUCT_NAME_TEMPLATE, amount, product.priceInRobux);
  const expDesc = fillTemplate(PRODUCT_DESCRIPTION_TEMPLATE, amount, product.priceInRobux);
  const body = {};
  if (product.name !== expName) body.name = expName;
  if (product.description !== expDesc) body.description = expDesc;
  if (!product.isForSale) body.isForSale = true;
  if (!product.storePageEnabled) body.storePageEnabled = true;
  if (product.isRegionalPricingEnabled) body.isRegionalPricingEnabled = false;

  const needsIcon = !product.hasIcon && PRODUCT_ICON;

  const hasFieldChanges = Object.keys(body).length > 0;
  return (hasFieldChanges || needsIcon) ? { fields: body, needsIcon } : null;
}

async function updateProduct(product, amount) {
  const patch = patchBody(product, amount);
  if (!patch) return product;

  const { fields, needsIcon } = patch;

  if (Object.keys(fields).length === 0 && needsIcon) {
    fields.name = fillTemplate(PRODUCT_NAME_TEMPLATE, amount, product.priceInRobux);
  }

  const files = needsIcon ? {
    imageFile: {
      buffer: PRODUCT_ICON,
      filename: "Cash.png",
      contentType: "image/png",
    },
  } : null;

  const r = await robloxRequest("PATCH", `/universes/${UNIVERSE_ID}/developer-products/${product.id}`, fields, files);
  if (!r.ok) return null;
  const updated = r.data ? readProduct(r.data) : null;
  const finalProduct = updated || {
    ...product,
    ...fields,
    storePageEnabled: fields.storePageEnabled ?? product.storePageEnabled,
    hasIcon: needsIcon ? true : product.hasIcon,
  };

  if (cachedProducts) {
    const idx = cachedProducts.findIndex(p => p.id === product.id);
    if (idx !== -1) cachedProducts[idx] = finalProduct;
  }

  return finalProduct;
}

async function getOrCreateProduct(amount, price) {
  let product = await findExisting(price);
  if (product) {
    if (patchBody(product, amount)) product = await updateProduct(product, amount);
    return product;
  }
  const { product: created, shouldRecover } = await createProduct(amount, price);
  if (created) {
    // The Roblox create endpoint ignores storePageEnabled, so we PATCH it right after
    if (patchBody(created, amount)) {
      const patched = await updateProduct(created, amount);
      return patched || created;
    }
    return created;
  }
  if (shouldRecover) {
    await sleep(1500);
    const recovered = await findExisting(price);
    if (recovered && patchBody(recovered, amount)) {
      const patched = await updateProduct(recovered, amount);
      return patched || recovered;
    }
    return recovered;
  }
  return null;
}

async function getUniverseDetails() {
  try {
    const res = await fetch(`https://games.rotunnel.com/v1/games?universeIds=${UNIVERSE_ID}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.data && data.data.length > 0) {
      return data.data[0];
    }
  } catch (e) {
    console.error("Failed to fetch universe details:", e);
  }
  return null;
}

module.exports = {
  ROBLOX_API_KEY, UNIVERSE_ID,
  MIN_ROBUX, MAX_ROBUX,
  computeReceived, computeProductPrice,
  getOrCreateProduct,
  getUniverseDetails,
};
