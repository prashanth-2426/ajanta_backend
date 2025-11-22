// middlewares/upload.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "rfq")); // Store in uploads/rfq
  },
  filename: function (req, file, cb) {
    const uniqueName =
      //Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
      file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
module.exports = upload;
