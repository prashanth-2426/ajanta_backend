const express = require("express");
const router = express.Router();
const {
  getQuoteSummary,
  getQuoteSummaryById,
  updateRfqStatus,
  getPreviousAuctionsByCountryAndWeight,
} = require("../controllers/quoteSummary");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.use(verifyToken);
router.get("/quotes-summary", getQuoteSummary);
router.get("/quotes-summary/:rfq_id", getQuoteSummaryById);
router.post("/update-rfq-status", upload.single("attachment"), updateRfqStatus);
router.get(
  "/previous-auctions/:country/:totalGrossWeight",
  getPreviousAuctionsByCountryAndWeight
);

module.exports = router;
