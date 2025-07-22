const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const { verifyToken } = require("../middlewares/auth");

// Protect all routes
router.use(verifyToken);

// User CRUD
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
