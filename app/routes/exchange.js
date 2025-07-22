// routes/exchange.js
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/rates", async (req, res) => {
  try {
    const base = req.query.base || "USD";
    const symbols = req.query.symbols || "INR";
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${symbols}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({ error: "Failed to fetch exchange rate" });
  }
});

module.exports = router;
