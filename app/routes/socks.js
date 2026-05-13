const express = require("express");
const router = express.Router();
const socks = require("../controllers/socks");

router.post("/auction", socks.createAuction);
router.get("/auction/:id", socks.getAuction);
router.post("/auction/:id/send-result", socks.sendAuctionResult);
router.post("/auction/update-auction-data", socks.updateAuctionData);

module.exports = router;
