const express = require("express");
const router = express.Router();
const socks = require("../controllers/socks");

router.post("/auction", socks.createAuction);
router.get("/auction/:id", socks.getAuction);
router.post("/auction/:id/send-result", socks.sendAuctionResult);

module.exports = router;
