const express = require("express");
const {
    register, login, refreshToken, logout, self, generic, changePassword
} = require("../controllers/authController");
const { getAllUsers, updateUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", authMiddleware, logout);
router.post("/self", authMiddleware, self);
router.get("/users", authMiddleware, getAllUsers);
router.put("/update/user/:id", authMiddleware, updateUser);
router.post("/generic", authMiddleware, generic);
router.post("/change", authMiddleware, changePassword);

module.exports = router;
