const {
  ROBLOX_API_KEY, UNIVERSE_ID,
  MIN_ROBUX, MAX_ROBUX,
  computeReceived, computeProductPrice,
  getOrCreateProduct,
} = require("./_helpers");

module.exports = async function handler(req, res) {
  console.log("[donate] handler called, method:", req.method);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("[donate] ENV check — API_KEY set:", !!ROBLOX_API_KEY, "UNIVERSE_ID:", UNIVERSE_ID);

  if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
    console.error("[donate] Missing env vars!");
    return res.status(500).json({ error: "Server not configured. Set ROBLOX_API_KEY and UNIVERSE_ID in Vercel env vars." });
  }

  try {
    console.log("[donate] req.body:", JSON.stringify(req.body));
    const { amount: rawAmount, coverTax } = req.body || {};
    const amount = Math.floor(Number(rawAmount));

    if (!Number.isFinite(amount) || amount < MIN_ROBUX || amount > MAX_ROBUX) {
      return res.status(400).json({ error: `Amount must be between ${MIN_ROBUX} and ${MAX_ROBUX.toLocaleString()}` });
    }

    const shouldCoverTax = coverTax === true;
    const price = computeProductPrice(amount, shouldCoverTax);
    const received = computeReceived(price);
    console.log("[donate] amount:", amount, "price:", price, "received:", received);

    console.log("[donate] calling getOrCreateProduct...");
    const product = await getOrCreateProduct(amount, price);
    console.log("[donate] product result:", JSON.stringify(product));

    if (!product) {
      return res.status(502).json({ error: "Could not create developer product. Try again shortly!" });
    }

    const productLink = `https://www.roblox.com/developer-product/${UNIVERSE_ID}/product/${product.id}`;

    return res.json({ productId: product.id, price, received, amount, coverTax: shouldCoverTax, productLink });
  } catch (err) {
    console.error("[donate] UNCAUGHT ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
