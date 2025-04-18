const express = require("express");
const {  getAllUsers, deleteUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authMiddleware, getAllUsers);
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
