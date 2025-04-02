const express = require("express");
const { register, login, refreshToken, logout, self } = require("../controllers/authController");
const {  getAllUsers } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refreshToken", refreshToken);
router.post("/logout", authMiddleware, logout);
router.post("/self", authMiddleware, self);
router.get("/users", authMiddleware, getAllUsers);

module.exports = router;
