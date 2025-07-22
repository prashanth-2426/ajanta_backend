const express = require("express");
const router = express.Router();
const {
  getQuoteSummary,
  getQuoteSummaryById,
  updateRfqStatus,
} = require("../controllers/quoteSummary");
const { verifyToken } = require("../middlewares/auth");

router.use(verifyToken);
router.get("/quotes-summary", getQuoteSummary);
router.get("/quotes-summary/:rfq_id", getQuoteSummaryById);
router.post("/update-rfq-status", updateRfqStatus);

module.exports = router;
