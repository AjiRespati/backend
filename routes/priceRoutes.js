const express = require("express");
const { createPrice, getPricesByMetric, updatePrice } = require("../controllers/priceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createPrice);
router.get("/:metricId", authMiddleware, getPricesByMetric);
router.put("/:id", authMiddleware, updatePrice);

module.exports = router;
