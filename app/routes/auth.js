const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth");
const { verifyToken } = require("../middlewares/auth");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", verifyToken, authController.logout);

router.post("/validate-email", authController.validateEmail);

router.post("/reset-password", authController.updatePassword);

router.post("/verify-token", verifyToken, authController.verifyToken);
router.post("/:id/delete-user", verifyToken, authController.deleteUser);
router.post(
  "/:id/toggle-user-approval",
  verifyToken,
  authController.toggleUserApproval
);
router.get("/:id", verifyToken, authController.getUserById);
router.post("/:id", verifyToken, authController.updateUser);

module.exports = router;
