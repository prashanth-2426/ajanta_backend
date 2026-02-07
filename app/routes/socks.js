const express = require("express");
const router = express.Router();
const socks = require("../controllers/socks");

router.post("/auction", socks.createAuction);
router.get("/auction/:id", socks.getAuction);

module.exports = router;
