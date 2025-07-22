const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quote");
const { verifyToken } = require("../middlewares/auth");

// Protect all RFQ routes
router.use(verifyToken);

router.post("/", quoteController.createQuote);
router.get("/:rfqOrAuctionNumber", quoteController.getQuotesByRfq);

module.exports = router;
