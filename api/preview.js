const { MIN_ROBUX, MAX_ROBUX, computeReceived, computeProductPrice } = require("./_helpers");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount: rawAmount, coverTax } = req.body || {};
  const amount = Math.floor(Number(rawAmount));

  if (!Number.isFinite(amount) || amount < MIN_ROBUX || amount > MAX_ROBUX) {
    return res.json({ price: 0, received: 0 });
  }

  const price = computeProductPrice(amount, coverTax === true);
  const received = computeReceived(price);

  return res.json({ price, received, amount });
};
