const express = require("express");
const router = express.Router();
const multer = require("multer");
const invoiceController = require("../controllers/invoice");
const { verifyToken } = require("../middlewares/auth");

router.use(verifyToken);

const fs = require("fs");
const path = require("path");

const uploadPath = path.join(__dirname, "../uploads/invoices");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});

const upload = multer({ storage });

router.post(
  "/submit",
  (req, res, next) => {
    console.log("Invoice route hit");
    next();
  },
  upload.array("documents", 10),
  (req, res, next) => {
    console.log("Files received:", req.files);
    next();
  },
  invoiceController.submitInvoice,
);

router.get("/:rfq_number", invoiceController.getInvoicesByRfq);

module.exports = router;
