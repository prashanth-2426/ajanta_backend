const express = require("express");
const multer = require("multer");
const router = express.Router();
const vendorController = require("../controllers/vendor");

const { verifyToken } = require("../middlewares/auth");

// Protect all routes
router.use(verifyToken);

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", vendorController.getVendors);
router.post("/upload", upload.single("excel"), vendorController.uploadVendors);

module.exports = router;
