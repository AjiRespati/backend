const express = require("express");
const { createRefrigerator, getAllRefrigerators, updateRefrigerator } = require("../controllers/refrigeratorController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createRefrigerator);
router.get("/", authMiddleware, getAllRefrigerators);
router.put("/:id", authMiddleware, updateRefrigerator);

module.exports = router;
