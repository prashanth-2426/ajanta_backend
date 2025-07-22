const express = require("express");
const router = express.Router();

const auth = require("./auth");
const users = require("./user");
const rfq = require("./rfq");
const quote = require("./quote");
const vendors = require("./vendors");
const quoteSummary = require("./quotesummary");
const exchange = require("./exchange");

router.use("/auth", auth);
router.use("/users", users);
router.use("/rfqs", rfq);
router.use("/quotes", quote);
router.use("/vendors", vendors);
router.use("/quotesummary", quoteSummary);
router.use("/exchange", exchange);

module.exports = router;
