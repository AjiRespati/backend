const express = require("express");
const { register, login, refreshToken, logout, self } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refreshToken", refreshToken);
router.post("/logout", authMiddleware, logout);
router.post("/self", authMiddleware, self);

module.exports = router;
