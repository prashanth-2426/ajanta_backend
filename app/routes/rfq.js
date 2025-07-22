const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfq");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Protect all RFQ routes
router.use(verifyToken);

router.post("/", upload.array("attachments", 10), rfqController.createRFQ);
router.get("/", rfqController.getAllRFQs);
router.get("/:id", rfqController.getRFQById);
router.put("/:id", rfqController.updateRFQ);
router.post("/:rfq_number/delete", rfqController.deleteRFQ);
router.post("/update-status", rfqController.updateRfqStatus);

module.exports = router;
