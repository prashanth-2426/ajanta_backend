const express = require("express");
const router = express.Router();
const dashboard = require("../controllers/dashboard");

router.get("/summary", dashboard.getSummary);
router.get("/auction-activity", dashboard.getAuctionActivity);
router.get("/notifications", dashboard.getNotifications);

router.get("/summary/vendor", dashboard.getVendorSummary);
router.get("/auction-activity/vendor", dashboard.getVendorAuctionActivity);
router.get("/notifications/vendor", dashboard.getVendorNotifications);

module.exports = router;
