const express = require("express");
const { createPercentage, percentageList, updatePercentage } = require("../controllers/percentageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createPercentage);
router.get("/", authMiddleware, percentageList);
router.put("/:id", authMiddleware, updatePercentage);

module.exports = router;
